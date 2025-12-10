import { Router, Request, Response } from 'express';
import { db } from '../db';
import { platformConfig, users } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { requireSuperAdmin, populateUserFromSession } from '../middleware/auth';

const router = Router();

const DEFAULT_SETTINGS = {
  general: {
    platformName: 'SalonHub',
    platformTagline: 'Connect with the best salons near you',
    contactEmail: 'support@salonhub.com',
    contactPhone: '+91-9999999999',
    defaultCurrency: 'INR',
    defaultTimezone: 'Asia/Kolkata',
    defaultLanguage: 'en',
  },
  booking: {
    advanceBookingDays: 30,
    minBookingNoticeMins: 60,
    maxServicesPerBooking: 5,
    bufferTimeMins: 15,
    allowInstantBooking: true,
    requirePhoneVerification: false,
    cancellationWindowHours: 24,
    rescheduleWindowHours: 12,
    noShowPenaltyPercent: 0,
  },
  payment: {
    razorpayEnabled: true,
    defaultCommissionPercent: 10,
    minPayoutAmountPaisa: 50000,
    payoutFrequency: 'weekly',
    gstPercent: 18,
    allowPartialPayments: false,
    allowCashPayments: true,
    allowWalletPayments: true,
  },
  communication: {
    sendGridEnabled: false,
    twilioEnabled: false,
    enableEmailNotifications: true,
    enableSmsNotifications: true,
    enablePushNotifications: true,
    bookingConfirmationEmail: true,
    bookingReminderHoursBefore: 24,
    marketingEmailsEnabled: false,
  },
  security: {
    minPasswordLength: 8,
    requirePasswordUppercase: true,
    requirePasswordNumber: true,
    requirePasswordSpecial: false,
    sessionTimeoutMins: 1440,
    maxLoginAttempts: 5,
    lockoutDurationMins: 30,
    require2FAForAdmin: false,
    enableAuditLogs: true,
  },
  features: {
    enableEvents: true,
    enableShop: true,
    enableLoyalty: true,
    enableReferrals: true,
    enableAIConsultant: true,
    enableJobCards: true,
    enableMetaIntegration: true,
    enableSmartRebooking: true,
    enableGiftCards: true,
    enableCustomerImport: true,
    enableReviews: true,
    enableWaitlist: false,
    enableDynamicPricing: false,
  },
  maintenance: {
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
    maintenanceEndTime: null as string | null,
    allowAdminAccess: true,
  },
  branding: {
    primaryColor: '#8B5CF6',
    secondaryColor: '#EC4899',
    logoUrl: '',
    faviconUrl: '',
    footerText: '© 2025 SalonHub. All rights reserved.',
    showPoweredBy: true,
  },
};

type SettingsCategory = keyof typeof DEFAULT_SETTINGS;

router.get('/admin/all', populateUserFromSession, requireSuperAdmin(), async (req: Request, res: Response) => {
  try {
    const configs = await db.select().from(platformConfig);
    
    const settings: Record<string, any> = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    
    for (const config of configs) {
      if (config.configKey.includes('.')) {
        const [category, key] = config.configKey.split('.');
        if (settings[category]) {
          settings[category][key] = config.configValue;
        }
      } else {
        const categorySettings = config.configValue as Record<string, any>;
        if (settings[config.configKey]) {
          settings[config.configKey] = { ...settings[config.configKey], ...categorySettings };
        }
      }
    }
    
    res.json({ settings, lastUpdated: configs[0]?.updatedAt });
  } catch (error: any) {
    console.error('Error fetching platform settings:', error);
    res.status(500).json({ error: 'Failed to fetch platform settings' });
  }
});

router.get('/admin/:category', populateUserFromSession, requireSuperAdmin(), async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    
    if (!DEFAULT_SETTINGS[category as SettingsCategory]) {
      return res.status(404).json({ error: 'Settings category not found' });
    }
    
    const [config] = await db
      .select()
      .from(platformConfig)
      .where(eq(platformConfig.configKey, category));
    
    const settings = config 
      ? { ...DEFAULT_SETTINGS[category as SettingsCategory], ...(config.configValue as Record<string, any>) }
      : DEFAULT_SETTINGS[category as SettingsCategory];
    
    res.json({ 
      category, 
      settings,
      lastUpdated: config?.updatedAt 
    });
  } catch (error: any) {
    console.error('Error fetching settings category:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/admin/:category', populateUserFromSession, requireSuperAdmin(), async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const userId = (req.user as any)?.id;
    
    if (!DEFAULT_SETTINGS[category as SettingsCategory]) {
      return res.status(404).json({ error: 'Settings category not found' });
    }
    
    const updates = req.body;
    
    const allowedKeys = Object.keys(DEFAULT_SETTINGS[category as SettingsCategory]);
    const sanitizedUpdates: Record<string, any> = {};
    
    for (const key of Object.keys(updates)) {
      if (allowedKeys.includes(key)) {
        sanitizedUpdates[key] = updates[key];
      }
    }
    
    const [existingConfig] = await db
      .select()
      .from(platformConfig)
      .where(eq(platformConfig.configKey, category));
    
    if (existingConfig) {
      const currentSettings = existingConfig.configValue as Record<string, any>;
      const mergedSettings = { ...currentSettings, ...sanitizedUpdates };
      
      await db
        .update(platformConfig)
        .set({
          configValue: mergedSettings,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(platformConfig.configKey, category));
    } else {
      await db.insert(platformConfig).values({
        configKey: category,
        configValue: sanitizedUpdates,
        description: `${category.charAt(0).toUpperCase() + category.slice(1)} settings`,
        updatedBy: userId,
      });
    }
    
    const [updatedConfig] = await db
      .select()
      .from(platformConfig)
      .where(eq(platformConfig.configKey, category));
    
    const finalSettings = {
      ...DEFAULT_SETTINGS[category as SettingsCategory],
      ...(updatedConfig?.configValue as Record<string, any>),
    };
    
    res.json({ 
      success: true, 
      message: `${category} settings updated successfully`,
      settings: finalSettings,
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

router.post('/admin/reset/:category', populateUserFromSession, requireSuperAdmin(), async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    
    if (!DEFAULT_SETTINGS[category as SettingsCategory]) {
      return res.status(404).json({ error: 'Settings category not found' });
    }
    
    await db
      .delete(platformConfig)
      .where(eq(platformConfig.configKey, category));
    
    res.json({ 
      success: true, 
      message: `${category} settings reset to defaults`,
      settings: DEFAULT_SETTINGS[category as SettingsCategory],
    });
  } catch (error: any) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

router.get('/admin/audit-log', populateUserFromSession, requireSuperAdmin(), async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.query;
    
    const configs = await db
      .select({
        id: platformConfig.id,
        configKey: platformConfig.configKey,
        updatedBy: platformConfig.updatedBy,
        updatedAt: platformConfig.updatedAt,
        updatedByUser: users.email,
      })
      .from(platformConfig)
      .leftJoin(users, eq(platformConfig.updatedBy, users.id))
      .orderBy(desc(platformConfig.updatedAt))
      .limit(Number(limit));
    
    res.json({ auditLog: configs });
  } catch (error: any) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

router.get('/admin/defaults', populateUserFromSession, requireSuperAdmin(), async (req: Request, res: Response) => {
  res.json({ defaults: DEFAULT_SETTINGS });
});

router.post('/admin/toggle-maintenance', populateUserFromSession, requireSuperAdmin(), async (req: Request, res: Response) => {
  try {
    const { enabled, message, endTime } = req.body;
    const userId = (req.user as any)?.id;
    
    const maintenanceSettings = {
      maintenanceMode: enabled,
      maintenanceMessage: message || DEFAULT_SETTINGS.maintenance.maintenanceMessage,
      maintenanceEndTime: endTime || null,
      allowAdminAccess: true,
    };
    
    const [existingConfig] = await db
      .select()
      .from(platformConfig)
      .where(eq(platformConfig.configKey, 'maintenance'));
    
    if (existingConfig) {
      await db
        .update(platformConfig)
        .set({
          configValue: maintenanceSettings,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(platformConfig.configKey, 'maintenance'));
    } else {
      await db.insert(platformConfig).values({
        configKey: 'maintenance',
        configValue: maintenanceSettings,
        description: 'Maintenance mode settings',
        updatedBy: userId,
      });
    }
    
    res.json({ 
      success: true, 
      message: enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
      settings: maintenanceSettings,
    });
  } catch (error: any) {
    console.error('Error toggling maintenance mode:', error);
    res.status(500).json({ error: 'Failed to toggle maintenance mode' });
  }
});

router.post('/admin/toggle-feature', populateUserFromSession, requireSuperAdmin(), async (req: Request, res: Response) => {
  try {
    const { feature, enabled } = req.body;
    const userId = (req.user as any)?.id;
    
    if (!Object.keys(DEFAULT_SETTINGS.features).includes(feature)) {
      return res.status(400).json({ error: 'Invalid feature key' });
    }
    
    const [existingConfig] = await db
      .select()
      .from(platformConfig)
      .where(eq(platformConfig.configKey, 'features'));
    
    const currentFeatures = existingConfig?.configValue as Record<string, boolean> || {};
    const updatedFeatures = { ...currentFeatures, [feature]: enabled };
    
    if (existingConfig) {
      await db
        .update(platformConfig)
        .set({
          configValue: updatedFeatures,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(platformConfig.configKey, 'features'));
    } else {
      await db.insert(platformConfig).values({
        configKey: 'features',
        configValue: updatedFeatures,
        description: 'Feature flags',
        updatedBy: userId,
      });
    }
    
    res.json({ 
      success: true, 
      feature,
      enabled,
      message: `Feature "${feature}" ${enabled ? 'enabled' : 'disabled'}`,
    });
  } catch (error: any) {
    console.error('Error toggling feature:', error);
    res.status(500).json({ error: 'Failed to toggle feature' });
  }
});

export default router;

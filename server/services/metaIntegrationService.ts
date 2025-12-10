import crypto from 'crypto';
import { db } from '../db';
import { 
  metaIntegrations,
  metaBookingRefs,
  metaWebhookEvents,
  socialBookingAnalytics,
  bookings,
  services,
  staff,
  salons,
} from '@shared/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { subscriptionService } from './subscriptionService';

const META_GRAPH_API_VERSION = 'v18.0';
const META_GRAPH_API_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const keyString = process.env.META_TOKEN_ENCRYPTION_KEY || process.env.JWT_ACCESS_SECRET || 'default-development-key-32chars!';
  return crypto.createHash('sha256').update(keyString).digest();
}

function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptToken(encryptedData: string | null | undefined): string | null {
  if (!encryptedData) {
    return null;
  }
  
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Token appears unencrypted - rejecting in production for security');
      return null;
    }
    console.warn('Token appears unencrypted - allowing in development only');
    return encryptedData;
  }
  
  try {
    const key = getEncryptionKey();
    const [ivHex, authTagHex, encrypted] = parts;
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error);
    return null;
  }
}

function getDecryptedToken(integration: any, tokenField: 'fbPageAccessToken' | 'igAccessToken' | 'metaUserAccessToken'): string | null {
  const encryptedToken = integration[tokenField];
  return decryptToken(encryptedToken);
}

export interface MetaOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface MetaPage {
  id: string;
  name: string;
  accessToken: string;
  category?: string;
  instagramBusinessAccount?: {
    id: string;
    username: string;
  };
}

export class MetaIntegrationService {
  private config: MetaOAuthConfig;

  constructor() {
    this.config = {
      clientId: process.env.META_APP_ID || '',
      clientSecret: process.env.META_APP_SECRET || '',
      redirectUri: process.env.META_REDIRECT_URI || `${process.env.REPLIT_DEV_DOMAIN || ''}/api/meta/callback`,
    };
  }

  getOAuthUrl(salonId: string, state?: string): string {
    const scopes = [
      'pages_manage_cta',
      'pages_read_engagement',
      'pages_messaging',
      'instagram_basic',
      'instagram_manage_messages',
      'business_management',
    ].join(',');

    const stateParam = state || Buffer.from(JSON.stringify({ salonId })).toString('base64');

    return `https://www.facebook.com/${META_GRAPH_API_VERSION}/dialog/oauth?` +
      `client_id=${this.config.clientId}` +
      `&redirect_uri=${encodeURIComponent(this.config.redirectUri)}` +
      `&scope=${scopes}` +
      `&state=${stateParam}` +
      `&response_type=code`;
  }

  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    expiresIn: number;
    userId: string;
  }> {
    const response = await fetch(
      `${META_GRAPH_API_URL}/oauth/access_token?` +
      `client_id=${this.config.clientId}` +
      `&client_secret=${this.config.clientSecret}` +
      `&redirect_uri=${encodeURIComponent(this.config.redirectUri)}` +
      `&code=${code}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to exchange code: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();

    const longLivedResponse = await fetch(
      `${META_GRAPH_API_URL}/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${this.config.clientId}` +
      `&client_secret=${this.config.clientSecret}` +
      `&fb_exchange_token=${data.access_token}`
    );

    if (!longLivedResponse.ok) {
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in || 3600,
        userId: '',
      };
    }

    const longLivedData = await longLivedResponse.json();

    const meResponse = await fetch(
      `${META_GRAPH_API_URL}/me?access_token=${longLivedData.access_token}`
    );
    const meData = await meResponse.json();

    return {
      accessToken: longLivedData.access_token,
      expiresIn: longLivedData.expires_in || 5184000,
      userId: meData.id,
    };
  }

  async getUserPages(userAccessToken: string): Promise<MetaPage[]> {
    const response = await fetch(
      `${META_GRAPH_API_URL}/me/accounts?` +
      `fields=id,name,access_token,category,instagram_business_account{id,username}` +
      `&access_token=${userAccessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to fetch pages: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    return data.data.map((page: any) => ({
      id: page.id,
      name: page.name,
      accessToken: page.access_token,
      category: page.category,
      instagramBusinessAccount: page.instagram_business_account ? {
        id: page.instagram_business_account.id,
        username: page.instagram_business_account.username,
      } : undefined,
    }));
  }

  async connectSalonToPage(
    salonId: string,
    page: MetaPage,
    userAccessToken: string,
    userId: string
  ) {
    const hasAccess = await subscriptionService.checkFeatureAccess(salonId, 'facebookBooking');
    if (!hasAccess) {
      throw new Error('Facebook booking feature requires Growth or Elite subscription');
    }

    const webhookVerifyToken = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const tokenExpiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const existing = await db
      .select()
      .from(metaIntegrations)
      .where(eq(metaIntegrations.salonId, salonId))
      .limit(1);

    const encryptedPageToken = encryptToken(page.accessToken);
    const encryptedUserToken = encryptToken(userAccessToken);

    if (existing.length > 0) {
      await db
        .update(metaIntegrations)
        .set({
          fbPageId: page.id,
          fbPageName: page.name,
          fbPageAccessToken: encryptedPageToken,
          fbPageTokenExpiresAt: tokenExpiresAt,
          igAccountId: page.instagramBusinessAccount?.id || null,
          igUsername: page.instagramBusinessAccount?.username || null,
          metaUserId: userId,
          metaUserAccessToken: encryptedUserToken,
          metaUserTokenExpiresAt: tokenExpiresAt,
          status: 'active',
          webhookVerifyToken,
          lastSyncAt: now,
          syncError: null,
          updatedAt: now,
        })
        .where(eq(metaIntegrations.id, existing[0].id));

      return existing[0].id;
    }

    const [integration] = await db.insert(metaIntegrations).values({
      salonId,
      fbPageId: page.id,
      fbPageName: page.name,
      fbPageAccessToken: encryptedPageToken,
      fbPageTokenExpiresAt: tokenExpiresAt,
      igAccountId: page.instagramBusinessAccount?.id,
      igUsername: page.instagramBusinessAccount?.username,
      metaUserId: userId,
      metaUserAccessToken: encryptedUserToken,
      metaUserTokenExpiresAt: tokenExpiresAt,
      status: 'active',
      webhookVerifyToken,
      lastSyncAt: now,
    }).returning();

    return integration.id;
  }

  async disconnectSalon(salonId: string) {
    const [integration] = await db
      .select()
      .from(metaIntegrations)
      .where(eq(metaIntegrations.salonId, salonId));

    if (!integration) {
      throw new Error('No Meta integration found for this salon');
    }

    await db
      .update(metaIntegrations)
      .set({
        status: 'disconnected',
        fbPageAccessToken: null,
        igAccessToken: null,
        metaUserAccessToken: null,
        updatedAt: new Date(),
      })
      .where(eq(metaIntegrations.id, integration.id));

    return { success: true };
  }

  async getIntegrationStatus(salonId: string) {
    const [integration] = await db
      .select()
      .from(metaIntegrations)
      .where(eq(metaIntegrations.salonId, salonId));

    if (!integration) {
      return {
        connected: false,
        facebook: null,
        instagram: null,
      };
    }

    const now = new Date();
    const fbTokenExpired = integration.fbPageTokenExpiresAt && integration.fbPageTokenExpiresAt < now;
    const igTokenExpired = integration.igTokenExpiresAt && integration.igTokenExpiresAt < now;

    return {
      connected: integration.status === 'active',
      status: integration.status,
      facebook: integration.fbPageId ? {
        pageId: integration.fbPageId,
        pageName: integration.fbPageName,
        tokenExpired: fbTokenExpired,
        tokenExpiresAt: integration.fbPageTokenExpiresAt,
      } : null,
      instagram: integration.igAccountId ? {
        accountId: integration.igAccountId,
        username: integration.igUsername,
        tokenExpired: igTokenExpired,
        tokenExpiresAt: integration.igTokenExpiresAt,
      } : null,
      lastSyncAt: integration.lastSyncAt,
      syncError: integration.syncError,
      settings: {
        bookingLeadTimeHours: integration.bookingLeadTimeHours,
        cancellationPolicy: integration.cancellationPolicy,
        autoConfirmBookings: integration.autoConfirmBookings === 1,
        sendDmReminders: integration.sendDmReminders === 1,
      },
    };
  }

  async updateIntegrationSettings(salonId: string, settings: {
    bookingLeadTimeHours?: number;
    cancellationPolicy?: string;
    autoConfirmBookings?: boolean;
    sendDmReminders?: boolean;
  }) {
    const [integration] = await db
      .select()
      .from(metaIntegrations)
      .where(eq(metaIntegrations.salonId, salonId));

    if (!integration) {
      throw new Error('No Meta integration found for this salon');
    }

    await db
      .update(metaIntegrations)
      .set({
        bookingLeadTimeHours: settings.bookingLeadTimeHours ?? integration.bookingLeadTimeHours,
        cancellationPolicy: settings.cancellationPolicy ?? integration.cancellationPolicy,
        autoConfirmBookings: settings.autoConfirmBookings !== undefined 
          ? (settings.autoConfirmBookings ? 1 : 0) 
          : integration.autoConfirmBookings,
        sendDmReminders: settings.sendDmReminders !== undefined 
          ? (settings.sendDmReminders ? 1 : 0) 
          : integration.sendDmReminders,
        updatedAt: new Date(),
      })
      .where(eq(metaIntegrations.id, integration.id));

    return this.getIntegrationStatus(salonId);
  }

  async getDecryptedAccessToken(salonId: string): Promise<{ pageToken: string | null; userToken: string | null }> {
    const [integration] = await db
      .select()
      .from(metaIntegrations)
      .where(eq(metaIntegrations.salonId, salonId));

    if (!integration) {
      return { pageToken: null, userToken: null };
    }

    return {
      pageToken: getDecryptedToken(integration, 'fbPageAccessToken'),
      userToken: getDecryptedToken(integration, 'metaUserAccessToken'),
    };
  }

  verifyWebhookSignature(payload: string, signature: string | undefined): { valid: boolean; error?: string } {
    if (!this.config.clientSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('META_APP_SECRET not configured in production - rejecting webhook');
        return { valid: false, error: 'META_APP_SECRET not configured' };
      }
      console.warn('META_APP_SECRET not configured - allowing webhook in development/sandbox mode');
      return { valid: true };
    }

    if (!signature) {
      return { valid: false, error: 'Missing X-Hub-Signature-256 header' };
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.config.clientSecret)
      .update(payload)
      .digest('hex');

    const providedSignature = signature.replace('sha256=', '');
    
    if (providedSignature.length !== expectedSignature.length) {
      return { valid: false, error: 'Invalid signature format' };
    }

    const isValid = crypto.timingSafeEqual(
      Buffer.from(providedSignature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      return { valid: false, error: 'Signature verification failed' };
    }

    return { valid: true };
  }

  async processWebhookEvent(eventType: string, payload: any, signature?: string) {
    const [event] = await db.insert(metaWebhookEvents).values({
      eventType,
      payload,
      signature,
      processed: 0,
    }).returning();

    try {
      switch (eventType) {
        case 'page':
          await this.handlePageEvent(payload);
          break;
        case 'instagram':
          await this.handleInstagramEvent(payload);
          break;
        case 'messaging':
          await this.handleMessagingEvent(payload);
          break;
        default:
          console.log(`Unhandled webhook event type: ${eventType}`);
      }

      await db
        .update(metaWebhookEvents)
        .set({
          processed: 1,
          processedAt: new Date(),
        })
        .where(eq(metaWebhookEvents.id, event.id));

    } catch (error: any) {
      await db
        .update(metaWebhookEvents)
        .set({
          processed: 0,
          error: error.message,
        })
        .where(eq(metaWebhookEvents.id, event.id));
      throw error;
    }

    return event.id;
  }

  private async handlePageEvent(payload: any) {
    console.log('Processing page event:', JSON.stringify(payload, null, 2));
  }

  private async handleInstagramEvent(payload: any) {
    console.log('Processing Instagram event:', JSON.stringify(payload, null, 2));
  }

  private async handleMessagingEvent(payload: any) {
    console.log('Processing messaging event:', JSON.stringify(payload, null, 2));
  }

  async trackButtonClick(salonId: string, source: 'instagram' | 'facebook') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [existing] = await db
      .select()
      .from(socialBookingAnalytics)
      .where(
        and(
          eq(socialBookingAnalytics.salonId, salonId),
          eq(socialBookingAnalytics.source, source),
          gte(socialBookingAnalytics.date, today)
        )
      );

    if (existing) {
      await db
        .update(socialBookingAnalytics)
        .set({
          buttonClicks: existing.buttonClicks + 1,
        })
        .where(eq(socialBookingAnalytics.id, existing.id));
    } else {
      await db.insert(socialBookingAnalytics).values({
        salonId,
        date: today,
        source,
        buttonClicks: 1,
      });
    }
  }

  async trackBookingStarted(salonId: string, source: 'instagram' | 'facebook') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [existing] = await db
      .select()
      .from(socialBookingAnalytics)
      .where(
        and(
          eq(socialBookingAnalytics.salonId, salonId),
          eq(socialBookingAnalytics.source, source),
          gte(socialBookingAnalytics.date, today)
        )
      );

    if (existing) {
      await db
        .update(socialBookingAnalytics)
        .set({
          bookingStarted: existing.bookingStarted + 1,
        })
        .where(eq(socialBookingAnalytics.id, existing.id));
    }
  }

  async trackBookingCompleted(salonId: string, source: 'instagram' | 'facebook', revenuePaisa: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [existing] = await db
      .select()
      .from(socialBookingAnalytics)
      .where(
        and(
          eq(socialBookingAnalytics.salonId, salonId),
          eq(socialBookingAnalytics.source, source),
          gte(socialBookingAnalytics.date, today)
        )
      );

    if (existing) {
      await db
        .update(socialBookingAnalytics)
        .set({
          bookingsCompleted: existing.bookingsCompleted + 1,
          revenuePaisa: existing.revenuePaisa + revenuePaisa,
        })
        .where(eq(socialBookingAnalytics.id, existing.id));
    }
  }

  async getAnalytics(salonId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const analytics = await db
      .select()
      .from(socialBookingAnalytics)
      .where(
        and(
          eq(socialBookingAnalytics.salonId, salonId),
          gte(socialBookingAnalytics.date, startDate)
        )
      )
      .orderBy(desc(socialBookingAnalytics.date));

    const totals = {
      instagram: {
        buttonClicks: 0,
        bookingStarted: 0,
        bookingsCompleted: 0,
        bookingsCancelled: 0,
        revenue: 0,
      },
      facebook: {
        buttonClicks: 0,
        bookingStarted: 0,
        bookingsCompleted: 0,
        bookingsCancelled: 0,
        revenue: 0,
      },
    };

    for (const record of analytics) {
      const source = record.source as 'instagram' | 'facebook';
      if (totals[source]) {
        totals[source].buttonClicks += record.buttonClicks;
        totals[source].bookingStarted += record.bookingStarted;
        totals[source].bookingsCompleted += record.bookingsCompleted;
        totals[source].bookingsCancelled += record.bookingsCancelled;
        totals[source].revenue += record.revenuePaisa / 100;
      }
    }

    return {
      period: { start: startDate, end: new Date() },
      totals,
      daily: analytics.map(a => ({
        date: a.date,
        source: a.source,
        buttonClicks: a.buttonClicks,
        bookingStarted: a.bookingStarted,
        bookingsCompleted: a.bookingsCompleted,
        bookingsCancelled: a.bookingsCancelled,
        revenue: a.revenuePaisa / 100,
        conversionRate: a.buttonClicks > 0 
          ? ((a.bookingsCompleted / a.buttonClicks) * 100).toFixed(1) 
          : '0',
      })),
    };
  }
}

export const metaIntegrationService = new MetaIntegrationService();

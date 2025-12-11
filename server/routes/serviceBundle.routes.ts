import { Router, Request, Response } from 'express';
import { serviceBundleService } from '../services/serviceBundle.service';
import { authenticateToken, requireSalonAccess } from '../middleware/auth';
import { authenticateMobileUser } from '../middleware/authMobile';
import { rbacService } from '../services/rbacService';
import { 
  createServicePackageSchema, 
  updateServicePackageSchema,
  bookPackageSchema,
  SERVICE_PACKAGE_CATEGORIES,
} from '@shared/schema';
import { z } from 'zod';

const router = Router();

router.get('/categories', (req: Request, res: Response) => {
  res.json({
    success: true,
    categories: SERVICE_PACKAGE_CATEGORIES,
  });
});

router.get('/salons/:salonId/packages', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { category, gender, featured } = req.query;

    const packages = await serviceBundleService.getPackagesForSalon(salonId, {
      category: category as string,
      gender: gender as string,
      featured: featured === 'true',
      activeOnly: true,
    });

    const categories = [...new Set(packages.map(p => p.category).filter(Boolean))];

    return res.json({
      success: true,
      packages,
      categories,
      totalCount: packages.length,
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

router.get('/packages/:packageId', async (req: Request, res: Response) => {
  try {
    const { packageId } = req.params;
    const pkg = await serviceBundleService.getPackageById(packageId);

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    return res.json({
      success: true,
      package: pkg,
    });
  } catch (error) {
    console.error('Error fetching package:', error);
    return res.status(500).json({ error: 'Failed to fetch package' });
  }
});

router.get('/packages/:packageId/availability', async (req: Request, res: Response) => {
  try {
    const { packageId } = req.params;
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({ error: 'Date and time are required' });
    }

    const availability = await serviceBundleService.checkPackageAvailability(
      packageId,
      date as string,
      time as string
    );

    return res.json({
      success: true,
      ...availability,
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return res.status(500).json({ error: 'Failed to check availability' });
  }
});

router.post('/salons/:salonId/packages', authenticateToken, requireSalonAccess(), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { salonId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userSalons = await rbacService.getSalonsForUser(userId);
    const salonAccess = userSalons.find(s => s.salonId === salonId);
    const allowedRoles = ['business_owner', 'owner', 'manager', 'shop_admin'];
    
    if (!salonAccess || !allowedRoles.includes(salonAccess.role)) {
      return res.status(403).json({ error: 'Not authorized to create packages for this salon' });
    }

    const validatedInput = createServicePackageSchema.parse(req.body);
    const result = await serviceBundleService.createPackage(salonId, {
      ...validatedInput,
      validFrom: validatedInput.validFrom ? new Date(validatedInput.validFrom) : null,
      validUntil: validatedInput.validUntil ? new Date(validatedInput.validUntil) : null,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({
      success: true,
      message: 'Package created successfully',
      package: result.package,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating package:', error);
    return res.status(500).json({ error: 'Failed to create package' });
  }
});

router.put('/packages/:packageId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { packageId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const pkg = await serviceBundleService.getPackageById(packageId);
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const userSalons = await rbacService.getSalonsForUser(userId);
    const salonAccess = userSalons.find(s => s.salonId === pkg.salonId);
    const allowedRoles = ['business_owner', 'owner', 'manager', 'shop_admin'];
    
    if (!salonAccess || !allowedRoles.includes(salonAccess.role)) {
      return res.status(403).json({ error: 'Not authorized to update this package' });
    }

    const validatedInput = updateServicePackageSchema.parse(req.body);
    const result = await serviceBundleService.updatePackage(packageId, pkg.salonId, {
      ...validatedInput,
      validFrom: validatedInput.validFrom ? new Date(validatedInput.validFrom) : undefined,
      validUntil: validatedInput.validUntil ? new Date(validatedInput.validUntil) : undefined,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      success: true,
      message: 'Package updated successfully',
      package: result.package,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating package:', error);
    return res.status(500).json({ error: 'Failed to update package' });
  }
});

router.delete('/packages/:packageId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { packageId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const pkg = await serviceBundleService.getPackageById(packageId);
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const userSalons = await rbacService.getSalonsForUser(userId);
    const salonAccess = userSalons.find(s => s.salonId === pkg.salonId);
    const allowedRoles = ['business_owner', 'owner', 'manager'];
    
    if (!salonAccess || !allowedRoles.includes(salonAccess.role)) {
      return res.status(403).json({ error: 'Not authorized to delete this package' });
    }

    const result = await serviceBundleService.deletePackage(packageId, pkg.salonId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      success: true,
      message: 'Package deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    return res.status(500).json({ error: 'Failed to delete package' });
  }
});

router.get('/salons/:salonId/packages/manage', authenticateToken, requireSalonAccess(), async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    const packages = await serviceBundleService.getPackagesForSalon(salonId, {
      activeOnly: false,
      includeExpired: true,
    });

    return res.json({
      success: true,
      packages,
      categories: SERVICE_PACKAGE_CATEGORIES,
    });
  } catch (error) {
    console.error('Error fetching packages for management:', error);
    return res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

router.get('/salons/:salonId/packages/analytics', authenticateToken, requireSalonAccess(), async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    const analytics = await serviceBundleService.getPackageAnalytics(salonId);

    return res.json({
      success: true,
      ...analytics,
    });
  } catch (error) {
    console.error('Error fetching package analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.post('/packages/book', authenticateToken, async (req: any, res: Response) => {
  try {
    const parsed = bookPackageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: 'Invalid booking data', 
        details: parsed.error.errors 
      });
    }

    const { packageId, salonId, date, time, staffId, notes } = parsed.data;

    if (!req.body.customerName || !req.body.customerEmail || !req.body.customerPhone) {
      return res.status(400).json({ error: 'Customer name, email, and phone are required' });
    }

    const result = await serviceBundleService.bookPackage({
      packageId,
      salonId,
      userId: req.user?.id,
      customerName: req.body.customerName,
      customerEmail: req.body.customerEmail,
      customerPhone: req.body.customerPhone,
      date,
      time,
      staffId,
      notes,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({
      success: true,
      booking: result.booking,
      packageBooking: result.packageBooking,
      message: 'Package booked successfully',
    });
  } catch (error) {
    console.error('Error booking package:', error);
    return res.status(500).json({ error: 'Failed to book package' });
  }
});

export default router;

const mobileRouter = Router();

mobileRouter.get('/categories', (req: Request, res: Response) => {
  res.json({
    success: true,
    categories: SERVICE_PACKAGE_CATEGORIES,
  });
});

mobileRouter.get('/salons/:salonId/packages', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { category, gender, featured } = req.query;

    const packages = await serviceBundleService.getPackagesForSalon(salonId, {
      category: category as string,
      gender: gender as string,
      featured: featured === 'true',
      activeOnly: true,
    });

    const categories = [...new Set(packages.map(p => p.category).filter(Boolean))];

    return res.json({
      success: true,
      packages,
      categories,
      totalCount: packages.length,
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

mobileRouter.get('/packages/:packageId', async (req: Request, res: Response) => {
  try {
    const { packageId } = req.params;
    const pkg = await serviceBundleService.getPackageById(packageId);

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    return res.json({
      success: true,
      package: pkg,
    });
  } catch (error) {
    console.error('Error fetching package:', error);
    return res.status(500).json({ error: 'Failed to fetch package' });
  }
});

mobileRouter.get('/packages/:packageId/availability', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const { packageId } = req.params;
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({ error: 'Date and time are required' });
    }

    const availability = await serviceBundleService.checkPackageAvailability(
      packageId,
      date as string,
      time as string
    );

    return res.json({
      success: true,
      ...availability,
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return res.status(500).json({ error: 'Failed to check availability' });
  }
});

mobileRouter.post('/packages/book', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const parsed = bookPackageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: 'Invalid booking data', 
        details: parsed.error.errors 
      });
    }

    const { packageId, salonId, date, time, staffId, notes } = parsed.data;

    if (!req.body.customerName || !req.body.customerEmail || !req.body.customerPhone) {
      return res.status(400).json({ error: 'Customer name, email, and phone are required' });
    }

    const result = await serviceBundleService.bookPackage({
      packageId,
      salonId,
      userId: req.user?.id,
      customerName: req.body.customerName,
      customerEmail: req.body.customerEmail,
      customerPhone: req.body.customerPhone,
      date,
      time,
      staffId,
      notes,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({
      success: true,
      booking: result.booking,
      packageBooking: result.packageBooking,
      message: 'Package booked successfully',
    });
  } catch (error) {
    console.error('Error booking package:', error);
    return res.status(500).json({ error: 'Failed to book package' });
  }
});

export { mobileRouter as mobileServiceBundleRouter };

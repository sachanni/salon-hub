import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  favoriteSalons, 
  favoriteStylists, 
  salons, 
  staff,
  users
} from '../../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

const router = Router();

router.get('/salons', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const favorites = await db.select({
      favorite: favoriteSalons,
      salon: salons,
    })
      .from(favoriteSalons)
      .innerJoin(salons, eq(favoriteSalons.salonId, salons.id))
      .where(eq(favoriteSalons.userId, userId))
      .orderBy(desc(favoriteSalons.createdAt))
      .limit(limit)
      .offset(offset);
    
    const formattedSalons = favorites.map(f => ({
      ...f.salon,
      favoriteId: f.favorite.id,
      favoritedAt: f.favorite.createdAt,
      isFavorite: true,
    }));
    
    res.json({ success: true, salons: formattedSalons });
  } catch (error) {
    console.error('Error fetching favorite salons:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch favorite salons' });
  }
});

router.post('/salons/:salonId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { salonId } = req.params;
    
    const salon = await db.select().from(salons).where(eq(salons.id, salonId)).limit(1);
    if (!salon[0]) {
      return res.status(404).json({ success: false, error: 'Salon not found' });
    }
    
    const existing = await db.select()
      .from(favoriteSalons)
      .where(and(
        eq(favoriteSalons.userId, userId),
        eq(favoriteSalons.salonId, salonId)
      ))
      .limit(1);
    
    if (existing[0]) {
      return res.json({ success: true, message: 'Already in favorites', favorite: existing[0] });
    }
    
    const [favorite] = await db.insert(favoriteSalons).values({
      userId,
      salonId,
    }).returning();
    
    res.json({ success: true, message: 'Added to favorites', favorite });
  } catch (error) {
    console.error('Error adding salon to favorites:', error);
    res.status(500).json({ success: false, error: 'Failed to add to favorites' });
  }
});

router.delete('/salons/:salonId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { salonId } = req.params;
    
    await db.delete(favoriteSalons)
      .where(and(
        eq(favoriteSalons.userId, userId),
        eq(favoriteSalons.salonId, salonId)
      ));
    
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing salon from favorites:', error);
    res.status(500).json({ success: false, error: 'Failed to remove from favorites' });
  }
});

router.get('/salons/:salonId/check', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.json({ success: true, isFavorite: false });
    }
    
    const { salonId } = req.params;
    
    const existing = await db.select()
      .from(favoriteSalons)
      .where(and(
        eq(favoriteSalons.userId, userId),
        eq(favoriteSalons.salonId, salonId)
      ))
      .limit(1);
    
    res.json({ success: true, isFavorite: !!existing[0] });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({ success: false, error: 'Failed to check favorite status' });
  }
});

router.get('/salons/ids', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.json({ success: true, salonIds: [] });
    }
    
    const favorites = await db.select({ salonId: favoriteSalons.salonId })
      .from(favoriteSalons)
      .where(eq(favoriteSalons.userId, userId));
    
    const salonIds = favorites.map(f => f.salonId);
    
    res.json({ success: true, salonIds });
  } catch (error) {
    console.error('Error fetching favorite salon IDs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch favorite IDs' });
  }
});

router.get('/stylists', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const favorites = await db.select({
      favorite: favoriteStylists,
      stylist: staff,
      salon: salons,
    })
      .from(favoriteStylists)
      .innerJoin(staff, eq(favoriteStylists.staffId, staff.id))
      .innerJoin(salons, eq(staff.salonId, salons.id))
      .where(eq(favoriteStylists.userId, userId))
      .orderBy(desc(favoriteStylists.createdAt))
      .limit(limit)
      .offset(offset);
    
    const formattedStylists = favorites.map(f => ({
      ...f.stylist,
      salon: {
        id: f.salon.id,
        name: f.salon.name,
        address: f.salon.address,
        imageUrl: f.salon.imageUrl,
      },
      favoriteId: f.favorite.id,
      favoritedAt: f.favorite.createdAt,
      isFavorite: true,
    }));
    
    res.json({ success: true, stylists: formattedStylists });
  } catch (error) {
    console.error('Error fetching favorite stylists:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch favorite stylists' });
  }
});

router.post('/stylists/:staffId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { staffId } = req.params;
    
    const stylist = await db.select().from(staff).where(eq(staff.id, staffId)).limit(1);
    if (!stylist[0]) {
      return res.status(404).json({ success: false, error: 'Stylist not found' });
    }
    
    const existing = await db.select()
      .from(favoriteStylists)
      .where(and(
        eq(favoriteStylists.userId, userId),
        eq(favoriteStylists.staffId, staffId)
      ))
      .limit(1);
    
    if (existing[0]) {
      return res.json({ success: true, message: 'Already in favorites', favorite: existing[0] });
    }
    
    const [favorite] = await db.insert(favoriteStylists).values({
      userId,
      staffId,
    }).returning();
    
    res.json({ success: true, message: 'Added to favorites', favorite });
  } catch (error) {
    console.error('Error adding stylist to favorites:', error);
    res.status(500).json({ success: false, error: 'Failed to add to favorites' });
  }
});

router.delete('/stylists/:staffId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { staffId } = req.params;
    
    await db.delete(favoriteStylists)
      .where(and(
        eq(favoriteStylists.userId, userId),
        eq(favoriteStylists.staffId, staffId)
      ));
    
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing stylist from favorites:', error);
    res.status(500).json({ success: false, error: 'Failed to remove from favorites' });
  }
});

router.get('/stylists/:staffId/check', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.json({ success: true, isFavorite: false });
    }
    
    const { staffId } = req.params;
    
    const existing = await db.select()
      .from(favoriteStylists)
      .where(and(
        eq(favoriteStylists.userId, userId),
        eq(favoriteStylists.staffId, staffId)
      ))
      .limit(1);
    
    res.json({ success: true, isFavorite: !!existing[0] });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({ success: false, error: 'Failed to check favorite status' });
  }
});

router.get('/count', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.json({ success: true, salons: 0, stylists: 0 });
    }
    
    const [salonCount] = await db.select({ count: sql<number>`count(*)` })
      .from(favoriteSalons)
      .where(eq(favoriteSalons.userId, userId));
    
    const [stylistCount] = await db.select({ count: sql<number>`count(*)` })
      .from(favoriteStylists)
      .where(eq(favoriteStylists.userId, userId));
    
    res.json({ 
      success: true, 
      salons: salonCount.count,
      stylists: stylistCount.count,
      total: salonCount.count + stylistCount.count,
    });
  } catch (error) {
    console.error('Error fetching favorites count:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch count' });
  }
});

export default router;
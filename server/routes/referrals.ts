import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  referralCodes, 
  referrals, 
  users,
  userPoints,
  pointTransactions
} from '../../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

const router = Router();

function generateReferralCode(userName?: string): string {
  const prefix = userName 
    ? userName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X')
    : 'SLHB';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${suffix}`;
}

async function ensureUserReferralCode(userId: string, userName?: string) {
  const existing = await db.select()
    .from(referralCodes)
    .where(eq(referralCodes.userId, userId))
    .limit(1);
  
  if (existing[0]) {
    return existing[0];
  }
  
  let code = generateReferralCode(userName);
  let attempts = 0;
  
  while (attempts < 10) {
    const existingCode = await db.select()
      .from(referralCodes)
      .where(eq(referralCodes.code, code))
      .limit(1);
    
    if (!existingCode[0]) {
      break;
    }
    
    code = generateReferralCode(userName);
    attempts++;
  }
  
  const [newCode] = await db.insert(referralCodes).values({
    userId,
    code,
    referrerRewardPoints: 200,
    refereeRewardPoints: 100,
    refereeDiscountPercentage: '10.00',
  }).returning();
  
  return newCode;
}

async function awardReferralPoints(userId: string, points: number, source: string, description: string, referenceId: string) {
  const userPointsData = await db.select()
    .from(userPoints)
    .where(eq(userPoints.userId, userId))
    .limit(1);
  
  let currentPoints = 0;
  let lifetimePoints = 0;
  
  if (userPointsData[0]) {
    currentPoints = userPointsData[0].currentPoints;
    lifetimePoints = userPointsData[0].lifetimePoints;
  }
  
  const newBalance = currentPoints + points;
  const newLifetime = lifetimePoints + points;
  
  await db.insert(pointTransactions).values({
    userId,
    type: 'referral',
    points,
    balanceAfter: newBalance,
    source,
    referenceId,
    referenceType: 'referral',
    description,
  });
  
  if (userPointsData[0]) {
    await db.update(userPoints)
      .set({
        currentPoints: newBalance,
        lifetimePoints: newLifetime,
        lastPointsEarnedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userPoints.userId, userId));
  } else {
    await db.insert(userPoints).values({
      userId,
      currentPoints: newBalance,
      lifetimePoints: newLifetime,
      lastPointsEarnedAt: new Date(),
    });
  }
  
  return newBalance;
}

router.get('/my-code', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const user = await db.select({ 
      firstName: users.firstName, 
      lastName: users.lastName 
    }).from(users).where(eq(users.id, userId)).limit(1);
    
    const userName = user[0]?.firstName || user[0]?.lastName || undefined;
    const referralCode = await ensureUserReferralCode(userId, userName);
    
    res.json({ success: true, referralCode });
  } catch (error) {
    console.error('Error fetching referral code:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch referral code' });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const [totalReferrals] = await db.select({ count: sql<number>`count(*)` })
      .from(referrals)
      .where(eq(referrals.referrerId, userId));
    
    const [successfulReferrals] = await db.select({ count: sql<number>`count(*)` })
      .from(referrals)
      .where(and(
        eq(referrals.referrerId, userId),
        eq(referrals.status, 'rewarded')
      ));
    
    const [pendingReferrals] = await db.select({ count: sql<number>`count(*)` })
      .from(referrals)
      .where(and(
        eq(referrals.referrerId, userId),
        eq(referrals.status, 'pending')
      ));
    
    const pointsEarned = await db.select({ 
      total: sql<number>`COALESCE(SUM(referrer_points_awarded), 0)` 
    })
      .from(referrals)
      .where(eq(referrals.referrerId, userId));
    
    res.json({ 
      success: true, 
      stats: {
        totalReferrals: totalReferrals.count,
        successfulReferrals: successfulReferrals.count,
        pendingReferrals: pendingReferrals.count,
        pointsEarned: pointsEarned[0]?.total || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch referral stats' });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const referralHistory = await db.select({
      referral: referrals,
      referee: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        createdAt: users.createdAt,
      },
    })
      .from(referrals)
      .innerJoin(users, eq(referrals.refereeId, users.id))
      .where(eq(referrals.referrerId, userId))
      .orderBy(desc(referrals.createdAt))
      .limit(limit)
      .offset(offset);
    
    const formattedHistory = referralHistory.map(r => ({
      ...r.referral,
      referee: {
        ...r.referee,
        name: `${r.referee.firstName || ''} ${r.referee.lastName || ''}`.trim() || 'Unknown',
      },
    }));
    
    res.json({ success: true, referrals: formattedHistory });
  } catch (error) {
    console.error('Error fetching referral history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch referral history' });
  }
});

router.post('/validate', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, error: 'Referral code is required' });
    }
    
    const referralCode = await db.select()
      .from(referralCodes)
      .where(and(
        eq(referralCodes.code, code.toUpperCase()),
        eq(referralCodes.isActive, 1)
      ))
      .limit(1);
    
    if (!referralCode[0]) {
      return res.status(404).json({ success: false, error: 'Invalid referral code' });
    }
    
    const codeData = referralCode[0];
    
    if (userId && codeData.userId === userId) {
      return res.status(400).json({ success: false, error: 'You cannot use your own referral code' });
    }
    
    if (userId) {
      const existingReferral = await db.select()
        .from(referrals)
        .where(eq(referrals.refereeId, userId))
        .limit(1);
      
      if (existingReferral[0]) {
        return res.status(400).json({ 
          success: false, 
          error: 'You have already used a referral code' 
        });
      }
    }
    
    if (codeData.maxUses !== null && codeData.usedCount >= codeData.maxUses) {
      return res.status(400).json({ success: false, error: 'This referral code has reached its usage limit' });
    }
    
    if (codeData.expiresAt && new Date(codeData.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, error: 'This referral code has expired' });
    }
    
    const referrer = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
    }).from(users).where(eq(users.id, codeData.userId)).limit(1);
    
    res.json({ 
      success: true, 
      valid: true,
      referralCode: {
        code: codeData.code,
        refereeRewardPoints: codeData.refereeRewardPoints,
        refereeDiscountPercentage: codeData.refereeDiscountPercentage,
        referrerName: referrer[0] 
          ? `${referrer[0].firstName || ''} ${referrer[0].lastName || ''}`.trim() 
          : 'A friend',
      }
    });
  } catch (error) {
    console.error('Error validating referral code:', error);
    res.status(500).json({ success: false, error: 'Failed to validate referral code' });
  }
});

router.post('/apply', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, error: 'Referral code is required' });
    }
    
    const existingReferral = await db.select()
      .from(referrals)
      .where(eq(referrals.refereeId, userId))
      .limit(1);
    
    if (existingReferral[0]) {
      return res.status(400).json({ 
        success: false, 
        error: 'You have already used a referral code' 
      });
    }
    
    const referralCode = await db.select()
      .from(referralCodes)
      .where(and(
        eq(referralCodes.code, code.toUpperCase()),
        eq(referralCodes.isActive, 1)
      ))
      .limit(1);
    
    if (!referralCode[0]) {
      return res.status(404).json({ success: false, error: 'Invalid referral code' });
    }
    
    const codeData = referralCode[0];
    
    if (codeData.userId === userId) {
      return res.status(400).json({ success: false, error: 'You cannot use your own referral code' });
    }
    
    if (codeData.maxUses !== null && codeData.usedCount >= codeData.maxUses) {
      return res.status(400).json({ success: false, error: 'This referral code has reached its usage limit' });
    }
    
    if (codeData.expiresAt && new Date(codeData.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, error: 'This referral code has expired' });
    }
    
    const [referral] = await db.insert(referrals).values({
      referrerId: codeData.userId,
      refereeId: userId,
      referralCodeId: codeData.id,
      status: 'pending',
      refereePointsAwarded: codeData.refereeRewardPoints,
    }).returning();
    
    await awardReferralPoints(
      userId, 
      codeData.refereeRewardPoints, 
      'referral_signup',
      `Welcome bonus from referral`,
      referral.id
    );
    
    await db.update(referralCodes)
      .set({ usedCount: codeData.usedCount + 1 })
      .where(eq(referralCodes.id, codeData.id));
    
    res.json({ 
      success: true, 
      message: 'Referral code applied successfully',
      pointsEarned: codeData.refereeRewardPoints,
      discountPercentage: codeData.refereeDiscountPercentage,
    });
  } catch (error) {
    console.error('Error applying referral code:', error);
    res.status(500).json({ success: false, error: 'Failed to apply referral code' });
  }
});

router.post('/complete/:referralId', async (req: Request, res: Response) => {
  try {
    const { referralId } = req.params;
    const { bookingId } = req.body;
    
    const referral = await db.select()
      .from(referrals)
      .where(eq(referrals.id, referralId))
      .limit(1);
    
    if (!referral[0]) {
      return res.status(404).json({ success: false, error: 'Referral not found' });
    }
    
    if (referral[0].status === 'rewarded') {
      return res.json({ success: true, message: 'Referral already completed' });
    }
    
    const referralCode = await db.select()
      .from(referralCodes)
      .where(eq(referralCodes.id, referral[0].referralCodeId))
      .limit(1);
    
    if (referralCode[0]) {
      await awardReferralPoints(
        referral[0].referrerId,
        referralCode[0].referrerRewardPoints,
        'referral_complete',
        `Referral reward - friend completed first booking`,
        referralId
      );
      
      await db.update(referrals)
        .set({
          status: 'rewarded',
          referrerPointsAwarded: referralCode[0].referrerRewardPoints,
          refereeFirstBookingId: bookingId,
          refereeFirstBookingAt: new Date(),
          rewardedAt: new Date(),
        })
        .where(eq(referrals.id, referralId));
    }
    
    res.json({ success: true, message: 'Referral completed and rewards distributed' });
  } catch (error) {
    console.error('Error completing referral:', error);
    res.status(500).json({ success: false, error: 'Failed to complete referral' });
  }
});

export default router;
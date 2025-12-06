import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  loyaltyTiers, 
  userPoints, 
  pointTransactions, 
  rewards, 
  userRedeemedRewards,
  users
} from '../../shared/schema';
import { eq, desc, and, gte, lte, sql, isNull, or } from 'drizzle-orm';

const router = Router();

function generateRedemptionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'RWD';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function ensureUserPoints(userId: string) {
  const existing = await db.select().from(userPoints).where(eq(userPoints.userId, userId)).limit(1);
  
  if (existing.length === 0) {
    const bronzeTier = await db.select().from(loyaltyTiers).where(eq(loyaltyTiers.name, 'bronze')).limit(1);
    
    await db.insert(userPoints).values({
      userId,
      currentPoints: 0,
      lifetimePoints: 0,
      currentTierId: bronzeTier[0]?.id || null,
    });
    
    return (await db.select().from(userPoints).where(eq(userPoints.userId, userId)).limit(1))[0];
  }
  
  return existing[0];
}

async function calculateUserTier(lifetimePoints: number) {
  const tiers = await db.select()
    .from(loyaltyTiers)
    .where(eq(loyaltyTiers.isActive, 1))
    .orderBy(desc(loyaltyTiers.minPoints));
  
  for (const tier of tiers) {
    if (lifetimePoints >= tier.minPoints) {
      return tier;
    }
  }
  
  return tiers[tiers.length - 1];
}

router.get('/tiers', async (req: Request, res: Response) => {
  try {
    const tiers = await db.select()
      .from(loyaltyTiers)
      .where(eq(loyaltyTiers.isActive, 1))
      .orderBy(loyaltyTiers.sortOrder);
    
    res.json({ success: true, tiers });
  } catch (error) {
    console.error('Error fetching loyalty tiers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch loyalty tiers' });
  }
});

router.get('/points', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const userPointsData = await ensureUserPoints(userId);
    
    let currentTier = null;
    if (userPointsData.currentTierId) {
      const tierData = await db.select()
        .from(loyaltyTiers)
        .where(eq(loyaltyTiers.id, userPointsData.currentTierId))
        .limit(1);
      currentTier = tierData[0] || null;
    }
    
    const allTiers = await db.select()
      .from(loyaltyTiers)
      .where(eq(loyaltyTiers.isActive, 1))
      .orderBy(loyaltyTiers.sortOrder);
    
    let nextTier = null;
    let pointsToNextTier = 0;
    if (currentTier) {
      const nextTierData = allTiers.find(t => t.minPoints > (currentTier?.minPoints || 0));
      if (nextTierData) {
        nextTier = nextTierData;
        pointsToNextTier = nextTierData.minPoints - userPointsData.lifetimePoints;
      }
    }
    
    res.json({ 
      success: true, 
      points: {
        current: userPointsData.currentPoints,
        lifetime: userPointsData.lifetimePoints,
        lastEarnedAt: userPointsData.lastPointsEarnedAt,
      },
      tier: currentTier,
      nextTier,
      pointsToNextTier: Math.max(0, pointsToNextTier),
      allTiers,
    });
  } catch (error) {
    console.error('Error fetching user points:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user points' });
  }
});

router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const type = req.query.type as string;
    
    let query = db.select()
      .from(pointTransactions)
      .where(eq(pointTransactions.userId, userId))
      .orderBy(desc(pointTransactions.createdAt))
      .limit(limit)
      .offset(offset);
    
    if (type) {
      query = db.select()
        .from(pointTransactions)
        .where(and(
          eq(pointTransactions.userId, userId),
          eq(pointTransactions.type, type)
        ))
        .orderBy(desc(pointTransactions.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    const transactions = await query;
    
    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

router.post('/earn', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { points, source, referenceId, referenceType, description } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid points amount' });
    }
    
    const userPointsData = await ensureUserPoints(userId);
    
    let multiplier = 1;
    if (userPointsData.currentTierId) {
      const tier = await db.select()
        .from(loyaltyTiers)
        .where(eq(loyaltyTiers.id, userPointsData.currentTierId))
        .limit(1);
      if (tier[0]) {
        multiplier = parseFloat(tier[0].pointsMultiplier || '1');
      }
    }
    
    const earnedPoints = Math.floor(points * multiplier);
    const newBalance = userPointsData.currentPoints + earnedPoints;
    const newLifetime = userPointsData.lifetimePoints + earnedPoints;
    
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    
    await db.insert(pointTransactions).values({
      userId,
      type: 'earn',
      points: earnedPoints,
      balanceAfter: newBalance,
      source: source || 'booking',
      referenceId,
      referenceType,
      description: description || `Earned ${earnedPoints} points`,
      expiresAt,
    });
    
    const newTier = await calculateUserTier(newLifetime);
    
    await db.update(userPoints)
      .set({
        currentPoints: newBalance,
        lifetimePoints: newLifetime,
        currentTierId: newTier?.id,
        lastPointsEarnedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userPoints.userId, userId));
    
    res.json({ 
      success: true, 
      pointsEarned: earnedPoints,
      newBalance,
      newLifetime,
      tier: newTier,
    });
  } catch (error) {
    console.error('Error earning points:', error);
    res.status(500).json({ success: false, error: 'Failed to earn points' });
  }
});

router.get('/rewards', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const category = req.query.category as string;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const now = new Date();
    
    let conditions = [
      eq(rewards.isActive, 1),
      or(isNull(rewards.startDate), lte(rewards.startDate, now)),
      or(isNull(rewards.endDate), gte(rewards.endDate, now)),
    ];
    
    if (category) {
      conditions.push(eq(rewards.category, category));
    }
    
    const rewardsList = await db.select()
      .from(rewards)
      .where(and(...conditions))
      .orderBy(rewards.sortOrder, rewards.pointsCost)
      .limit(limit)
      .offset(offset);
    
    let userTier = null;
    let userCurrentPoints = 0;
    if (userId) {
      const userPointsData = await ensureUserPoints(userId);
      userCurrentPoints = userPointsData.currentPoints;
      if (userPointsData.currentTierId) {
        const tierData = await db.select()
          .from(loyaltyTiers)
          .where(eq(loyaltyTiers.id, userPointsData.currentTierId))
          .limit(1);
        userTier = tierData[0];
      }
    }
    
    const rewardsWithAvailability = rewardsList.map(reward => {
      const canAfford = userCurrentPoints >= reward.pointsCost;
      let tierEligible = true;
      
      if (reward.minTierRequired && userTier) {
        tierEligible = (userTier.sortOrder || 0) >= 0;
      }
      
      const quantityAvailable = reward.totalQuantity === null 
        ? null 
        : reward.totalQuantity - reward.redeemedCount;
      
      return {
        ...reward,
        canAfford,
        tierEligible,
        quantityAvailable,
        isAvailable: canAfford && tierEligible && (quantityAvailable === null || quantityAvailable > 0),
      };
    });
    
    res.json({ success: true, rewards: rewardsWithAvailability, userPoints: userCurrentPoints });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch rewards' });
  }
});

router.post('/rewards/:rewardId/redeem', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { rewardId } = req.params;
    
    const reward = await db.select()
      .from(rewards)
      .where(eq(rewards.id, rewardId))
      .limit(1);
    
    if (!reward[0]) {
      return res.status(404).json({ success: false, error: 'Reward not found' });
    }
    
    const rewardData = reward[0];
    
    if (!rewardData.isActive) {
      return res.status(400).json({ success: false, error: 'This reward is no longer available' });
    }
    
    if (rewardData.totalQuantity !== null && rewardData.redeemedCount >= rewardData.totalQuantity) {
      return res.status(400).json({ success: false, error: 'This reward is sold out' });
    }
    
    const userPointsData = await ensureUserPoints(userId);
    
    if (userPointsData.currentPoints < rewardData.pointsCost) {
      return res.status(400).json({ 
        success: false, 
        error: 'Insufficient points',
        required: rewardData.pointsCost,
        available: userPointsData.currentPoints,
      });
    }
    
    if (rewardData.maxRedemptionsPerUser) {
      const userRedemptions = await db.select({ count: sql<number>`count(*)` })
        .from(userRedeemedRewards)
        .where(and(
          eq(userRedeemedRewards.userId, userId),
          eq(userRedeemedRewards.rewardId, rewardId)
        ));
      
      if (userRedemptions[0].count >= rewardData.maxRedemptionsPerUser) {
        return res.status(400).json({ 
          success: false, 
          error: 'You have reached the maximum redemption limit for this reward' 
        });
      }
    }
    
    const redemptionCode = generateRedemptionCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rewardData.validityDays || 30));
    
    const newBalance = userPointsData.currentPoints - rewardData.pointsCost;
    
    await db.insert(pointTransactions).values({
      userId,
      type: 'redeem',
      points: -rewardData.pointsCost,
      balanceAfter: newBalance,
      source: 'reward',
      referenceId: rewardId,
      referenceType: 'reward',
      description: `Redeemed: ${rewardData.name}`,
    });
    
    await db.update(userPoints)
      .set({
        currentPoints: newBalance,
        lastPointsRedeemedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userPoints.userId, userId));
    
    const [redeemedReward] = await db.insert(userRedeemedRewards).values({
      userId,
      rewardId,
      pointsSpent: rewardData.pointsCost,
      redemptionCode,
      status: 'active',
      expiresAt,
    }).returning();
    
    await db.update(rewards)
      .set({ redeemedCount: rewardData.redeemedCount + 1 })
      .where(eq(rewards.id, rewardId));
    
    res.json({ 
      success: true, 
      redemption: {
        ...redeemedReward,
        reward: rewardData,
      },
      newBalance,
    });
  } catch (error) {
    console.error('Error redeeming reward:', error);
    res.status(500).json({ success: false, error: 'Failed to redeem reward' });
  }
});

router.get('/my-rewards', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    let conditions = [eq(userRedeemedRewards.userId, userId)];
    
    if (status) {
      conditions.push(eq(userRedeemedRewards.status, status));
    }
    
    const redeemedRewards = await db.select({
      redemption: userRedeemedRewards,
      reward: rewards,
    })
      .from(userRedeemedRewards)
      .innerJoin(rewards, eq(userRedeemedRewards.rewardId, rewards.id))
      .where(and(...conditions))
      .orderBy(desc(userRedeemedRewards.createdAt))
      .limit(limit)
      .offset(offset);
    
    const formattedRewards = redeemedRewards.map(r => ({
      ...r.redemption,
      reward: r.reward,
    }));
    
    res.json({ success: true, rewards: formattedRewards });
  } catch (error) {
    console.error('Error fetching my rewards:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch your rewards' });
  }
});

export default router;
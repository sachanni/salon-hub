import express, { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  createCampaign,
  getCampaign,
  getCampaignsBySalon,
  getCampaignStats,
  validateCampaignStart,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  getCampaignMessages,
  deleteCampaign,
  updateMessageDeliveryStatus,
  CAMPAIGN_STATUSES,
} from '../services/campaignService';
import { parseStatusCallback } from '../services/twilioService';
import { requireSalonAccess, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(255),
  channel: z.enum(['whatsapp', 'sms', 'both']),
  messageTemplate: z.string().min(1, 'Message template is required'),
  welcomeOfferId: z.string().optional(),
  scheduledFor: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
});

router.post(
  '/salons/:salonId/invitation-campaigns',
  requireSalonAccess(['owner', 'shop_admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const parseResult = createCampaignSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: parseResult.error.errors,
        });
      }

      const campaign = await createCampaign({
        salonId,
        createdBy: userId,
        ...parseResult.data,
      });

      res.status(201).json(campaign);
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ error: error.message || 'Failed to create campaign' });
    }
  }
);

router.get(
  '/salons/:salonId/invitation-campaigns',
  requireSalonAccess(['owner', 'shop_admin', 'staff']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId } = req.params;
      const campaigns = await getCampaignsBySalon(salonId);
      res.json(campaigns);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch campaigns' });
    }
  }
);

router.get(
  '/salons/:salonId/invitation-campaigns/:campaignId',
  requireSalonAccess(['owner', 'shop_admin', 'staff']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { campaignId } = req.params;
      const campaign = await getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      res.json(campaign);
    } catch (error: any) {
      console.error('Error fetching campaign:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch campaign' });
    }
  }
);

router.get(
  '/salons/:salonId/invitation-campaigns/:campaignId/stats',
  requireSalonAccess(['owner', 'shop_admin', 'staff']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { campaignId } = req.params;
      const stats = await getCampaignStats(campaignId);
      
      if (!stats) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching campaign stats:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch stats' });
    }
  }
);

router.post(
  '/salons/:salonId/invitation-campaigns/:campaignId/send',
  requireSalonAccess(['owner', 'shop_admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId, campaignId } = req.params;
      
      const validation = await validateCampaignStart(campaignId);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      if (validation.campaign && validation.campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Campaign does not belong to this salon' });
      }

      res.json({ 
        message: 'Campaign sending started',
        campaignId,
        status: CAMPAIGN_STATUSES.SENDING,
        targetCount: validation.pendingCount,
      });

      startCampaign(campaignId).then(result => {
        if (!result.success) {
          console.error(`Campaign ${campaignId} failed:`, result.error);
        } else {
          console.log(`Campaign ${campaignId} completed successfully`);
        }
      }).catch(error => {
        console.error(`Campaign ${campaignId} error:`, error);
      });

    } catch (error: any) {
      console.error('Error starting campaign:', error);
      res.status(500).json({ error: error.message || 'Failed to start campaign' });
    }
  }
);

router.post(
  '/salons/:salonId/invitation-campaigns/:campaignId/pause',
  requireSalonAccess(['owner', 'shop_admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId, campaignId } = req.params;
      
      const campaign = await getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      if (campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Campaign does not belong to this salon' });
      }

      const result = await pauseCampaign(campaignId);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ 
        message: 'Campaign paused',
        campaignId,
        status: CAMPAIGN_STATUSES.PAUSED,
      });
    } catch (error: any) {
      console.error('Error pausing campaign:', error);
      res.status(500).json({ error: error.message || 'Failed to pause campaign' });
    }
  }
);

router.post(
  '/salons/:salonId/invitation-campaigns/:campaignId/resume',
  requireSalonAccess(['owner', 'shop_admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId, campaignId } = req.params;
      
      const campaign = await getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      if (campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Campaign does not belong to this salon' });
      }

      if (campaign.status !== CAMPAIGN_STATUSES.PAUSED) {
        return res.status(400).json({ error: 'Campaign is not paused' });
      }

      res.json({ 
        message: 'Campaign resuming',
        campaignId,
        status: CAMPAIGN_STATUSES.SENDING,
      });

      resumeCampaign(campaignId).then(result => {
        if (!result.success) {
          console.error(`Campaign ${campaignId} resume failed:`, result.error);
        }
      }).catch(error => {
        console.error(`Campaign ${campaignId} resume error:`, error);
      });

    } catch (error: any) {
      console.error('Error resuming campaign:', error);
      res.status(500).json({ error: error.message || 'Failed to resume campaign' });
    }
  }
);

router.get(
  '/salons/:salonId/invitation-campaigns/:campaignId/messages',
  requireSalonAccess(['owner', 'shop_admin', 'staff']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { campaignId } = req.params;
      const { status, limit, offset } = req.query;

      const result = await getCampaignMessages(campaignId, {
        status: status as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch messages' });
    }
  }
);

router.delete(
  '/salons/:salonId/invitation-campaigns/:campaignId',
  requireSalonAccess(['owner']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId, campaignId } = req.params;
      
      const campaign = await getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      if (campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Campaign does not belong to this salon' });
      }

      const result = await deleteCampaign(campaignId);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Campaign deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      res.status(500).json({ error: error.message || 'Failed to delete campaign' });
    }
  }
);

export function registerTwilioWebhook(app: express.Application): void {
  app.post('/api/webhooks/twilio/status', express.urlencoded({ extended: false }), async (req: Request, res: Response) => {
    try {
      const payload = parseStatusCallback(req.body);
      
      if (!payload) {
        console.warn('Invalid Twilio status callback payload:', req.body);
        return res.sendStatus(400);
      }

      console.log(`Twilio status update: ${payload.messageSid} -> ${payload.status}`);

      await updateMessageDeliveryStatus(
        payload.messageSid,
        payload.status,
        payload.errorCode,
        payload.errorMessage
      );

      res.sendStatus(200);
    } catch (error: any) {
      console.error('Error processing Twilio webhook:', error);
      res.sendStatus(500);
    }
  });
}

export function registerCampaignRoutes(app: express.Application): void {
  app.use('/api', router);
  registerTwilioWebhook(app);
}

export default router;

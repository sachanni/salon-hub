import { Router, Request, Response } from 'express';
import { metaIntegrationService } from '../services/metaIntegrationService';
import { subscriptionService } from '../services/subscriptionService';
import { db } from '../db';
import { salons } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/connect/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    const [salon] = await db.select().from(salons).where(eq(salons.id, salonId));
    if (!salon) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    const hasAccess = await subscriptionService.checkFeatureAccess(salonId, 'facebookBooking');
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Facebook/Instagram booking requires Growth or Elite subscription',
        upgradeRequired: true,
      });
    }

    const state = Buffer.from(JSON.stringify({ salonId, timestamp: Date.now() })).toString('base64');
    const oauthUrl = metaIntegrationService.getOAuthUrl(salonId, state);

    res.json({ oauthUrl });
  } catch (error: any) {
    console.error('Error generating OAuth URL:', error);
    res.status(500).json({ error: 'Failed to initiate Meta connection' });
  }
});

router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error('OAuth error:', error, error_description);
      return res.redirect(`/salon/settings/integrations?error=${encodeURIComponent(error_description as string || 'Connection failed')}`);
    }

    if (!code || !state) {
      return res.redirect('/salon/settings/integrations?error=Missing authorization code');
    }

    let stateData: { salonId: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    } catch {
      return res.redirect('/salon/settings/integrations?error=Invalid state parameter');
    }

    const { accessToken, userId } = await metaIntegrationService.exchangeCodeForToken(code as string);

    const pages = await metaIntegrationService.getUserPages(accessToken);

    if (pages.length === 0) {
      return res.redirect(`/salon/settings/integrations?error=No Facebook Pages found. Please create a Page first.`);
    }

    if (pages.length === 1) {
      await metaIntegrationService.connectSalonToPage(stateData.salonId, pages[0], accessToken, userId);
      return res.redirect(`/salon/settings/integrations?success=true&page=${encodeURIComponent(pages[0].name)}`);
    }

    const pagesParam = Buffer.from(JSON.stringify(pages.map(p => ({
      id: p.id,
      name: p.name,
      instagram: p.instagramBusinessAccount?.username,
    })))).toString('base64');

    res.redirect(`/salon/settings/integrations/select-page?pages=${pagesParam}&token=${Buffer.from(accessToken).toString('base64')}&userId=${userId}&salonId=${stateData.salonId}`);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.redirect(`/salon/settings/integrations?error=${encodeURIComponent(error.message || 'Connection failed')}`);
  }
});

router.post('/connect/:salonId/select-page', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { pageId, token, userId } = req.body;

    if (!pageId || !token || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const accessToken = Buffer.from(token, 'base64').toString();
    const pages = await metaIntegrationService.getUserPages(accessToken);
    
    const selectedPage = pages.find(p => p.id === pageId);
    if (!selectedPage) {
      return res.status(404).json({ error: 'Page not found' });
    }

    await metaIntegrationService.connectSalonToPage(salonId, selectedPage, accessToken, userId);

    res.json({
      success: true,
      message: `Connected to ${selectedPage.name}`,
      facebook: {
        pageId: selectedPage.id,
        pageName: selectedPage.name,
      },
      instagram: selectedPage.instagramBusinessAccount ? {
        accountId: selectedPage.instagramBusinessAccount.id,
        username: selectedPage.instagramBusinessAccount.username,
      } : null,
    });
  } catch (error: any) {
    console.error('Error selecting page:', error);
    res.status(500).json({ error: error.message || 'Failed to connect to page' });
  }
});

router.post('/disconnect/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    await metaIntegrationService.disconnectSalon(salonId);

    res.json({
      success: true,
      message: 'Disconnected from Facebook/Instagram',
    });
  } catch (error: any) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ error: error.message || 'Failed to disconnect' });
  }
});

router.get('/status/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    const status = await metaIntegrationService.getIntegrationStatus(salonId);

    res.json(status);
  } catch (error: any) {
    console.error('Error getting status:', error);
    res.status(500).json({ error: 'Failed to get integration status' });
  }
});

router.put('/settings/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const settings = req.body;

    const updated = await metaIntegrationService.updateIntegrationSettings(salonId, settings);

    res.json({
      success: true,
      settings: updated.settings,
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: error.message || 'Failed to update settings' });
  }
});

router.get('/analytics/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    const hasAccess = await subscriptionService.checkFeatureAccess(salonId, 'analyticsAdvanced');
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Advanced analytics requires Growth or Elite subscription',
        upgradeRequired: true,
      });
    }

    const analytics = await metaIntegrationService.getAnalytics(salonId, days);

    res.json(analytics);
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.get('/webhook', async (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Meta webhook verified');
    res.status(200).send(challenge);
  } else {
    console.error('Meta webhook verification failed');
    res.status(403).send('Verification failed');
  }
});

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const verification = metaIntegrationService.verifyWebhookSignature(rawBody, signature);
    if (!verification.valid) {
      console.error('Invalid webhook signature:', verification.error);
      return res.status(401).json({ error: 'Invalid signature', details: verification.error });
    }

    const { object, entry } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!entry || !Array.isArray(entry)) {
      return res.status(200).send('OK');
    }

    for (const event of entry) {
      await metaIntegrationService.processWebhookEvent(object, event, signature);
    }

    res.status(200).send('OK');
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(200).send('OK');
  }
});

router.post('/track/click/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { source } = req.body;

    if (!['instagram', 'facebook'].includes(source)) {
      return res.status(400).json({ error: 'Invalid source' });
    }

    await metaIntegrationService.trackButtonClick(salonId, source);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

router.post('/track/booking-started/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { source } = req.body;

    if (!['instagram', 'facebook'].includes(source)) {
      return res.status(400).json({ error: 'Invalid source' });
    }

    await metaIntegrationService.trackBookingStarted(salonId, source);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking booking started:', error);
    res.status(500).json({ error: 'Failed to track' });
  }
});

export default router;

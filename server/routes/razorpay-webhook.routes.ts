import { Router, Request, Response } from 'express';
import { subscriptionService } from '../services/subscriptionService';

const router = Router();

/**
 * Razorpay Webhook Handler
 * Handles payment events from Razorpay for subscription management
 * 
 * Industry standard webhook handling:
 * 1. Verify signature
 * 2. Check idempotency (prevent duplicate processing)
 * 3. Process event
 * 4. Return 200 quickly
 */
router.post('/razorpay', async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  
  if (!signature) {
    console.error('[Webhook] Missing Razorpay signature');
    return res.status(400).json({ error: 'Missing signature' });
  }

  // Verify webhook signature
  const rawBody = JSON.stringify(req.body);
  const isValid = subscriptionService.verifyWebhookSignature(rawBody, signature);
  
  if (!isValid) {
    console.error('[Webhook] Invalid Razorpay signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body;
  const eventId = event.event_id || `${event.event}_${Date.now()}`;
  const eventType = event.event;

  // Check idempotency - prevent duplicate processing
  const alreadyProcessed = await subscriptionService.isEventProcessed(eventId);
  if (alreadyProcessed) {
    console.log(`[Webhook] Event ${eventId} already processed, skipping`);
    return res.status(200).json({ status: 'already_processed' });
  }

  // Record event receipt
  await subscriptionService.recordWebhookEvent(eventId, eventType, event.payload, 'received');

  try {
    const payload = event.payload;

    switch (eventType) {
      // Payment captured successfully
      case 'payment.captured': {
        const payment = payload.payment?.entity;
        if (payment) {
          const notes = payment.notes || {};
          const salonId = notes.salonId;
          
          if (salonId) {
            await subscriptionService.handleSuccessfulPayment(
              salonId,
              payment.id,
              payment.amount
            );
            console.log(`[Webhook] Payment captured for salon ${salonId}: ${payment.id}`);
          }
        }
        break;
      }

      // Payment failed
      case 'payment.failed': {
        const payment = payload.payment?.entity;
        if (payment) {
          const notes = payment.notes || {};
          const salonId = notes.salonId;
          
          if (salonId) {
            const failureReason = payment.error_description || payment.error_reason || 'Payment failed';
            await subscriptionService.handleFailedPayment(
              salonId,
              payment.id,
              failureReason
            );
            console.log(`[Webhook] Payment failed for salon ${salonId}: ${failureReason}`);
          }
        }
        break;
      }

      // Subscription activated
      case 'subscription.activated': {
        const subscription = payload.subscription?.entity;
        if (subscription) {
          const notes = subscription.notes || {};
          const salonId = notes.salonId;
          console.log(`[Webhook] Subscription activated for salon ${salonId}: ${subscription.id}`);
        }
        break;
      }

      // Subscription charged (recurring payment)
      case 'subscription.charged': {
        const subscription = payload.subscription?.entity;
        const payment = payload.payment?.entity;
        
        if (subscription && payment) {
          const notes = subscription.notes || {};
          const salonId = notes.salonId;
          
          if (salonId) {
            await subscriptionService.handleSuccessfulPayment(
              salonId,
              payment.id,
              payment.amount
            );
            console.log(`[Webhook] Subscription charged for salon ${salonId}: ${payment.id}`);
          }
        }
        break;
      }

      // Subscription halted (multiple payment failures)
      case 'subscription.halted': {
        const subscription = payload.subscription?.entity;
        if (subscription) {
          const notes = subscription.notes || {};
          const salonId = notes.salonId;
          console.log(`[Webhook] Subscription halted for salon ${salonId}: ${subscription.id}`);
        }
        break;
      }

      // Subscription cancelled
      case 'subscription.cancelled': {
        const subscription = payload.subscription?.entity;
        if (subscription) {
          const notes = subscription.notes || {};
          const salonId = notes.salonId;
          console.log(`[Webhook] Subscription cancelled for salon ${salonId}: ${subscription.id}`);
        }
        break;
      }

      // Refund created
      case 'refund.created': {
        const refund = payload.refund?.entity;
        if (refund) {
          console.log(`[Webhook] Refund created: ${refund.id} for amount ${refund.amount / 100}`);
        }
        break;
      }

      // Refund processed
      case 'refund.processed': {
        const refund = payload.refund?.entity;
        if (refund) {
          console.log(`[Webhook] Refund processed: ${refund.id} - Status: ${refund.status}`);
          // TODO: Update refund record status in database
        }
        break;
      }

      // Refund failed
      case 'refund.failed': {
        const refund = payload.refund?.entity;
        if (refund) {
          console.log(`[Webhook] Refund failed: ${refund.id} - Reason: ${refund.failure_reason}`);
          // TODO: Update refund record status in database and notify admin
        }
        break;
      }

      // Order paid
      case 'order.paid': {
        const order = payload.order?.entity;
        const payment = payload.payment?.entity;
        
        if (order && payment) {
          const notes = order.notes || {};
          if (notes.type === 'subscription_upgrade') {
            console.log(`[Webhook] Subscription upgrade order paid: ${order.id}`);
          }
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
    }

    // Mark event as processed
    await subscriptionService.recordWebhookEvent(eventId, eventType, event.payload, 'processed');
    
    // Always return 200 to acknowledge receipt
    res.status(200).json({ status: 'processed' });
  } catch (error: any) {
    console.error(`[Webhook] Error processing ${eventType}:`, error);
    
    // Record error but still return 200 to prevent retries for non-transient errors
    await subscriptionService.recordWebhookEvent(eventId, eventType, event.payload, 'failed', error.message);
    
    res.status(200).json({ status: 'error_recorded' });
  }
});

export default router;

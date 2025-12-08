import { db } from '../db';
import { 
  invitationCampaigns, 
  invitationMessages, 
  importedCustomers,
  welcomeOffers,
  salons,
  InsertInvitationCampaign, 
  InsertInvitationMessage,
  InvitationCampaign,
  InvitationMessage,
  IMPORTED_CUSTOMER_STATUSES
} from '../../shared/schema';
import { eq, and, sql, inArray, desc, asc, count } from 'drizzle-orm';
import { 
  sendMessage, 
  replaceTemplateVariables, 
  generateOfferCode,
  normalizePhoneNumber,
  type MessageResult,
  type MessageStatus
} from './twilioService';

export const CAMPAIGN_STATUSES = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SENDING: 'sending',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  FAILED: 'failed',
} as const;

export const MESSAGE_STATUSES = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  READ: 'read',
} as const;

export interface CreateCampaignInput {
  salonId: string;
  name: string;
  channel: 'whatsapp' | 'sms' | 'both';
  messageTemplate: string;
  welcomeOfferId?: string;
  scheduledFor?: Date;
  createdBy: string;
}

export interface CampaignStats {
  id: string;
  name: string;
  status: string;
  channel: string;
  targetCustomerCount: number;
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  deliveryRate: number;
  createdAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface SendingProgress {
  campaignId: string;
  totalMessages: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  percentComplete: number;
  status: string;
}

export async function createCampaign(input: CreateCampaignInput): Promise<InvitationCampaign> {
  const pendingCustomers = await db.select({ count: count() })
    .from(importedCustomers)
    .where(and(
      eq(importedCustomers.salonId, input.salonId),
      eq(importedCustomers.status, IMPORTED_CUSTOMER_STATUSES.PENDING)
    ));
  
  const targetCount = pendingCustomers[0]?.count || 0;

  const [campaign] = await db.insert(invitationCampaigns).values({
    salonId: input.salonId,
    name: input.name,
    channel: input.channel,
    messageTemplate: input.messageTemplate,
    welcomeOfferId: input.welcomeOfferId || null,
    scheduledFor: input.scheduledFor || null,
    targetCustomerCount: targetCount,
    status: input.scheduledFor ? CAMPAIGN_STATUSES.SCHEDULED : CAMPAIGN_STATUSES.DRAFT,
    createdBy: input.createdBy,
  }).returning();

  return campaign;
}

export async function getCampaign(campaignId: string): Promise<InvitationCampaign | null> {
  const [campaign] = await db.select()
    .from(invitationCampaigns)
    .where(eq(invitationCampaigns.id, campaignId));
  
  return campaign || null;
}

export async function getCampaignsBySalon(salonId: string): Promise<InvitationCampaign[]> {
  return db.select()
    .from(invitationCampaigns)
    .where(eq(invitationCampaigns.salonId, salonId))
    .orderBy(desc(invitationCampaigns.createdAt));
}

export async function getCampaignStats(campaignId: string): Promise<CampaignStats | null> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) return null;

  const delivered = campaign.messagesDelivered || 0;
  const sent = campaign.messagesSent || 0;
  const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    channel: campaign.channel,
    targetCustomerCount: campaign.targetCustomerCount,
    messagesSent: sent,
    messagesDelivered: delivered,
    messagesFailed: campaign.messagesFailed || 0,
    deliveryRate: Math.round(deliveryRate * 100) / 100,
    createdAt: campaign.createdAt,
    startedAt: campaign.startedAt,
    completedAt: campaign.completedAt,
  };
}

export async function validateCampaignStart(campaignId: string): Promise<{ 
  success: boolean; 
  error?: string;
  campaign?: InvitationCampaign;
  pendingCount?: number;
}> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) {
    return { success: false, error: 'Campaign not found' };
  }

  if (campaign.status === CAMPAIGN_STATUSES.SENDING) {
    return { success: false, error: 'Campaign is already sending' };
  }

  if (campaign.status === CAMPAIGN_STATUSES.COMPLETED) {
    return { success: false, error: 'Campaign has already completed' };
  }

  if (campaign.status === CAMPAIGN_STATUSES.FAILED) {
    return { success: false, error: 'Campaign has failed. Please create a new campaign.' };
  }

  const [salon] = await db.select()
    .from(salons)
    .where(eq(salons.id, campaign.salonId));
  
  if (!salon) {
    return { success: false, error: 'Salon not found' };
  }

  const pendingCustomers = await db.select({ count: count() })
    .from(importedCustomers)
    .where(and(
      eq(importedCustomers.salonId, campaign.salonId),
      eq(importedCustomers.status, IMPORTED_CUSTOMER_STATUSES.PENDING)
    ));

  const pendingCount = pendingCustomers[0]?.count || 0;
  if (pendingCount === 0) {
    return { success: false, error: 'No pending customers to invite' };
  }

  return { success: true, campaign, pendingCount };
}

export async function startCampaign(
  campaignId: string,
  onProgress?: (progress: SendingProgress) => void
): Promise<{ success: boolean; error?: string }> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) {
    return { success: false, error: 'Campaign not found' };
  }

  if (campaign.status === CAMPAIGN_STATUSES.SENDING) {
    return { success: false, error: 'Campaign is already sending' };
  }

  if (campaign.status === CAMPAIGN_STATUSES.COMPLETED) {
    return { success: false, error: 'Campaign has already completed' };
  }

  if (campaign.status === CAMPAIGN_STATUSES.FAILED) {
    return { success: false, error: 'Campaign has failed. Please create a new campaign.' };
  }

  const [salon] = await db.select()
    .from(salons)
    .where(eq(salons.id, campaign.salonId));
  
  if (!salon) {
    await markCampaignFailed(campaignId, 'Salon not found');
    return { success: false, error: 'Salon not found' };
  }

  let welcomeOffer = null;
  if (campaign.welcomeOfferId) {
    const [offer] = await db.select()
      .from(welcomeOffers)
      .where(eq(welcomeOffers.id, campaign.welcomeOfferId));
    welcomeOffer = offer;
  }

  const pendingCustomers = await db.select()
    .from(importedCustomers)
    .where(and(
      eq(importedCustomers.salonId, campaign.salonId),
      eq(importedCustomers.status, IMPORTED_CUSTOMER_STATUSES.PENDING)
    ));

  if (pendingCustomers.length === 0) {
    return { success: false, error: 'No pending customers to invite' };
  }

  const channels: Array<'whatsapp' | 'sms'> = 
    campaign.channel === 'both' 
      ? ['whatsapp', 'sms'] 
      : [campaign.channel as 'whatsapp' | 'sms'];

  const totalMessages = pendingCustomers.length * channels.length;

  await db.update(invitationCampaigns)
    .set({ 
      status: CAMPAIGN_STATUSES.SENDING,
      startedAt: campaign.startedAt || new Date(),
      targetCustomerCount: totalMessages,
    })
    .where(eq(invitationCampaigns.id, campaignId));

  let sentCount = 0;
  let deliveredCount = 0;
  let failedCount = 0;
  let processedCustomers = 0;

  try {
    for (const customer of pendingCustomers) {
      const currentCampaign = await getCampaign(campaignId);
      if (currentCampaign?.status === CAMPAIGN_STATUSES.PAUSED) {
        console.log(`Campaign ${campaignId} paused at ${processedCustomers}/${pendingCustomers.length} customers`);
        break;
      }

      const offerCode = welcomeOffer ? generateOfferCode('WELCOME') : '';
      const offerAmount = welcomeOffer 
        ? welcomeOffer.discountType === 'percentage'
          ? `${welcomeOffer.discountValue}%`
          : `₹${(welcomeOffer.discountValue / 100).toFixed(0)}`
        : '';

      const templateVariables: Record<string, string> = {
        customer_name: customer.customerName.split(' ')[0] || 'Customer',
        salon_name: salon.name,
        offer_amount: offerAmount,
        offer_code: offerCode,
        download_link: `https://app.salonhub.com/s/${salon.id}`,
        expiry_days: welcomeOffer ? `${welcomeOffer.validityDays}` : '30',
      };

      const personalizedMessage = replaceTemplateVariables(campaign.messageTemplate, templateVariables);

      for (const channel of channels) {
        const [messageRecord] = await db.insert(invitationMessages).values({
          campaignId: campaign.id,
          importedCustomerId: customer.id,
          channel,
          status: MESSAGE_STATUSES.PENDING,
        }).returning();

        try {
          const result = await sendMessage({
            to: customer.normalizedPhone,
            message: personalizedMessage,
            channel,
          });

          if (result.success && result.messageSid) {
            await db.update(invitationMessages)
              .set({
                twilioMessageSid: result.messageSid,
                status: MESSAGE_STATUSES.SENT,
                sentAt: new Date(),
              })
              .where(eq(invitationMessages.id, messageRecord.id));
            
            sentCount++;
            
            if (result.status === 'delivered') {
              deliveredCount++;
              await db.update(invitationMessages)
                .set({
                  status: MESSAGE_STATUSES.DELIVERED,
                  deliveredAt: new Date(),
                })
                .where(eq(invitationMessages.id, messageRecord.id));
            }
          } else {
            failedCount++;
            await db.update(invitationMessages)
              .set({
                status: MESSAGE_STATUSES.FAILED,
                errorMessage: result.error || 'Unknown error',
              })
              .where(eq(invitationMessages.id, messageRecord.id));
          }
        } catch (error: any) {
          failedCount++;
          await db.update(invitationMessages)
            .set({
              status: MESSAGE_STATUSES.FAILED,
              errorMessage: error.message || 'Send failed',
            })
            .where(eq(invitationMessages.id, messageRecord.id));
        }

        await new Promise(resolve => setTimeout(resolve, 50));
      }

      await db.update(importedCustomers)
        .set({
          status: IMPORTED_CUSTOMER_STATUSES.INVITED,
          invitedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(importedCustomers.id, customer.id));

      processedCustomers++;

      await db.update(invitationCampaigns)
        .set({
          messagesSent: sentCount,
          messagesDelivered: deliveredCount,
          messagesFailed: failedCount,
        })
        .where(eq(invitationCampaigns.id, campaignId));

      if (onProgress) {
        onProgress({
          campaignId,
          totalMessages,
          sentCount,
          deliveredCount,
          failedCount,
          percentComplete: Math.round(((sentCount + failedCount) / totalMessages) * 100),
          status: CAMPAIGN_STATUSES.SENDING,
        });
      }
    }

    const finalCampaign = await getCampaign(campaignId);
    if (finalCampaign?.status !== CAMPAIGN_STATUSES.PAUSED) {
      await db.update(invitationCampaigns)
        .set({
          status: CAMPAIGN_STATUSES.COMPLETED,
          completedAt: new Date(),
          messagesSent: sentCount,
          messagesDelivered: deliveredCount,
          messagesFailed: failedCount,
        })
        .where(eq(invitationCampaigns.id, campaignId));
    }

    return { success: true };
  } catch (error: any) {
    console.error(`Campaign ${campaignId} fatal error:`, error);
    await markCampaignFailed(campaignId, error.message || 'Unknown error');
    return { success: false, error: error.message || 'Campaign failed unexpectedly' };
  }
}

async function markCampaignFailed(campaignId: string, errorMessage: string): Promise<void> {
  await db.update(invitationCampaigns)
    .set({
      status: CAMPAIGN_STATUSES.FAILED,
    })
    .where(eq(invitationCampaigns.id, campaignId));
  console.error(`Campaign ${campaignId} marked as FAILED: ${errorMessage}`);
}

export async function pauseCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) {
    return { success: false, error: 'Campaign not found' };
  }

  if (campaign.status !== CAMPAIGN_STATUSES.SENDING) {
    return { success: false, error: 'Campaign is not currently sending' };
  }

  await db.update(invitationCampaigns)
    .set({ status: CAMPAIGN_STATUSES.PAUSED })
    .where(eq(invitationCampaigns.id, campaignId));

  return { success: true };
}

export async function resumeCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) {
    return { success: false, error: 'Campaign not found' };
  }

  if (campaign.status !== CAMPAIGN_STATUSES.PAUSED) {
    return { success: false, error: 'Campaign is not paused' };
  }

  return startCampaign(campaignId);
}

export async function updateMessageDeliveryStatus(
  twilioMessageSid: string,
  status: MessageStatus,
  errorCode?: string,
  errorMessage?: string
): Promise<boolean> {
  const [message] = await db.select()
    .from(invitationMessages)
    .where(eq(invitationMessages.twilioMessageSid, twilioMessageSid));

  if (!message) {
    console.log(`No message found for Twilio SID: ${twilioMessageSid}`);
    return false;
  }

  const updateData: Partial<InvitationMessage> = {};

  switch (status) {
    case 'delivered':
      updateData.status = MESSAGE_STATUSES.DELIVERED;
      updateData.deliveredAt = new Date();
      break;
    case 'read':
      updateData.status = MESSAGE_STATUSES.READ;
      updateData.readAt = new Date();
      break;
    case 'failed':
    case 'undelivered':
      updateData.status = MESSAGE_STATUSES.FAILED;
      updateData.errorMessage = errorMessage || `Error code: ${errorCode}`;
      break;
    case 'sent':
    case 'queued':
      updateData.status = MESSAGE_STATUSES.SENT;
      break;
  }

  await db.update(invitationMessages)
    .set(updateData)
    .where(eq(invitationMessages.id, message.id));

  await updateCampaignStats(message.campaignId);

  return true;
}

async function updateCampaignStats(campaignId: string): Promise<void> {
  const messageStats = await db.select({
    status: invitationMessages.status,
    count: count(),
  })
    .from(invitationMessages)
    .where(eq(invitationMessages.campaignId, campaignId))
    .groupBy(invitationMessages.status);

  let sent = 0;
  let delivered = 0;
  let failed = 0;

  for (const stat of messageStats) {
    if (stat.status === MESSAGE_STATUSES.SENT || stat.status === MESSAGE_STATUSES.DELIVERED || stat.status === MESSAGE_STATUSES.READ) {
      sent += stat.count;
    }
    if (stat.status === MESSAGE_STATUSES.DELIVERED || stat.status === MESSAGE_STATUSES.READ) {
      delivered += stat.count;
    }
    if (stat.status === MESSAGE_STATUSES.FAILED) {
      failed += stat.count;
    }
  }

  await db.update(invitationCampaigns)
    .set({
      messagesSent: sent,
      messagesDelivered: delivered,
      messagesFailed: failed,
    })
    .where(eq(invitationCampaigns.id, campaignId));
}

export async function getCampaignMessages(
  campaignId: string,
  options: { status?: string; limit?: number; offset?: number } = {}
): Promise<{ messages: InvitationMessage[]; total: number }> {
  const conditions = [eq(invitationMessages.campaignId, campaignId)];
  
  if (options.status) {
    conditions.push(eq(invitationMessages.status, options.status));
  }

  const [totalResult] = await db.select({ count: count() })
    .from(invitationMessages)
    .where(and(...conditions));

  const messages = await db.select()
    .from(invitationMessages)
    .where(and(...conditions))
    .orderBy(desc(invitationMessages.createdAt))
    .limit(options.limit || 50)
    .offset(options.offset || 0);

  return {
    messages,
    total: totalResult?.count || 0,
  };
}

export async function deleteCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) {
    return { success: false, error: 'Campaign not found' };
  }

  if (campaign.status === CAMPAIGN_STATUSES.SENDING) {
    return { success: false, error: 'Cannot delete a campaign that is currently sending' };
  }

  await db.delete(invitationCampaigns)
    .where(eq(invitationCampaigns.id, campaignId));

  return { success: true };
}

export const campaignService = {
  createCampaign,
  getCampaign,
  getCampaignsBySalon,
  getCampaignStats,
  validateCampaignStart,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  updateMessageDeliveryStatus,
  getCampaignMessages,
  deleteCampaign,
};

export default campaignService;

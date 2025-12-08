// @ts-ignore - Twilio types have export configuration issues
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: twilio.Twilio | null = null;

function getClient(): twilio.Twilio {
  if (!twilioClient) {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
    }
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

export function normalizePhoneNumber(phone: string, defaultCountryCode: string = '+91'): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return '+91' + cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    return '+91' + cleaned;
  }
  
  if (cleaned.length > 10) {
    return '+' + cleaned;
  }
  
  throw new Error(`Invalid phone number: ${phone}`);
}

export interface SendMessageOptions {
  to: string;
  message: string;
  channel: 'sms' | 'whatsapp';
}

export interface MessageResult {
  success: boolean;
  messageSid?: string;
  error?: string;
  status?: string;
}

export async function sendMessage(options: SendMessageOptions): Promise<MessageResult> {
  try {
    const client = getClient();
    const normalizedTo = normalizePhoneNumber(options.to);
    
    const toNumber = options.channel === 'whatsapp' 
      ? `whatsapp:${normalizedTo}`
      : normalizedTo;
    
    let fromNumber: string;
    if (options.channel === 'whatsapp') {
      fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || `whatsapp:${twilioPhoneNumber}`;
    } else {
      fromNumber = twilioPhoneNumber || '';
    }
    
    const messageOptions: any = {
      to: toNumber,
      body: options.message,
    };
    
    if (messagingServiceSid && options.channel === 'sms') {
      messageOptions.messagingServiceSid = messagingServiceSid;
    } else {
      messageOptions.from = fromNumber;
    }
    
    const result = await client.messages.create(messageOptions);
    
    return {
      success: true,
      messageSid: result.sid,
      status: result.status,
    };
  } catch (error: any) {
    console.error('Twilio send error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send message',
    };
  }
}

export async function sendBulkMessages(
  messages: Array<{ to: string; message: string; channel: 'sms' | 'whatsapp'; customerId?: string }>,
  onProgress?: (sent: number, total: number) => void,
  delayMs: number = 50
): Promise<Array<{ customerId?: string; result: MessageResult }>> {
  const results: Array<{ customerId?: string; result: MessageResult }> = [];
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const result = await sendMessage({
      to: msg.to,
      message: msg.message,
      channel: msg.channel,
    });
    
    results.push({ customerId: msg.customerId, result });
    
    if (onProgress) {
      onProgress(i + 1, messages.length);
    }
    
    if (i < messages.length - 1 && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

export function generateOfferCode(prefix: string = 'WELCOME'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

export function isValidPhoneNumber(phone: string): boolean {
  try {
    normalizePhoneNumber(phone);
    return true;
  } catch {
    return false;
  }
}

export async function checkTwilioConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const client = getClient();
    await client.api.accounts(accountSid!).fetch();
    return { connected: true };
  } catch (error: any) {
    return { 
      connected: false, 
      error: error.message || 'Failed to connect to Twilio' 
    };
  }
}

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'undelivered' | 'failed' | 'read';

export interface StatusUpdatePayload {
  messageSid: string;
  status: MessageStatus;
  errorCode?: string;
  errorMessage?: string;
}

export function parseStatusCallback(body: any): StatusUpdatePayload | null {
  if (!body || !body.MessageSid || !body.MessageStatus) {
    return null;
  }
  
  return {
    messageSid: body.MessageSid,
    status: body.MessageStatus as MessageStatus,
    errorCode: body.ErrorCode,
    errorMessage: body.ErrorMessage,
  };
}

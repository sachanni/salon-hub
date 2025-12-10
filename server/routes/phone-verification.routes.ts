import { Router, Request, Response } from 'express';
import { db } from '../db';
import { phoneVerificationTokens, users, clientProfiles } from '@shared/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { sendMessage, normalizePhoneNumber } from '../services/twilioService';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

const router = Router();

const OTP_EXPIRY_MINUTES = 10;
const SESSION_EXPIRY_MINUTES = 30;
const MAX_OTP_ATTEMPTS = 3;
const MAX_RESEND_PER_PHONE_PER_HOUR = 5;

function generateOTP(): string {
  // Use cryptographically secure random number generator (industry standard)
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

const otpRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many OTP requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many verification attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/request', otpRequestLimiter, async (req: Request, res: Response) => {
  try {
    const { phone, context = 'booking' } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhoneNumber(phone);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await db.query.phoneVerificationTokens.findMany({
      where: and(
        eq(phoneVerificationTokens.phone, normalizedPhone),
        gt(phoneVerificationTokens.createdAt, oneHourAgo)
      ),
    });

    if (recentRequests.length >= MAX_RESEND_PER_PHONE_PER_HOUR) {
      return res.status(429).json({ 
        error: 'Too many OTP requests for this number. Please try again later.',
        retryAfterMinutes: 60 
      });
    }

    const otp = generateOTP();
    const codeHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Send SMS first - only persist token if SMS succeeds (prevents redeemable but unsent codes)
    const messageResult = await sendMessage({
      to: normalizedPhone,
      message: `Your SalonHub verification code is: ${otp}. This code expires in ${OTP_EXPIRY_MINUTES} minutes. Do not share this code with anyone.`,
      channel: 'sms',
    });

    if (!messageResult.success) {
      console.error('Failed to send OTP SMS:', messageResult.error);
      return res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
    }

    // Only persist token after successful SMS dispatch
    await db.insert(phoneVerificationTokens).values({
      phone: normalizedPhone,
      codeHash,
      context,
      expiresAt,
      attempts: 0,
      maxAttempts: MAX_OTP_ATTEMPTS,
    });

    console.log(`📱 OTP sent to ${normalizedPhone} (context: ${context})`);

    res.json({
      success: true,
      message: 'Verification code sent successfully',
      expiresInMinutes: OTP_EXPIRY_MINUTES,
      phone: normalizedPhone,
    });
  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

router.post('/verify', otpVerifyLimiter, async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone number and verification code are required' });
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhoneNumber(phone);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const now = new Date();
    const token = await db.query.phoneVerificationTokens.findFirst({
      where: and(
        eq(phoneVerificationTokens.phone, normalizedPhone),
        gt(phoneVerificationTokens.expiresAt, now)
      ),
      orderBy: [desc(phoneVerificationTokens.createdAt)],
    });

    if (!token) {
      return res.status(400).json({ 
        error: 'No valid verification code found. Please request a new code.',
        expired: true 
      });
    }

    if (token.verifiedAt) {
      return res.status(400).json({ 
        error: 'This code has already been used. Please request a new code.' 
      });
    }

    if (token.attempts >= token.maxAttempts) {
      return res.status(400).json({ 
        error: 'Maximum verification attempts exceeded. Please request a new code.',
        maxAttemptsReached: true 
      });
    }

    const codeHash = hashOTP(code);
    
    if (codeHash !== token.codeHash) {
      await db.update(phoneVerificationTokens)
        .set({ attempts: token.attempts + 1 })
        .where(eq(phoneVerificationTokens.id, token.id));

      const remainingAttempts = token.maxAttempts - token.attempts - 1;
      return res.status(400).json({ 
        error: 'Invalid verification code',
        remainingAttempts,
      });
    }

    const sessionId = generateSessionId();
    const sessionExpiresAt = new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000);

    await db.update(phoneVerificationTokens)
      .set({
        verifiedAt: now,
        verificationSessionId: sessionId,
        sessionExpiresAt,
      })
      .where(eq(phoneVerificationTokens.id, token.id));

    // Update phoneVerified for user with this phone (try E.164 first, then legacy format)
    const updatedE164 = await db.update(users)
      .set({ phoneVerified: 1 })
      .where(eq(users.phone, normalizedPhone))
      .returning({ id: users.id });
    
    // If E.164 didn't match, try legacy format and upgrade to E.164
    if (updatedE164.length === 0) {
      const legacyPhone = normalizedPhone.replace(/^\+\d+/, '');
      // Update both phoneVerified AND upgrade phone to E.164 format for future lookups
      await db.update(users)
        .set({ phoneVerified: 1, phone: normalizedPhone })
        .where(eq(users.phone, legacyPhone));
    }

    console.log(`✅ Phone verified: ${normalizedPhone} (session: ${sessionId.substring(0, 8)}...)`);

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      verificationSessionId: sessionId,
      sessionExpiresInMinutes: SESSION_EXPIRY_MINUTES,
      phone: normalizedPhone,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

router.get('/status', async (req: Request, res: Response) => {
  try {
    const { phone, createSession } = req.query;

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Try to normalize the phone number
    let e164Phone: string;
    let nationalNumber: string;
    
    if (phone.startsWith('+')) {
      // Already E.164 format
      e164Phone = phone;
      nationalNumber = phone.replace(/\D/g, '').slice(-10);
    } else {
      // Assume it's a national number, default to India
      nationalNumber = phone.replace(/\D/g, '').slice(-10);
      e164Phone = '+91' + nationalNumber;
    }

    if (nationalNumber.length < 8 || nationalNumber.length > 12) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Check if user with this phone exists and is verified
    // Try E.164 format first (new standard)
    let existingUser = await db.query.users.findFirst({
      where: eq(users.phone, e164Phone),
    });
    
    // Fallback: check without prefix if not found (legacy format)
    if (!existingUser) {
      existingUser = await db.query.users.findFirst({
        where: eq(users.phone, nationalNumber),
      });
    }

    if (existingUser) {
      const isVerified = existingUser.phoneVerified === 1;
      
      // If user is verified and createSession is requested, create or reuse a verification session
      // This allows returning customers to skip OTP while still having a valid session for backend
      if (isVerified && createSession === 'true') {
        const now = new Date();
        
        // Check for existing valid session first (session reuse - prevents unbounded token growth)
        const existingSession = await db.query.phoneVerificationTokens.findFirst({
          where: and(
            eq(phoneVerificationTokens.phone, e164Phone),
            eq(phoneVerificationTokens.context, 'walk-in-returning'),
            gt(phoneVerificationTokens.sessionExpiresAt, now)
          ),
          orderBy: [desc(phoneVerificationTokens.createdAt)],
        });
        
        if (existingSession && existingSession.verificationSessionId) {
          // Reuse existing valid session
          const remainingMinutes = Math.ceil((existingSession.sessionExpiresAt!.getTime() - now.getTime()) / 60000);
          console.log(`♻️ Reusing session for returning customer: ${e164Phone} (session: ${existingSession.verificationSessionId.substring(0, 8)}..., expires in ${remainingMinutes}min)`);
          
          return res.json({
            exists: true,
            phoneVerified: true,
            userId: existingUser.id,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            verificationSessionId: existingSession.verificationSessionId,
            sessionExpiresInMinutes: remainingMinutes,
          });
        }
        
        // No valid session exists, create a new one
        const sessionId = generateSessionId();
        const sessionExpiresAt = new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000);
        
        // Create a verification token record for the session
        await db.insert(phoneVerificationTokens).values({
          phone: e164Phone,
          codeHash: 'return-session', // No OTP for returning customers
          context: 'walk-in-returning',
          expiresAt: now, // Already expired (no OTP to verify)
          verifiedAt: now, // Already verified
          verificationSessionId: sessionId,
          sessionExpiresAt,
          attempts: 0,
          maxAttempts: 0,
        });
        
        console.log(`✅ Created session for returning customer: ${e164Phone} (session: ${sessionId.substring(0, 8)}...)`);
        
        return res.json({
          exists: true,
          phoneVerified: true,
          userId: existingUser.id,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          verificationSessionId: sessionId,
          sessionExpiresInMinutes: SESSION_EXPIRY_MINUTES,
        });
      }
      
      return res.json({
        exists: true,
        phoneVerified: isVerified,
        userId: existingUser.id,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
      });
    }

    res.json({
      exists: false,
      phoneVerified: false,
      userId: null,
    });
  } catch (error) {
    console.error('Error checking phone status:', error);
    res.status(500).json({ error: 'Failed to check phone status' });
  }
});

router.post('/validate-session', async (req: Request, res: Response) => {
  try {
    const { verificationSessionId, phone } = req.body;

    if (!verificationSessionId) {
      return res.status(400).json({ valid: false, error: 'Session ID is required' });
    }

    let normalizedPhone: string | undefined;
    if (phone) {
      try {
        normalizedPhone = normalizePhoneNumber(phone);
      } catch (err) {
        return res.status(400).json({ valid: false, error: 'Invalid phone format' });
      }
    }

    const now = new Date();
    const whereClause = normalizedPhone
      ? and(
          eq(phoneVerificationTokens.verificationSessionId, verificationSessionId),
          eq(phoneVerificationTokens.phone, normalizedPhone),
          gt(phoneVerificationTokens.sessionExpiresAt, now)
        )
      : and(
          eq(phoneVerificationTokens.verificationSessionId, verificationSessionId),
          gt(phoneVerificationTokens.sessionExpiresAt, now)
        );

    const token = await db.query.phoneVerificationTokens.findFirst({
      where: whereClause,
    });

    if (!token || !token.verifiedAt) {
      return res.json({ valid: false, error: 'Invalid or expired session' });
    }

    res.json({
      valid: true,
      phone: token.phone,
      context: token.context,
      verifiedAt: token.verifiedAt,
    });
  } catch (error) {
    console.error('Error validating session:', error);
    res.status(500).json({ valid: false, error: 'Failed to validate session' });
  }
});

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.includes(shorter) || shorter.includes(longer)) {
    return shorter.length / longer.length;
  }
  
  let matches = 0;
  const range = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);
  
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - range);
    const end = Math.min(i + range + 1, s2.length);
    for (let j = start; j < end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
  }
  
  if (matches === 0) return 0.0;
  
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
  }
  
  const jaro = (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;
  
  let prefix = 0;
  for (let i = 0; i < Math.min(4, shorter.length); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  
  return jaro + prefix * 0.1 * (1 - jaro);
}

router.post('/identity-check', async (req: Request, res: Response) => {
  try {
    const { phone, providedName, providedEmail } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!providedName && !providedEmail) {
      return res.status(400).json({ error: 'Name or email is required for identity check' });
    }

    // Use proper phone normalization
    let e164Phone: string;
    try {
      e164Phone = normalizePhoneNumber(phone);
    } catch {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Look up user by E.164 phone only (no legacy fallback for security)
    const existingUser = await db.query.users.findFirst({
      where: eq(users.phone, e164Phone),
    });

    if (!existingUser) {
      return res.json({
        identityMatched: false,
        reason: 'no_user_found',
        requiresOtp: true,
      });
    }
    
    // For walk-in context, check if they have a client profile (known salon customer)
    // This allows returning customers who never did OTP before to still be recognized
    let isKnownSalonCustomer = false;
    if (existingUser.phoneVerified !== 1) {
      // Check if they have any client profiles (means they've been added as a customer)
      const clientProfile = await db.query.clientProfiles.findFirst({
        where: eq(clientProfiles.customerId, existingUser.id),
      });
      isKnownSalonCustomer = !!clientProfile;
      
      if (!isKnownSalonCustomer) {
        return res.json({
          identityMatched: false,
          reason: 'phone_not_verified',
          requiresOtp: true,
        });
      }
      console.log(`📋 User ${e164Phone} has client profile - allowing identity check despite phone_verified=0`);
    }

    const NAME_MATCH_THRESHOLD = 0.75;
    let nameMatched = false;
    let emailMatched = false;
    let nameSimilarity = 0;

    if (providedName && existingUser.firstName) {
      const storedFullName = `${existingUser.firstName || ''} ${existingUser.lastName || ''}`.trim();
      const providedFullName = providedName.trim();
      
      nameSimilarity = calculateSimilarity(storedFullName, providedFullName);
      
      const storedFirst = normalizeString(existingUser.firstName || '');
      const providedFirst = normalizeString(providedName.split(' ')[0] || '');
      const firstNameSimilarity = calculateSimilarity(storedFirst, providedFirst);
      
      nameSimilarity = Math.max(nameSimilarity, firstNameSimilarity);
      nameMatched = nameSimilarity >= NAME_MATCH_THRESHOLD;
    }

    if (providedEmail && existingUser.email) {
      const normalizedProvidedEmail = providedEmail.toLowerCase().trim();
      const normalizedStoredEmail = existingUser.email.toLowerCase().trim();
      emailMatched = normalizedProvidedEmail === normalizedStoredEmail;
    }

    const identityMatched = nameMatched || emailMatched;

    console.log(`🔍 Identity check for ${e164Phone}: name="${providedName}" (similarity: ${nameSimilarity.toFixed(2)}), email="${providedEmail || 'none'}"`);
    console.log(`   Result: nameMatched=${nameMatched}, emailMatched=${emailMatched}, identityMatched=${identityMatched}`);

    if (identityMatched) {
      const sessionId = generateSessionId();
      const now = new Date();
      const sessionExpiresAt = new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000);
      
      await db.insert(phoneVerificationTokens).values({
        phone: e164Phone,
        codeHash: 'id-verified',
        context: 'identity-bypass',
        expiresAt: now,
        verifiedAt: now,
        verificationSessionId: sessionId,
        sessionExpiresAt,
        attempts: 0,
        maxAttempts: 0,
      });

      console.log(`✅ Identity verified for returning customer: ${e164Phone}`);

      return res.json({
        identityMatched: true,
        reason: emailMatched ? 'email_matched' : 'name_matched',
        requiresOtp: false,
        verificationSessionId: sessionId,
        sessionExpiresInMinutes: SESSION_EXPIRY_MINUTES,
        userId: existingUser.id,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
      });
    }

    console.log(`⚠️ Identity mismatch for ${e164Phone}: stored name="${existingUser.firstName} ${existingUser.lastName}", provided="${providedName}"`);

    return res.json({
      identityMatched: false,
      reason: 'identity_mismatch',
      requiresOtp: true,
      message: 'Please verify with OTP to continue',
    });

  } catch (error) {
    console.error('Error in identity check:', error);
    res.status(500).json({ error: 'Failed to verify identity' });
  }
});

export default router;

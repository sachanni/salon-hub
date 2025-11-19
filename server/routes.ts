import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, initializeServices } from "./storage";
import { db } from "./db";
import { eq, and, or, inArray, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import { requireSalonAccess, requireStaffAccess, requireSuperAdmin, populateUserFromSession, type AuthenticatedRequest } from "./middleware/auth";
import Razorpay from "razorpay";
import crypto from "crypto";
import express from "express";
import { verifyFirebaseToken, getPhoneNumberFromToken } from "./firebaseAdmin";
import { createClient } from 'redis';
import { OfferCalculator } from "./offerCalculator";
import { getGooglePlacesService } from "./services/googlePlaces";
import { z } from "zod";
import aiLookRoutes from "./routes/ai-look.routes";
import { tempImageStorage } from "./services/tempImageStorage";
import { 
  createPaymentOrderSchema, 
  verifyPaymentSchema,
  type CreatePaymentOrderInput,
  type VerifyPaymentInput,
  // Business profile validation schemas
  insertSalonSchema,
  insertBookingSettingsSchema,
  insertStaffServiceSchema,
  insertResourceSchema,
  insertServiceResourceSchema,
  insertMediaAssetSchema,
  insertTaxRateSchema,
  insertPayoutAccountSchema,
  insertPublishStateSchema,
  // Proximity search validation schemas
  salonSearchSchema,
  type SalonSearchParams,
  type SalonSearchResult,
  // Booking validation schemas
  updateBookingSchema,
  bulkUpdateBookingSchema,
  rescheduleBookingInputSchema,
  type UpdateBookingInput,
  type BulkUpdateBookingInput,
  type RescheduleBookingInput,
  validateStatusTransition,
  // Package validation schemas
  createPackageSchema,
  updatePackageSchema,
  type CreatePackageInput,
  type UpdatePackageInput,
  // Customer profile validation schemas
  updateCustomerNotesSchema,
  updateCustomerProfileSchema,
  // Financial system validation schemas
  insertExpenseCategorySchema,
  insertExpenseSchema,
  insertCommissionRateSchema,
  insertCommissionSchema,
  insertBudgetSchema,
  insertFinancialReportSchema,
  insertTaxSettingSchema,
  // Communication system schemas
  insertMessageTemplateSchema,
  insertCustomerSegmentSchema,
  insertCommunicationCampaignSchema,
  insertCommunicationHistorySchema,
  insertCommunicationPreferencesSchema,
  insertScheduledMessageSchema,
  insertCommunicationAnalyticsSchema,
  // Inventory management validation schemas
  insertVendorSchema,
  insertProductCategorySchema,
  insertProductSchema,
  insertStockMovementSchema,
  insertPurchaseOrderSchema,
  insertPurchaseOrderItemSchema,
  insertProductUsageSchema,
  insertReorderRuleSchema,
  insertInventoryAdjustmentSchema,
  insertInventoryAdjustmentItemSchema,
  // A/B testing validation schemas
  insertAbTestCampaignSchema,
  insertTestVariantSchema,
  insertTestMetricSchema,
  insertTestResultSchema,
  // Places API validation schemas
  placesAutocompleteSchema,
  placesDetailsSchema,
  placesGeocodeSchema,
  type PlacesAutocompleteParams,
  type PlacesDetailsParams,
  type PlacesGeocodeParams,
  type PlacesAutocompleteResponse,
  type PlacesDetailsResponse,
  type PlacesGeocodeResponse,
  // User saved locations validation schema
  insertUserSavedLocationSchema,
  // Package/combo validation schemas
  insertServicePackageSchema,
  insertPackageServiceSchema,
  // Platform offers validation schemas
  createOfferSchema,
  updateOfferSchema,
  approveRejectOfferSchema,
  toggleOfferStatusSchema,
} from "@shared/schema";
import { sendVerificationEmail } from "./emailService";
import { communicationService, sendBookingConfirmation, sendBookingReminder, sendRescheduleNotification } from "./communicationService";
import { schedulingService } from "./schedulingService";
import { communicationRateLimits, businessTierLimits, checkBusinessLimits, spikeProtection } from "./middleware/rateLimiting";
import { analyticsService } from "./analyticsService";
import rateLimit from 'express-rate-limit';

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database services
  await initializeServices();
  
  
  // Setup session-based authentication
  const sessionTtl = 30 * 24 * 60 * 60 * 1000; // 30 days
  const MemoryStoreSession = MemoryStore(session);
  const sessionStore = new MemoryStoreSession({
    checkPeriod: 86400000, // Prune expired entries every 24h
  });
  
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required');
  }

  app.use(session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // CSRF protection for session-authenticated endpoints
      maxAge: sessionTtl,
    },
  }));
  
  // Initialize Razorpay (optional in development)
  let razorpay: Razorpay | null = null;
  
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } else {
    console.warn('Razorpay keys not configured - payment functionality disabled');
  }

  // Session-based authentication middleware
  const isAuthenticated = async (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Populate user data with roles and organization memberships for authorization
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const userRoles = await storage.getUserRoles(userId);
      const orgMemberships = await storage.getUserOrganizations(userId);
      
      // Set user data on request for authorization middleware
      req.user = {
        id: userId,
        email: user.email,
        roles: userRoles.map(role => role.name),
        orgMemberships
      };

      next();
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(401).json({ message: "Authentication failed" });
    }
  };

  // ============ OFFER VALIDATION & DISCOUNT CALCULATION UTILITIES ============
  
  /**
   * Validates offer eligibility and calculates discount
   * @returns { isValid: boolean, discount: number, reason?: string, cashbackAmount?: number }
   */
  async function validateAndCalculateOffer(
    offerId: string,
    userId: string | undefined,
    serviceAmount: number,
    salonId: string
  ): Promise<{
    isValid: boolean;
    discountAmount: number;
    finalAmount: number;
    cashbackAmount: number;
    reason?: string;
    offer?: any;
  }> {
    try {
      // Fetch the offer by ID (not filtered by salon - supports platform-wide offers)
      const offer = await storage.getOfferById(offerId);
      
      if (!offer) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: serviceAmount,
          cashbackAmount: 0,
          reason: 'Offer not found'
        };
      }
      
      // Validate salon applicability: platform-wide OR salon-specific match
      if (!offer.isPlatformWide && offer.salonId !== salonId) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: serviceAmount,
          cashbackAmount: 0,
          reason: 'Offer does not apply to this salon'
        };
      }

      // Check if offer is active
      if (!offer.isActive) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: serviceAmount,
          cashbackAmount: 0,
          reason: 'Offer is inactive'
        };
      }

      // Check approval status
      if (offer.approvalStatus !== 'approved') {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: serviceAmount,
          cashbackAmount: 0,
          reason: 'Offer is not approved'
        };
      }

      // Check validity dates
      const now = new Date();
      const validFrom = new Date(offer.validFrom);
      const validUntil = new Date(offer.validUntil);

      if (now < validFrom) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: serviceAmount,
          cashbackAmount: 0,
          reason: 'Offer not yet valid'
        };
      }

      if (now > validUntil) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: serviceAmount,
          cashbackAmount: 0,
          reason: 'Offer has expired'
        };
      }

      // Check minimum purchase requirement
      if (offer.minimumPurchase && serviceAmount < offer.minimumPurchase) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: serviceAmount,
          cashbackAmount: 0,
          reason: `Minimum purchase of ₹${(offer.minimumPurchase / 100).toFixed(2)} required`
        };
      }

      // Check user eligibility if authenticated
      if (userId) {
        const eligibility = await storage.getUserOfferEligibility(userId, offerId);
        if (!eligibility.eligible) {
          return {
            isValid: false,
            discountAmount: 0,
            finalAmount: serviceAmount,
            cashbackAmount: 0,
            reason: eligibility.reason || 'User not eligible for this offer'
          };
        }
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (offer.discountType === 'percentage') {
        discountAmount = Math.floor((serviceAmount * offer.discountValue) / 100);
        
        // Apply max discount cap if specified
        if (offer.maxDiscount && discountAmount > offer.maxDiscount) {
          discountAmount = offer.maxDiscount;
        }
      } else if (offer.discountType === 'fixed') {
        discountAmount = offer.discountValue;
      }

      // Ensure discount doesn't exceed service amount
      if (discountAmount > serviceAmount) {
        discountAmount = serviceAmount;
      }

      const finalAmount = serviceAmount - discountAmount;

      return {
        isValid: true,
        discountAmount,
        finalAmount,
        cashbackAmount: 0, // Will be calculated separately for launch offers
        offer
      };

    } catch (error) {
      console.error('Error validating offer:', error);
      return {
        isValid: false,
        discountAmount: 0,
        finalAmount: serviceAmount,
        cashbackAmount: 0,
        reason: 'Error validating offer'
      };
    }
  }

  /**
   * Calculate cashback for launch offers
   */
  async function calculateLaunchOfferCashback(
    userId: string,
    offerId: string,
    serviceAmount: number
  ): Promise<number> {
    try {
      const launchOffers = await storage.getActiveLaunchOffers();
      const launchOffer = launchOffers.find(o => o.id === offerId);
      
      if (!launchOffer) {
        return 0;
      }

      let cashbackAmount = 0;

      // Calculate cashback based on offer type
      if (launchOffer.walletCashbackPercent) {
        cashbackAmount = Math.floor((serviceAmount * launchOffer.walletCashbackPercent) / 100);
      } else if (launchOffer.walletBonusInPaisa) {
        cashbackAmount = launchOffer.walletBonusInPaisa;
      }

      return cashbackAmount;
    } catch (error) {
      console.error('Error calculating launch offer cashback:', error);
      return 0;
    }
  }

  // Auth routes - using session-based auth
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user roles and organization memberships
      const userRoles = await storage.getUserRoles(user.id);
      const orgMemberships = await storage.getUserOrganizations(user.id);
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        phoneVerified: user.phoneVerified === 1,
        profileImageUrl: user.profileImageUrl,
        workPreference: user.workPreference,
        businessCategory: user.businessCategory,
        roles: userRoles.map(role => role.name),
        orgMemberships
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Manual registration endpoint (works alongside Replit Auth)
  app.post('/api/auth/register', async (req: any, res) => {
    try {
      const { email, password, firstName, lastName, phone, userType, workPreference, panNumber, gstNumber, firebaseToken, phoneVerified } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      // Server-side Firebase token verification (if provided)
      let verifiedPhoneNumber: string | null = null;
      let isPhoneVerified = 0;

      if (firebaseToken && phoneVerified) {
        try {
          console.log('🔐 Verifying Firebase token for registration...');
          const decodedToken = await verifyFirebaseToken(firebaseToken);
          
          if (decodedToken) {
            verifiedPhoneNumber = getPhoneNumberFromToken(decodedToken);
            
            // Ensure the phone number from token matches the provided phone
            if (verifiedPhoneNumber && phone && verifiedPhoneNumber !== phone) {
              return res.status(400).json({ 
                error: "Phone number mismatch. The verified phone number does not match the provided phone." 
              });
            }
            
            isPhoneVerified = 1;
            console.log('✅ Firebase token verified successfully. Phone verified:', verifiedPhoneNumber);
          }
        } catch (error: any) {
          console.error('❌ Firebase token verification failed:', error.message);
          return res.status(400).json({ 
            error: error.message || "Failed to verify phone number. Please try again." 
          });
        }
      }

      // Hash password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash(password, 10);

      // Create user (businessCategory and businessName will be set later in business setup)
      const userData = {
        email,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        phone: verifiedPhoneNumber || phone || null,
        workPreference: workPreference || null,
        businessCategory: null, // Will be set during business setup wizard
        businessName: null, // Will be set when selecting business template
        panNumber: panNumber || null,
        gstNumber: gstNumber || null,
        emailVerified: 0,
        phoneVerified: isPhoneVerified,
        isActive: 1,
      };

      const newUser = await storage.createUser(userData);

      // Assign role based on userType
      const roleName = userType === 'owner' ? 'owner' : 'customer';
      
      // Get or create role
      let role = await storage.getRoleByName(roleName);
      if (!role) {
        role = await storage.createRole({
          name: roleName,
          description: userType === 'owner' ? 'Business owner' : 'Customer'
        });
      }

      // Assign role to user
      await storage.assignUserRole(newUser.id, role.id);

      // Automatically create organization and salon for business owners
      if (userType === 'owner') {
        try {
          // Create organization for the business owner
          const orgData = {
            name: `${firstName || 'My'} Business Organization`,
            description: 'Business organization for salon management',
            ownerUserId: newUser.id,
            status: 'active'
          };
          const newOrg = await storage.createOrganization(orgData);

          // Add owner as member of organization
          await storage.addUserToOrganization(newOrg.id, newUser.id, 'owner');

          // Create default salon for the organization with empty name (user will fill during setup)
          const salonData = {
            name: '', // Empty - user will provide during Business Info step
            organizationId: newOrg.id,
            ownerId: newUser.id,
            address: '',
            city: '',
            state: '',
            zipCode: '', // Use zipCode instead of postalCode
            phone: phone || '',
            email: email,
            category: '', // Empty - user will select during Business Info step
            priceRange: '', // Empty - will be set during setup
            description: '' // Empty - user will provide during Business Info step
          };
          const newSalon = await storage.createSalon(salonData);
          
          console.log(`Auto-created organization ${newOrg.id} and salon ${newSalon.id} for business owner ${newUser.id}`);
        } catch (orgError) {
          console.error("Failed to auto-create organization/salon for business owner:", orgError);
          // Don't fail registration if organization creation fails - they can create it later
        }
      }

      // Establish session after successful registration
      req.session.userId = newUser.id;

      console.log("Session established successfully after registration for user:", newUser.id);

      // Check user role for consistent redirect (same logic as login)
      const roles = await storage.getUserRoles(newUser.id);
      const isOwner = roles.some(role => role.name === 'owner');
      const isCustomer = roles.some(role => role.name === 'customer');
      
      let redirectUrl = '/';
      if (isOwner) {
        // Business owners go to business dashboard
        redirectUrl = '/business/dashboard';
      } else if (isCustomer) {
        // Customers go to customer dashboard
        redirectUrl = '/customer/dashboard';
      }

      // Generate and send email verification (production-ready with retry logic)
      try {
        // Generate secure verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // Hash the token before storing (SHA-256 for security)
        const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
        
        const verificationExpiry = new Date();
        verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24-hour expiry

        // Save hashed token to users table
        await storage.saveEmailVerificationToken(newUser.id, hashedToken, verificationExpiry);

        // Generate verification link
        const baseUrl = process.env.APP_BASE_URL || 
                       (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000');
        const verificationLink = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

        // Send appropriate welcome + verification email based on user type
        const isBusinessUser = userType === 'owner';
        
        if (isBusinessUser) {
          const { sendBusinessWelcomeVerificationEmail } = await import('./lib/sendgrid');
          await sendBusinessWelcomeVerificationEmail(
            newUser.email || '',
            verificationLink,
            newUser.firstName || undefined
          );
          console.log('✅ Business welcome + verification email sent to:', newUser.email);
        } else {
          const { sendWelcomeVerificationEmail } = await import('./lib/sendgrid');
          await sendWelcomeVerificationEmail(
            newUser.email || '',
            verificationLink,
            newUser.firstName || undefined
          );
          console.log('✅ Customer welcome + verification email sent to:', newUser.email);
        }

      } catch (emailError) {
        // Log error but don't block registration
        console.error('❌ Email verification sending failed (non-blocking):', emailError);
        // User can still log in and request verification later
      }

      // Success with session established - no verification required for immediate access
      const { password: _, ...userResponse } = newUser;
      res.status(200).json({
        success: true,
        user: userResponse,
        message: "Welcome to SalonHub! Your account has been created successfully.",
        requiresVerification: false, // Allow immediate access
        authenticated: true,
        redirect: redirectUrl  // Consistent role-based redirect
      });

    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to create account. Please try again." });
    }
  });

  // Email verification endpoint - verify email when user clicks link
  app.get('/api/auth/verify-email', async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.redirect('/email-verification-expired?error=invalid');
      }

      console.log('🔐 Verifying email with token...');

      // Hash the token to compare with stored hashed token (SHA-256)
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Get user by hashed verification token
      const user = await storage.getUserByEmailVerificationToken(hashedToken);

      if (!user) {
        console.log('❌ Invalid verification token');
        return res.redirect('/email-verification-expired?error=invalid');
      }

      // Check if already verified
      if (user.emailVerified === 1) {
        console.log('✅ Email already verified, redirecting to success page');
        return res.redirect('/email-verified?already=true');
      }

      // Check if token has expired
      if (!user.emailVerificationExpiry || new Date() > user.emailVerificationExpiry) {
        console.log('⏰ Verification token has expired');
        return res.redirect('/email-verification-expired?error=expired');
      }

      // Mark email as verified and clear token
      await storage.markEmailAsVerified(user.id);

      console.log('✅ Email verified successfully for user:', user.email);

      // Redirect to success page
      return res.redirect('/email-verified');

    } catch (error) {
      console.error('❌ Email verification error:', error);
      return res.redirect('/email-verification-expired?error=unknown');
    }
  });

  // Resend email verification endpoint with rate limiting (works for both authenticated and unauthenticated users)
  app.post('/api/auth/resend-verification', async (req: any, res) => {
    try {
      const { email } = req.body;
      const userId = req.session?.userId;

      let user;

      // Support both authenticated and unauthenticated resend requests
      if (userId) {
        // Authenticated user - get from session
        user = await storage.getUserById(userId);
      } else if (email) {
        // Unauthenticated user - lookup by email
        user = await storage.getUserByEmail(email);
      } else {
        return res.status(400).json({ 
          error: "Please provide your email address or log in to resend verification email." 
        });
      }

      if (!user || !user.email) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if already verified
      if (user.emailVerified === 1) {
        return res.status(400).json({ 
          error: "Email is already verified" 
        });
      }

      // Rate limiting: Check if verification email was sent in last 60 seconds
      if (user.emailVerificationSentAt) {
        const timeSinceLastSent = Date.now() - user.emailVerificationSentAt.getTime();
        const cooldownPeriod = 60 * 1000; // 60 seconds

        if (timeSinceLastSent < cooldownPeriod) {
          const remainingSeconds = Math.ceil((cooldownPeriod - timeSinceLastSent) / 1000);
          return res.status(429).json({ 
            error: `Please wait ${remainingSeconds} seconds before requesting another verification email.`,
            remainingSeconds
          });
        }
      }

      console.log('📧 Resending verification email to:', user.email);

      // Generate new secure verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Hash the token before storing (SHA-256 for security)
      const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
      
      const verificationExpiry = new Date();
      verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24-hour expiry

      // Save hashed token to users table
      await storage.saveEmailVerificationToken(user.id, hashedToken, verificationExpiry);

      // Generate verification link (use unhashed token in URL)
      const baseUrl = process.env.APP_BASE_URL || 
                     (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000');
      const verificationLink = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

      // Determine if business user
      const isBusinessUser = user.workPreference !== null || user.businessCategory !== null;

      // Send appropriate welcome + verification email
      if (isBusinessUser) {
        const { sendBusinessWelcomeVerificationEmail } = await import('./lib/sendgrid');
        await sendBusinessWelcomeVerificationEmail(
          user.email,
          verificationLink,
          user.firstName || undefined
        );
      } else {
        const { sendWelcomeVerificationEmail } = await import('./lib/sendgrid');
        await sendWelcomeVerificationEmail(
          user.email,
          verificationLink,
          user.firstName || undefined
        );
      }

      console.log('✅ Verification email resent successfully to:', user.email);

      res.json({
        success: true,
        message: "Verification email sent! Please check your inbox.",
        emailSent: true
      });

    } catch (error) {
      console.error('❌ Error resending verification email:', error);
      res.status(500).json({ 
        error: "Failed to resend verification email. Please try again later." 
      });
    }
  });

  // Logout endpoint
  app.post('/api/logout', (req: any, res) => {
    if (req.session) {
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ error: "Failed to logout" });
        }
        res.json({ success: true, message: "Logged out successfully" });
      });
    } else {
      res.json({ success: true, message: "Already logged out" });
    }
  });

  // ===============================================
  // USER EXISTENCE CHECK API (Public with Rate Limiting)
  // ===============================================
  
  // Check if a user exists with given email/phone
  // Used during booking to identify existing users vs guests
  // Rate limited to prevent user enumeration attacks
  app.post('/api/auth/check-user-exists', communicationRateLimits.strict, async (req, res) => {
    try {
      const { email, phone } = req.body;

      // Require at least one identifier
      if (!email && !phone) {
        return res.status(400).json({ 
          error: "Email or phone number is required" 
        });
      }

      // Security: Add a small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 200));

      let userExists = false;
      let hasAccount = false;

      // Check by email first (most common)
      if (email) {
        const user = await storage.getUserByEmail(email);
        if (user) {
          userExists = true;
          // Check if user has a password (not just OAuth/phone-only account)
          hasAccount = !!user.password || user.emailVerified === 1;
        }
      }

      // Check by phone if email didn't find a user
      if (!userExists && phone) {
        const user = await storage.getUserByPhone(phone);
        if (user) {
          userExists = true;
          hasAccount = !!user.password || user.phoneVerified === 1;
        }
      }

      // Return limited information to prevent enumeration
      // Only indicate if user "can log in" (has account credentials)
      res.json({ 
        exists: userExists,
        hasAccount: hasAccount,
        // Suggest action based on account status
        suggestedAction: hasAccount ? 'login' : 'guest'
      });

    } catch (error) {
      console.error("Error checking user existence:", error);
      // Return generic response on error to avoid information leakage
      res.json({ 
        exists: false,
        hasAccount: false,
        suggestedAction: 'guest'
      });
    }
  });

  // Organization endpoints
  app.post('/api/organizations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { name, description } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: "Organization name is required" });
      }

      // Create organization
      const orgData = {
        name,
        description: description || '',
        ownerUserId: userId,
        status: 'active'
      };

      const newOrg = await storage.createOrganization(orgData);

      // Add user as owner to organization
      await storage.addUserToOrganization(newOrg.id, userId, 'owner');

      // Create a default salon for the organization
      const salonData = {
        name: name + " Salon",
        description: "Your business salon",
        address: "Please update your address",
        city: "Please update",
        state: "Please update", 
        zipCode: "00000",
        phone: "Please update your phone",
        email: req.user.email || "Please update",
        category: "hair_salon",
        priceRange: "$$",
        orgId: newOrg.id,
        ownerId: userId,
        isActive: 1
      };

      const newSalon = await storage.createSalon(salonData);

      res.status(201).json({
        success: true,
        organization: newOrg,
        salon: newSalon,
        message: "Organization and salon created successfully"
      });

    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ error: "Failed to create organization. Please try again." });
    }
  });

  // POST /api/salons - Create a new salon for the current user
  app.post('/api/salons', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const {
        name,
        category,
        description,
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        priceRange
      } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: "Salon name is required" });
      }

      // Get user's first organization (or create one if needed)
      const userOrgs = await storage.getUserOrganizations(userId);
      let orgId = userOrgs[0]?.organization?.id;

      if (!orgId) {
        // Create organization if user doesn't have one
        const newOrg = await storage.createOrganization({
          name: `${req.user.firstName || 'Business'} Organization`,
          description: 'Business organization for salon management',
          ownerUserId: userId,
          status: 'active'
        });
        await storage.addUserToOrganization(newOrg.id, userId, 'owner');
        orgId = newOrg.id;
      }

      // Create salon
      const salonData = {
        name,
        description: description || '',
        address: address || 'To be configured',
        city: city || 'To be configured',
        state: state || 'To be configured',
        zipCode: zipCode || '00000',
        phone: phone || '0000000000',
        email: email || req.user.email || 'configure@salonhub.com',
        category: category || 'hair_salon',
        priceRange: priceRange || '$$',
        orgId,
        ownerId: userId,
        isActive: 1
      };

      const newSalon = await storage.createSalon(salonData);

      res.status(201).json(newSalon);

    } catch (error) {
      console.error("Error creating salon:", error);
      res.status(500).json({ error: "Failed to create salon. Please try again." });
    }
  });

  // Manual login endpoint (email/password)
  app.post('/api/auth/login', async (req: any, res) => {
    try {
      const { email, password, loginType } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Check if user has a password (could be social auth user)
      if (!user.password) {
        return res.status(401).json({ 
          error: "This account was created with social authentication. Please contact support to set a password." 
        });
      }

      // Verify password
      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.default.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Validate user type matches the login portal
      const isBusinessUser = !!(user.workPreference || user.businessCategory || user.businessName);
      
      if (loginType === 'customer' && isBusinessUser) {
        return res.status(403).json({ 
          error: "This is a business account. Please use the business login portal.",
          redirectTo: "/login/business"
        });
      }
      
      if (loginType === 'business' && !isBusinessUser) {
        return res.status(403).json({ 
          error: "This is a customer account. Please use the customer login portal.",
          redirectTo: "/login/customer"
        });
      }

      // Email verification is now optional - users can login without verification
      // We'll show a banner in the dashboard encouraging verification for enhanced security

      // Establish session after successful login
      req.session.userId = user.id;

      // Check user role for redirect
      const roles = await storage.getUserRoles(user.id);
      const isSuperAdmin = roles.some(role => role.name === 'super_admin');
      const isOwner = roles.some(role => role.name === 'owner');
      const isCustomer = roles.some(role => role.name === 'customer');
      
      let redirectUrl = '/';
      if (isSuperAdmin) {
        // Redirect super admins to admin dashboard
        redirectUrl = '/admin/dashboard';
      } else if (isOwner) {
        // Always redirect business owners to dashboard - dashboard handles setup within tabs
        redirectUrl = '/business/dashboard';
      } else if (isCustomer) {
        // Redirect customers to their dashboard
        redirectUrl = '/customer/dashboard';
      }

      // Success response
      const { password: _, ...userResponse } = user;
      res.json({
        success: true,
        user: userResponse,
        message: "Login successful",
        authenticated: true,
        redirect: redirectUrl
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed. Please try again." });
    }
  });

  // Password Reset Flow - Step 1: Send Reset Email
  // Note: Also aliased as '/api/auth/request-password-reset' for frontend compatibility
  app.post('/api/auth/send-password-reset', async (req: any, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);

      // Security: Don't reveal if email exists or not
      const successMessage = "If an account exists with this email, you will receive a password reset link.";

      if (!user) {
        return res.json({ message: successMessage });
      }

      // Generate reset token (this will be sent in the email)
      const { randomUUID, createHash } = await import('crypto');
      const resetToken = randomUUID();
      const resetExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Hash the token before storing in database for security
      // Using SHA-256 for deterministic hashing (unlike bcrypt which uses salt)
      const hashedToken = createHash('sha256').update(resetToken).digest('hex');

      // Save hashed token to database
      await storage.savePasswordResetToken(user.id, hashedToken, resetExpiry);

      // Build reset link with proper domain configuration
      // Priority: APP_BASE_URL (production/custom) > REPLIT_DOMAINS (Replit env) > localhost (dev)
      let baseUrl = process.env.APP_BASE_URL;
      
      if (!baseUrl && process.env.REPLIT_DOMAINS) {
        // REPLIT_DOMAINS can be comma-separated, take the first one
        const domains = process.env.REPLIT_DOMAINS.split(',');
        baseUrl = `https://${domains[0].trim()}`;
      }
      
      if (!baseUrl) {
        baseUrl = 'http://localhost:5000';
      }
      
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

      // Send email via SendGrid
      const { sendPasswordResetEmail } = await import('./lib/sendgrid');
      try {
        await sendPasswordResetEmail(email, resetLink, user.firstName);
        console.log(`[Password Reset] Email sent to ${email}`);
      } catch (emailError) {
        console.error('[Password Reset] Email error:', emailError);
        // Don't fail the request if email fails, return success message anyway
      }

      return res.json({ message: successMessage });
    } catch (error: any) {
      console.error('[Password Reset] Error:', error);
      return res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Password Reset Flow - Step 2: Verify Reset Token
  app.post('/api/auth/verify-reset-token', async (req: any, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      // Hash the incoming token to compare with stored hash
      const { createHash } = await import('crypto');
      const hashedToken = createHash('sha256').update(token).digest('hex');

      const user = await storage.getUserByPasswordResetToken(hashedToken);

      if (!user || !user.passwordResetToken || !user.passwordResetExpiry) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      // Check if token has expired
      if (new Date(user.passwordResetExpiry) < new Date()) {
        // Clear expired token
        await storage.clearPasswordResetToken(user.id);
        return res.status(400).json({ error: "Token has expired. Please request a new password reset." });
      }

      return res.json({ 
        valid: true, 
        email: user.email 
      });
    } catch (error) {
      console.error('[Verify Reset Token] Error:', error);
      return res.status(500).json({ error: "Failed to verify token" });
    }
  });

  // Alias for frontend compatibility (request-password-reset → send-password-reset)
  app.post('/api/auth/request-password-reset', async (req: any, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      const successMessage = "If an account exists with this email, you will receive a password reset link.";

      if (!user) {
        return res.json({ message: successMessage });
      }

      const { randomUUID, createHash } = await import('crypto');
      const resetToken = randomUUID();
      const resetExpiry = new Date(Date.now() + 3600000);
      const hashedToken = createHash('sha256').update(resetToken).digest('hex');

      await storage.savePasswordResetToken(user.id, hashedToken, resetExpiry);

      let baseUrl = process.env.APP_BASE_URL;
      
      if (!baseUrl && process.env.REPLIT_DOMAINS) {
        const domains = process.env.REPLIT_DOMAINS.split(',');
        baseUrl = `https://${domains[0].trim()}`;
      }
      
      if (!baseUrl) {
        baseUrl = 'http://localhost:5000';
      }
      
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

      const { sendPasswordResetEmail } = await import('./lib/sendgrid');
      try {
        await sendPasswordResetEmail(email, resetLink, user.firstName);
        console.log(`[Password Reset] Email sent to ${email}`);
      } catch (emailError) {
        console.error('[Password Reset] Email error:', emailError);
      }

      return res.json({ message: successMessage });
    } catch (error: any) {
      console.error('[Password Reset] Error:', error);
      return res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Password Reset Flow - Step 3: Confirm Password Reset
  app.post('/api/auth/confirm-password-reset', async (req: any, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }

      // Validate password strength
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      // Hash the incoming token to compare with stored hash
      const { createHash } = await import('crypto');
      const hashedToken = createHash('sha256').update(token).digest('hex');

      // Verify token
      const user = await storage.getUserByPasswordResetToken(hashedToken);

      if (!user || !user.passwordResetToken || !user.passwordResetExpiry) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      if (new Date(user.passwordResetExpiry) < new Date()) {
        await storage.clearPasswordResetToken(user.id);
        return res.status(400).json({ error: "Token has expired" });
      }

      // Hash the new password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash(newPassword, 10);

      // Update password and clear reset token
      await storage.updateUserPassword(user.id, hashedPassword);
      await storage.clearPasswordResetToken(user.id);

      // Send confirmation email
      const { sendPasswordChangedEmail } = await import('./lib/sendgrid');
      try {
        await sendPasswordChangedEmail(user.email!, user.firstName);
      } catch (emailError) {
        console.error('[Password Changed Email] Error:', emailError);
        // Don't fail the request if email fails
      }

      return res.json({ message: "Password successfully reset. You can now login with your new password." });
    } catch (error: any) {
      console.error('[Confirm Password Reset] Error:', error);
      return res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Password Reset via Firebase Phone OTP
  app.post('/api/auth/reset-password-via-phone', async (req: any, res) => {
    try {
      const { firebaseToken, phoneNumber, newPassword } = req.body;

      if (!firebaseToken || !phoneNumber || !newPassword) {
        return res.status(400).json({ error: "Firebase token, phone number, and new password are required" });
      }

      // Validate password strength
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }

      // Verify Firebase token
      const { verifyFirebaseToken, getPhoneNumberFromToken } = await import('./firebaseAdmin');
      
      try {
        const decodedToken = await verifyFirebaseToken(firebaseToken);
        const tokenPhone = getPhoneNumberFromToken(decodedToken);

        // Validate that we have a phone number in the token
        if (!tokenPhone) {
          return res.status(400).json({ error: "Firebase token does not contain a phone number" });
        }

        // Ensure phone numbers match
        const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
        if (normalizePhone(tokenPhone) !== normalizePhone(phoneNumber)) {
          return res.status(400).json({ error: "Phone number mismatch" });
        }

        // Find user by phone number
        const user = await storage.getUserByPhone(phoneNumber);

        if (!user) {
          return res.status(404).json({ error: "No account found with this phone number" });
        }

        // Hash the new password
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.default.hash(newPassword, 10);

        // Update password
        await storage.updateUserPassword(user.id, hashedPassword);

        // Send confirmation email if user has email
        if (user.email) {
          const { sendPasswordChangedEmail } = await import('./lib/sendgrid');
          try {
            await sendPasswordChangedEmail(user.email, user.firstName);
          } catch (emailError) {
            console.error('[Password Changed Email] Error:', emailError);
            // Don't fail the request if email fails
          }
        }

        console.log(`[Password Reset via Phone] Password reset successful for user ${user.id}`);

        return res.json({ 
          success: true,
          message: "Password successfully reset. You can now login with your new password." 
        });
      } catch (firebaseError: any) {
        console.error('[Firebase Verification] Error:', firebaseError);
        return res.status(400).json({ error: "Invalid or expired Firebase token" });
      }
    } catch (error: any) {
      console.error('[Reset Password via Phone] Error:', error);
      return res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // TEST: Alternative endpoint to debug Vite proxy issue
  app.get('/api/salon-details/:salonId', async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const salon = await storage.getSalon(salonId);
      
      if (!salon) {
        return res.status(404).json({ error: 'Salon not found' });
      }

      const mediaAssets = await storage.getMediaAssetsBySalonId(salonId);
      const primaryImage = mediaAssets?.find((asset: any) => asset.type === 'image' && asset.isPrimary === 1)?.url || 
                          mediaAssets?.find((asset: any) => asset.type === 'image')?.url || '';
      
      const salonWithImage = {
        ...salon,
        image: primaryImage,
        openTime: salon.openTime || '09:00',
        closeTime: salon.closeTime || '18:00'
      };
      
      res.json(salonWithImage);
    } catch (error) {
      console.error('Error fetching salon:', error);
      res.status(500).json({ error: 'Failed to fetch salon' });
    }
  });

  // PUBLIC: Get salon information for customer viewing (no auth required)
  app.get('/api/salons/:salonId', async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const salon = await storage.getSalon(salonId);
      
      if (!salon) {
        return res.status(404).json({ error: 'Salon not found' });
      }

      const mediaAssets = await storage.getMediaAssetsBySalonId(salonId);
      const primaryImage = mediaAssets?.find((asset: any) => asset.type === 'image' && asset.isPrimary === 1)?.url || 
                          mediaAssets?.find((asset: any) => asset.type === 'image')?.url || '';
      
      const salonWithImage = {
        ...salon,
        image: primaryImage,
        openTime: salon.openTime || '09:00',
        closeTime: salon.closeTime || '18:00'
      };
      
      res.json(salonWithImage);
    } catch (error) {
      console.error('Error fetching salon:', error);
      res.status(500).json({ error: 'Failed to fetch salon' });
    }
  });

  // PROTECTED: Get salon information for business management
  app.get('/api/salons/:salonId/manage', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const salon = await storage.getSalon(salonId);
      
      if (!salon) {
        return res.status(404).json({ error: 'Salon not found' });
      }
      
      res.json(salon);
    } catch (error) {
      console.error('Error fetching salon:', error);
      res.status(500).json({ error: 'Failed to fetch salon' });
    }
  });

  // Update salon information (for business setup)
  app.put('/api/salons/:salonId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      // Validate input using Zod schema (partial updates allowed)
      const partialSchema = insertSalonSchema.partial();
      const validationResult = partialSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      await storage.updateSalon(salonId, validationResult.data);
      
      // Return updated salon
      const updatedSalon = await storage.getSalon(salonId);
      res.json(updatedSalon);
    } catch (error) {
      console.error('Error updating salon:', error);
      res.status(500).json({ error: 'Failed to update salon' });
    }
  });

  // Delete salon (with validation to prevent deleting last salon)
  app.delete('/api/salons/:salonId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const userId = req.user.id;
      
      // Get all user's salons using the same logic as /api/my/salons
      const orgMemberships = await storage.getUserOrganizations(userId);
      const allSalons = await storage.getSalons();
      const accessibleSalons = allSalons.filter(salon => {
        if (salon.ownerId === userId) return true;
        if (salon.orgId) {
          return orgMemberships.some((membership: any) => 
            membership.orgId === salon.orgId && 
            ['owner', 'manager'].includes(membership.orgRole)
          );
        }
        return false;
      });
      
      if (accessibleSalons.length <= 1) {
        return res.status(400).json({ 
          error: 'Cannot delete your only salon. You must have at least one salon.' 
        });
      }
      
      // Delete the salon
      await storage.deleteSalon(salonId);
      
      res.json({ 
        success: true, 
        message: 'Salon deleted successfully',
        remainingSalons: accessibleSalons.length - 1
      });
    } catch (error) {
      console.error('Error deleting salon:', error);
      res.status(500).json({ error: 'Failed to delete salon' });
    }
  });

  // Get salon setup completion status (validates all 8 required steps)
  app.get('/api/salons/:salonId/setup-status', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      // Fetch salon and related data
      const [salon, services, staff, bookingSettings, payoutAccount, mediaAssets] = await Promise.all([
        storage.getSalon(salonId),
        storage.getServicesBySalonId(salonId),
        storage.getStaffBySalonId(salonId),
        storage.getBookingSettings(salonId),
        storage.getPayoutAccount(salonId),
        storage.getMediaAssetsBySalonId(salonId),
      ]);

      if (!salon) {
        return res.status(404).json({ error: 'Salon not found' });
      }

      // Validate each of the 8 setup steps
      const setupStatus = {
        businessInfo: {
          completed: !!(salon.name && salon.category),
          requiredFields: ['name', 'category'],
          missingFields: [] as string[],
        },
        locationContact: {
          completed: !!(salon.address && salon.city && salon.state && salon.zipCode && salon.latitude && salon.longitude && salon.phone && salon.email),
          requiredFields: ['address', 'city', 'state', 'zipCode', 'latitude', 'longitude', 'phone', 'email'],
          missingFields: [] as string[],
        },
        services: {
          completed: services && services.length > 0,
          count: services?.length || 0,
          message: services && services.length > 0 ? `${services.length} service(s) added` : 'No services added yet',
        },
        staff: {
          completed: staff && staff.length > 0,
          count: staff?.length || 0,
          message: staff && staff.length > 0 ? `${staff.length} team member(s) added` : 'No staff added yet',
        },
        resources: {
          completed: true, // Optional step
          optional: true,
          message: 'Resources are optional',
        },
        bookingSettings: {
          completed: !!bookingSettings,
          message: bookingSettings ? 'Booking settings configured' : 'Booking settings not configured',
        },
        paymentSetup: {
          completed: !!payoutAccount,
          optional: true, // Optional - salon can publish and configure payments later
          message: payoutAccount ? 'Payment account configured' : 'Payment not configured - bookings will work but payments disabled',
        },
        media: {
          completed: mediaAssets && mediaAssets.length > 0,
          count: mediaAssets?.length || 0,
          message: mediaAssets && mediaAssets.length > 0 ? `${mediaAssets.length} photo(s) uploaded` : 'No photos uploaded yet',
        },
      };

      // Calculate missing fields for businessInfo
      if (!setupStatus.businessInfo.completed) {
        setupStatus.businessInfo.missingFields = setupStatus.businessInfo.requiredFields.filter(
          field => !salon[field as keyof typeof salon]
        );
      }

      // Calculate missing fields for locationContact
      if (!setupStatus.locationContact.completed) {
        setupStatus.locationContact.missingFields = setupStatus.locationContact.requiredFields.filter(
          field => !salon[field as keyof typeof salon]
        );
      }

      // Calculate overall completion (resources and payment setup are optional)
      // Payment setup is optional to allow quick launch - salon can configure payments later
      const requiredSteps = ['businessInfo', 'locationContact', 'services', 'staff', 'bookingSettings', 'media'] as const;
      const completedSteps = requiredSteps.filter(step => setupStatus[step].completed);
      const isSetupComplete = completedSteps.length === requiredSteps.length;

      // Update setup_progress in database
      const progressData = {
        businessInfo: { completed: setupStatus.businessInfo.completed, timestamp: new Date().toISOString() },
        locationContact: { completed: setupStatus.locationContact.completed, timestamp: new Date().toISOString() },
        services: { completed: setupStatus.services.completed, timestamp: new Date().toISOString() },
        staff: { completed: setupStatus.staff.completed, timestamp: new Date().toISOString() },
        resources: { completed: setupStatus.resources.completed, timestamp: new Date().toISOString() },
        bookingSettings: { completed: setupStatus.bookingSettings.completed, timestamp: new Date().toISOString() },
        paymentSetup: { completed: setupStatus.paymentSetup.completed, timestamp: new Date().toISOString() },
        media: { completed: setupStatus.media.completed, timestamp: new Date().toISOString() },
        lastUpdated: new Date().toISOString(),
        isComplete: isSetupComplete,
      };

      await storage.updateSalon(salonId, { setupProgress: progressData });

      res.json({
        salonId,
        isSetupComplete,
        completedSteps: completedSteps.length,
        totalSteps: requiredSteps.length,
        progress: Math.round((completedSteps.length / requiredSteps.length) * 100),
        steps: setupStatus,
      });
    } catch (error) {
      console.error('Error fetching salon setup status:', error);
      res.status(500).json({ error: 'Failed to fetch setup status' });
    }
  });

  // =================================
  // INVENTORY MANAGEMENT ROUTES
  // =================================

  // Product Categories
  app.get('/api/salons/:salonId/product-categories', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const categories = await storage.getProductCategoriesBySalonId(salonId);
      res.json(categories);
    } catch (error) {
      console.error('Error fetching product categories:', error);
      res.status(500).json({ error: 'Failed to fetch product categories' });
    }
  });

  app.post('/api/salons/:salonId/product-categories', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const category = await storage.createProductCategory({ ...req.body, salonId });
      res.status(201).json(category);
    } catch (error: any) {
      console.error('Error creating product category:', error);
      res.status(400).json({ error: error.message || 'Failed to create product category' });
    }
  });

  app.put('/api/salons/:salonId/product-categories/:categoryId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, categoryId } = req.params;
      await storage.updateProductCategory(categoryId, salonId, req.body);
      res.json({ success: true, message: 'Category updated successfully' });
    } catch (error: any) {
      console.error('Error updating product category:', error);
      res.status(400).json({ error: error.message || 'Failed to update product category' });
    }
  });

  app.delete('/api/salons/:salonId/product-categories/:categoryId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, categoryId } = req.params;
      await storage.deleteProductCategory(categoryId, salonId);
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting product category:', error);
      res.status(400).json({ error: error.message || 'Failed to delete product category' });
    }
  });

  // Initialize default categories
  app.post('/api/salons/:salonId/product-categories/init-defaults', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const categories = await storage.createDefaultProductCategories(salonId);
      res.status(201).json({ success: true, categories, message: 'Default categories created successfully' });
    } catch (error: any) {
      console.error('Error creating default categories:', error);
      res.status(400).json({ error: error.message || 'Failed to create default categories' });
    }
  });

  // Vendors
  app.get('/api/salons/:salonId/vendors', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const vendors = await storage.getVendorsBySalonId(salonId);
      res.json(vendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      res.status(500).json({ error: 'Failed to fetch vendors' });
    }
  });

  app.post('/api/salons/:salonId/vendors', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const vendor = await storage.createVendor({ ...req.body, salonId });
      res.status(201).json(vendor);
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      res.status(400).json({ error: error.message || 'Failed to create vendor' });
    }
  });

  app.put('/api/salons/:salonId/vendors/:vendorId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, vendorId } = req.params;
      await storage.updateVendor(vendorId, salonId, req.body);
      res.json({ success: true, message: 'Vendor updated successfully' });
    } catch (error: any) {
      console.error('Error updating vendor:', error);
      res.status(400).json({ error: error.message || 'Failed to update vendor' });
    }
  });

  app.delete('/api/salons/:salonId/vendors/:vendorId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, vendorId } = req.params;
      await storage.deleteVendor(vendorId, salonId);
      res.json({ success: true, message: 'Vendor deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      res.status(400).json({ error: error.message || 'Failed to delete vendor' });
    }
  });

  // Products
  app.get('/api/salons/:salonId/products', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const filters = {
        categoryId: req.query.categoryId,
        vendorId: req.query.vendorId,
        lowStock: req.query.lowStock === 'true',
        search: req.query.search,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      };
      const products = await storage.getProductsBySalonId(salonId, filters);
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.get('/api/salons/:salonId/products/low-stock', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const products = await storage.getLowStockProducts(salonId);
      res.json(products);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      res.status(500).json({ error: 'Failed to fetch low stock products' });
    }
  });

  app.post('/api/salons/:salonId/products', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const product = await storage.createProduct({ ...req.body, salonId });
      res.status(201).json(product);
    } catch (error: any) {
      console.error('Error creating product:', error);
      res.status(400).json({ error: error.message || 'Failed to create product' });
    }
  });

  app.put('/api/salons/:salonId/products/:productId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, productId } = req.params;
      await storage.updateProduct(productId, salonId, req.body);
      res.json({ success: true, message: 'Product updated successfully' });
    } catch (error: any) {
      console.error('Error updating product:', error);
      res.status(400).json({ error: error.message || 'Failed to update product' });
    }
  });

  app.delete('/api/salons/:salonId/products/:productId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, productId } = req.params;
      await storage.deleteProduct(productId, salonId);
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      res.status(400).json({ error: error.message || 'Failed to delete product' });
    }
  });

  // Stock Movements
  app.get('/api/salons/:salonId/stock-movements', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const filters = {
        productId: req.query.productId,
        type: req.query.type,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      };
      const movements = await storage.getStockMovementsBySalonId(salonId, filters);
      res.json(movements);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      res.status(500).json({ error: 'Failed to fetch stock movements' });
    }
  });

  app.get('/api/salons/:salonId/products/:productId/stock-movements', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, productId } = req.params;
      const movements = await storage.getStockMovementsByProduct(productId, salonId);
      res.json(movements);
    } catch (error) {
      console.error('Error fetching product stock movements:', error);
      res.status(500).json({ error: 'Failed to fetch product stock movements' });
    }
  });

  app.post('/api/salons/:salonId/stock-movements', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { allowNegativeStock, ...movementData } = req.body;
      const movement = await storage.createStockMovement(
        { ...movementData, salonId, staffId: req.user.id },
        { allowNegativeStock }
      );
      res.status(201).json(movement);
    } catch (error: any) {
      console.error('Error creating stock movement:', error);
      res.status(400).json({ error: error.message || 'Failed to create stock movement' });
    }
  });

  // Purchase Orders
  app.get('/api/salons/:salonId/purchase-orders', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const filters = {
        status: req.query.status,
        vendorId: req.query.vendorId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      };
      const orders = await storage.getPurchaseOrdersBySalonId(salonId, filters);
      res.json(orders);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
  });

  app.get('/api/salons/:salonId/purchase-orders/:orderId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, orderId } = req.params;
      const [order, items] = await Promise.all([
        storage.getPurchaseOrder(orderId, salonId),
        storage.getPurchaseOrderItems(orderId, salonId),
      ]);
      
      if (!order) {
        return res.status(404).json({ error: 'Purchase order not found' });
      }
      
      res.json({ ...order, items });
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      res.status(500).json({ error: 'Failed to fetch purchase order' });
    }
  });

  app.post('/api/salons/:salonId/purchase-orders', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { items, ...orderData } = req.body;
      
      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Purchase order must have at least one item' });
      }
      
      const result = await storage.createPurchaseOrder(
        { ...orderData, salonId, createdBy: req.user.id },
        items
      );
      
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error creating purchase order:', error);
      res.status(400).json({ error: error.message || 'Failed to create purchase order' });
    }
  });

  app.put('/api/salons/:salonId/purchase-orders/:orderId/approve', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, orderId } = req.params;
      await storage.approvePurchaseOrder(orderId, salonId, req.user.id);
      res.json({ success: true, message: 'Purchase order approved successfully' });
    } catch (error: any) {
      console.error('Error approving purchase order:', error);
      res.status(400).json({ error: error.message || 'Failed to approve purchase order' });
    }
  });

  app.put('/api/salons/:salonId/purchase-orders/:orderId/receive', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, orderId } = req.params;
      const { receivedItems } = req.body;
      
      if (!receivedItems || receivedItems.length === 0) {
        return res.status(400).json({ error: 'Received items are required' });
      }
      
      await storage.receivePurchaseOrder(orderId, salonId, req.user.id, receivedItems);
      res.json({ success: true, message: 'Purchase order received successfully' });
    } catch (error: any) {
      console.error('Error receiving purchase order:', error);
      res.status(400).json({ error: error.message || 'Failed to receive purchase order' });
    }
  });

  app.delete('/api/salons/:salonId/purchase-orders/:orderId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, orderId } = req.params;
      await storage.deletePurchaseOrder(orderId, salonId);
      res.json({ success: true, message: 'Purchase order deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting purchase order:', error);
      res.status(400).json({ error: error.message || 'Failed to delete purchase order' });
    }
  });

  // Email verification endpoint
  app.get('/verify-email', async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).send(`
          <html>
            <head><title>Invalid Token</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #e74c3c;">Invalid Verification Link</h1>
              <p>The verification link is invalid or missing.</p>
              <a href="/" style="color: #8b5cf6; text-decoration: none;">Return to SalonHub</a>
            </body>
          </html>
        `);
      }

      const verification = await storage.verifyEmailToken(token);

      if (!verification.success) {
        return res.status(400).send(`
          <html>
            <head><title>Verification Failed</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #e74c3c;">Verification Failed</h1>
              <p>The verification link has expired or is invalid.</p>
              <a href="/join" style="color: #8b5cf6; text-decoration: none;">Sign up again</a>
            </body>
          </html>
        `);
      }

      // Mark email as verified
      if (verification.userId) {
        await storage.markEmailAsVerified(verification.userId);
      }

      // Send success page (like Fresha)
      res.send(`
        <html>
          <head>
            <title>Email Verified - SalonHub</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
            <div style="max-width: 400px; margin: 50px auto; background: white; padding: 40px 20px; text-align: center; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="margin-bottom: 30px;">
                <div style="width: 80px; height: 80px; background-color: #22c55e; border-radius: 50%; margin: 0 auto 20px; position: relative;">
                  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 40px; line-height: 1;">✓</div>
                </div>
                <h1 style="color: #333; font-size: 24px; margin: 0;">Email address verified!</h1>
              </div>
              <p style="color: #666; margin-bottom: 30px; line-height: 1.5;">
                Thanks for verifying your email address. You can now go to SalonHub and manage your ${verification.userId ? 'account' : 'bookings'} in one place.
              </p>
              <a href="/" style="background-color: #333; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Go to SalonHub
              </a>
            </div>
          </body>
        </html>
      `);

    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).send(`
        <html>
          <head><title>Error</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #e74c3c;">Verification Error</h1>
            <p>Something went wrong. Please try again.</p>
            <a href="/" style="color: #8b5cf6; text-decoration: none;">Return to SalonHub</a>
          </body>
        </html>
      `);
    }
  });

  // Resend verification email endpoint
  app.post('/api/auth/resend-verification', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if already verified
      if (user.emailVerified === 1) {
        return res.status(400).json({ error: "Email is already verified" });
      }

      // Create new verification token and send email
      const verificationToken = await storage.createVerificationToken(user.email || '', user.id);
      const emailSent = await sendVerificationEmail(user.email || '', user.firstName || 'User', verificationToken);

      res.json({
        success: true,
        message: "Verification email sent successfully",
        emailSent: emailSent
      });

    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ error: "Failed to resend verification email" });
    }
  });

  // Note: Profile completion check removed - business setup handled in dashboard
  // Legacy endpoint disabled
  app.post('/api/auth/check-profile-completion-disabled', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ 
          exists: false,
          message: "User not found" 
        });
      }

      // Check if user is a business owner
      const roles = await storage.getUserRoles(user.id);
      const isOwner = roles.some(role => role.name === 'owner');
      
      if (!isOwner) {
        return res.json({
          exists: true,
          isOwner: false,
          message: "User exists but is not a business owner"
        });
      }

      // Check if user has any salons
      const userOrganizations = await storage.getUserOrganizations(user.id);
      const salonIds: string[] = [];
      
      for (const org of userOrganizations) {
        const orgSalons = await storage.getSalonsByOrgId(org.orgId);
        salonIds.push(...orgSalons.map(salon => salon.id));
      }

      if (salonIds.length === 0) {
        return res.json({
          exists: true,
          isOwner: true,
          hasProfile: false,
          profileComplete: false,
          message: "Business owner exists but no salon profile created",
          nextStep: "business-info",
          resumeUrl: "/business/setup"
        });
      }

      // Check completion status of the first salon (main salon)
      const primarySalonId = salonIds[0];
      const readinessCheck = await storage.checkBusinessReadiness(primarySalonId);
      
      // Determine next step based on missing requirements
      let nextStep = "review-publish";
      if (readinessCheck.missingRequirements.includes("Complete salon basic information")) {
        nextStep = "business-info";
      } else if (readinessCheck.missingRequirements.includes("Add at least one service")) {
        nextStep = "services";
      } else if (readinessCheck.missingRequirements.includes("Add at least one staff member")) {
        nextStep = "staff";  
      } else if (readinessCheck.missingRequirements.includes("Configure booking settings")) {
        nextStep = "booking-settings";
      } else if (readinessCheck.missingRequirements.includes("Configure payout account")) {
        nextStep = "payment-setup";
      }

      return res.json({
        exists: true,
        isOwner: true,
        hasProfile: true,
        profileComplete: readinessCheck.isReady,
        salonId: primarySalonId,
        missingRequirements: readinessCheck.missingRequirements,
        nextStep: nextStep,
        resumeUrl: `/business/setup?step=${nextStep}&salonId=${primarySalonId}`,
        message: readinessCheck.isReady 
          ? "Business profile is complete" 
          : `Business profile needs completion: ${readinessCheck.missingRequirements.join(", ")}`
      });

    } catch (error) {
      console.error("Profile completion check error:", error);
      res.status(500).json({ error: "Failed to check profile completion status" });
    }
  });

  // ===============================================
  // USER SAVED LOCATIONS API (Protected)
  // ===============================================

  // Get all saved locations for the authenticated user
  app.get('/api/user/saved-locations', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      const userId = req.user.id;
      const savedLocations = await storage.getUserSavedLocationsByUserId(userId);
      
      res.json({
        success: true,
        savedLocations
      });
    } catch (error) {
      console.error('Error fetching saved locations:', error);
      res.status(500).json({ 
        error: 'Failed to fetch saved locations',
        message: 'Please try again later'
      });
    }
  });

  // Create a new saved location
  app.post('/api/user/saved-locations', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      const userId = req.user.id;
      const locationData = {
        ...req.body,
        userId
      };

      // Validate input using Zod schema
      const validation = insertUserSavedLocationSchema.safeParse(locationData);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid location data',
          details: validation.error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const validatedData = validation.data;

      // Check if user already has this label (for home/office)
      if (['home', 'office'].includes(validatedData.label)) {
        const existing = await storage.getUserSavedLocationByUserIdAndLabel(userId, validatedData.label);
        if (existing) {
          return res.status(409).json({
            error: `You already have a ${validatedData.label} location saved`,
            message: `Please update your existing ${validatedData.label} location instead`
          });
        }
      }

      const newLocation = await storage.createUserSavedLocation(validatedData);
      
      res.status(201).json({
        success: true,
        savedLocation: newLocation,
        message: 'Location saved successfully'
      });
    } catch (error) {
      console.error('Error creating saved location:', error);
      res.status(500).json({ 
        error: 'Failed to save location',
        message: 'Please try again later'
      });
    }
  });

  // Update a saved location
  app.put('/api/user/saved-locations/:locationId', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      const userId = req.user.id;
      const { locationId } = req.params;

      // Check if location exists and belongs to user
      const existingLocation = await storage.getUserSavedLocation(locationId);
      if (!existingLocation) {
        return res.status(404).json({
          error: 'Saved location not found'
        });
      }

      if (existingLocation.userId !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own saved locations'
        });
      }

      // Validate partial update data
      const partialSchema = insertUserSavedLocationSchema.omit({ userId: true }).partial();
      const validation = partialSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid location data',
          details: validation.error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      await storage.updateUserSavedLocation(locationId, validation.data);
      
      // Return updated location
      const updatedLocation = await storage.getUserSavedLocation(locationId);
      
      res.json({
        success: true,
        savedLocation: updatedLocation,
        message: 'Location updated successfully'
      });
    } catch (error) {
      console.error('Error updating saved location:', error);
      res.status(500).json({ 
        error: 'Failed to update location',
        message: 'Please try again later'
      });
    }
  });

  // Delete a saved location
  app.delete('/api/user/saved-locations/:locationId', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      const userId = req.user.id;
      const { locationId } = req.params;

      // Check if location exists and belongs to user
      const existingLocation = await storage.getUserSavedLocation(locationId);
      if (!existingLocation) {
        return res.status(404).json({
          error: 'Saved location not found'
        });
      }

      if (existingLocation.userId !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete your own saved locations'
        });
      }

      await storage.deleteUserSavedLocation(locationId);
      
      res.json({
        success: true,
        message: 'Location deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting saved location:', error);
      res.status(500).json({ 
        error: 'Failed to delete location',
        message: 'Please try again later'
      });
    }
  });

  // ===============================================
  // TEST DATA API - For adding test salons
  // ===============================================
  
  // Debug endpoint to check salon data
  app.get('/api/test/debug-salons', async (req, res) => {
    try {
      const allSalons = await storage.getAllSalons();
      res.json({ 
        count: allSalons.length,
        salons: allSalons.map(s => ({
          id: s.id,
          name: s.name,
          location: s.location,
          latitude: s.latitude,
          longitude: s.longitude,
          category: s.category
        }))
      });
    } catch (error) {
      console.error('Error getting salons:', error);
      res.status(500).json({ 
        error: 'Failed to get salons',
        message: error.message
      });
    }
  });
  
  // Update existing salons to Greater Noida coordinates
  app.post('/api/test/update-salons-location', async (req, res) => {
    try {
      const updates = [
        {
          id: '1dcdf672-8daa-4109-9194-a540b219f844', // AULNOVA Organization Salon
          location: 'Nirala Estate, Greater Noida West, Uttar Pradesh',
          address: 'Shop no 101, Nirala Estate, Greater Noida West',
          latitude: '28.5368704',
          longitude: '77.3918726'
        },
        {
          id: '91e3f720-b6b8-4530-8be2-ca18b58cec5e', // Gold Coast Hair Studio
          location: 'Nirala Estate, Tech Zone IV, Greater Noida West, Uttar Pradesh',
          address: 'Shop no 102, Nirala Estate, Tech Zone IV, Greater Noida West',
          latitude: '28.5360',
          longitude: '77.3920'
        },
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // Michigan Avenue Spa
          location: 'Sector 1, Greater Noida West, Uttar Pradesh',
          address: 'Shop no 103, Sector 1, Greater Noida West',
          latitude: '28.5370',
          longitude: '77.3930'
        },
        {
          id: 'd509a5b0-6155-41e7-94db-8a8dd6c6c905', // John Organization Salon
          location: 'Sector 2, Greater Noida West, Uttar Pradesh',
          address: 'Shop no 104, Sector 2, Greater Noida West',
          latitude: '28.5350',
          longitude: '77.3900'
        },
        {
          id: '400e5b87-1d2a-4c7b-bce7-da2f2047f897', // Michigan Avenue Spa (Chicago -> Greater Noida)
          location: 'Sector 3, Greater Noida West, Uttar Pradesh',
          address: 'Shop no 105, Sector 3, Greater Noida West',
          latitude: '28.5340',
          longitude: '77.3940'
        },
        {
          id: '8ec1a7ca-6305-4999-a0b4-24257f727d21', // Magnificent Mile Nails (Chicago -> Greater Noida)
          location: 'Sector 4, Greater Noida West, Uttar Pradesh',
          address: 'Shop no 106, Sector 4, Greater Noida West',
          latitude: '28.5880',
          longitude: '77.4390'
        }
      ];

      const updatedSalons = [];
      for (const update of updates) {
        try {
          await storage.updateSalon(update.id, {
            location: update.location,
            address: update.address,
            latitude: update.latitude,
            longitude: update.longitude
          });
          updatedSalons.push(update);
          console.log(`Updated salon location: ${update.id}`);
        } catch (error) {
          console.log(`Failed to update salon ${update.id}:`, error.message);
        }
      }

      // Add sample images for test salons
      const sampleImages = [
        {
          salonId: '1dcdf672-8daa-4109-9194-a540b219f844', // AULNOVA Organization Salon
          type: 'image',
          url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop&crop=center',
          altText: 'AULNOVA Organization Salon interior',
          isPrimary: 1
        },
        {
          salonId: '1dcdf672-8daa-4109-9194-a540b219f844', // AULNOVA Organization Salon - Additional images
          type: 'image',
          url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop&crop=center',
          altText: 'Hair styling station',
          isPrimary: 0
        },
        {
          salonId: '1dcdf672-8daa-4109-9194-a540b219f844', // AULNOVA Organization Salon - Additional images
          type: 'image',
          url: 'https://images.unsplash.com/photo-1522337360788-8b13de7a37e?w=400&h=300&fit=crop&crop=center',
          altText: 'Salon reception area',
          isPrimary: 0
        },
        {
          salonId: '1dcdf672-8daa-4109-9194-a540b219f844', // AULNOVA Organization Salon - Additional images
          type: 'image',
          url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop&crop=center',
          altText: 'Nail art station',
          isPrimary: 0
        },
        {
          salonId: '91e3f720-b6b8-4530-8be2-ca18b58cec5e', // Gold Coast Hair Studio
          type: 'image',
          url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop&crop=center',
          altText: 'Gold Coast Hair Studio interior',
          isPrimary: 1
        },
        {
          salonId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // Michigan Avenue Spa
          type: 'image',
          url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop&crop=center',
          altText: 'Michigan Avenue Spa interior',
          isPrimary: 1
        },
        {
          salonId: 'd509a5b0-6155-41e7-94db-8a8dd6c6c905', // John Organization Salon
          type: 'image',
          url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop&crop=center',
          altText: 'John Organization Salon interior',
          isPrimary: 1
        },
        {
          salonId: '400e5b87-1d2a-4c7b-bce7-da2f2047f897', // Michigan Avenue Spa (Chicago -> Greater Noida)
          type: 'image',
          url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center',
          altText: 'Michigan Avenue Spa interior',
          isPrimary: 1
        },
        {
          salonId: '8ec1a7ca-6305-4999-a0b4-24257f727d21', // Magnificent Mile Nails
          type: 'image',
          url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop&crop=center',
          altText: 'Magnificent Mile Nails interior',
          isPrimary: 1
        }
      ];

      // Check if images already exist, if not create them
      for (const image of sampleImages) {
        try {
          const existingImages = await storage.getMediaAssetsBySalonId(image.salonId);
          if (existingImages.length === 0) {
            await storage.createMediaAsset(image);
            console.log(`Added image for salon: ${image.salonId}`);
          }
        } catch (error) {
          console.log(`Failed to add image for salon ${image.salonId}:`, error.message);
        }
      }

      res.json({ 
        message: 'Salon locations and images updated successfully',
        count: updatedSalons.length,
        updates: updatedSalons
      });
    } catch (error) {
      console.error('Error updating salon locations:', error);
      res.status(500).json({ 
        error: 'Failed to update salon locations',
        message: error.message
      });
    }
  });

  // Test endpoint to create availability patterns and time slots
  app.post('/api/test/create-availability-patterns', async (req, res) => {
    try {
      const salonIds = [
        '1dcdf672-8daa-4109-9194-a540b219f844', // AULNOVA Organization Salon
        '91e3f720-b6b8-4530-8be2-ca18b58cec5e', // Gold Coast Hair Studio
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // Michigan Avenue Spa
        'd509a5b0-6155-41e7-94db-8a8dd6c6c905', // John Organization Salon
        '400e5b87-1d2a-4c7b-bce7-da2f2047f897', // Michigan Avenue Spa (Chicago -> Greater Noida)
        '8ec1a7ca-6305-4999-a0b4-24257f727d21'  // Magnificent Mile Nails
      ];

      const createdPatterns = [];
      
      for (const salonId of salonIds) {
        // Get staff for this salon
        const staff = await storage.getStaffBySalonId(salonId);
        
        // Create availability patterns for each day of the week
        const patterns = [
          { dayOfWeek: 1, patternName: 'Monday Hours', startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 2, patternName: 'Tuesday Hours', startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 3, patternName: 'Wednesday Hours', startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 4, patternName: 'Thursday Hours', startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 5, patternName: 'Friday Hours', startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 6, patternName: 'Saturday Hours', startTime: '10:00', endTime: '16:00' },
          { dayOfWeek: 0, patternName: 'Sunday Hours', startTime: '10:00', endTime: '16:00' }
        ];
        
        for (const pattern of patterns) {
          // Create pattern for salon (general availability)
          const salonPattern = {
            salonId,
            staffId: null, // General salon availability
            patternName: pattern.patternName,
            dayOfWeek: pattern.dayOfWeek,
            startTime: pattern.startTime,
            endTime: pattern.endTime,
            slotDurationMinutes: 30,
            isActive: 1
          };
          
          try {
            const createdPattern = await storage.createAvailabilityPattern(salonPattern);
            createdPatterns.push(createdPattern);
            
            // Generate time slots for next 90 days
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 90);
            
            await storage.generateTimeSlotsFromPattern(createdPattern.id, startDate, endDate);
          } catch (error) {
            console.log(`Failed to create pattern for salon ${salonId}:`, error.message);
          }
        }
        
        // Create staff-specific patterns if staff exist
        for (const staffMember of staff) {
          for (const pattern of patterns) {
            const staffPattern = {
              salonId,
              staffId: staffMember.id,
              patternName: `${staffMember.name} - ${pattern.patternName}`,
              dayOfWeek: pattern.dayOfWeek,
              startTime: pattern.startTime,
              endTime: pattern.endTime,
              slotDurationMinutes: 30,
              isActive: 1
            };
            
            try {
              const createdPattern = await storage.createAvailabilityPattern(staffPattern);
              createdPatterns.push(createdPattern);
              
              // Generate time slots for next 90 days
              const startDate = new Date();
              const endDate = new Date();
              endDate.setDate(endDate.getDate() + 90);
              
              await storage.generateTimeSlotsFromPattern(createdPattern.id, startDate, endDate);
            } catch (error) {
              console.log(`Failed to create staff pattern for ${staffMember.name}:`, error.message);
            }
          }
        }
      }

      res.json({ 
        message: 'Availability patterns and time slots created successfully',
        patternsCreated: createdPatterns.length,
        patterns: createdPatterns.slice(0, 10) // Show first 10 patterns as example
      });
    } catch (error) {
      console.error('Error creating availability patterns:', error);
      res.status(500).json({ 
        error: 'Failed to create availability patterns',
        message: error.message
      });
    }
  });

  // Create sample time slots for testing
  app.post('/api/test/create-time-slots', async (req, res) => {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const salonIds = [
        '1dcdf672-8daa-4109-9194-a540b219f844', // AULNOVA Organization Salon
        '91e3f720-b6b8-4530-8be2-ca18b58cec5e', // Gold Coast Hair Studio
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // Michigan Avenue Spa
        'd509a5b0-6155-41e7-94db-8a8dd6c6c905', // John Organization Salon
        '400e5b87-1d2a-4c7b-bce7-da2f2047f897', // Michigan Avenue Spa (Chicago -> Greater Noida)
        '8ec1a7ca-6305-4999-a0b4-24257f727d21'  // Magnificent Mile Nails
      ];

      const createdSlots = [];
      
      for (const salonId of salonIds) {
        // Create time slots for today and tomorrow
        const dates = [today, tomorrow];
        
        for (const date of dates) {
          // Create morning slots (9 AM - 12 PM)
          for (let hour = 9; hour < 12; hour++) {
            const startTime = new Date(date);
            startTime.setHours(hour, 0, 0, 0);
            const endTime = new Date(startTime);
            endTime.setHours(hour + 1, 0, 0, 0);
            
            const timeSlot = {
              salonId,
              startDateTime: startTime.toISOString(),
              endDateTime: endTime.toISOString(),
              isBooked: 0,
              isBlocked: 0
            };
            
            try {
              const createdSlot = await storage.createTimeSlot(timeSlot);
              createdSlots.push(createdSlot);
            } catch (error) {
              console.log(`Failed to create time slot for salon ${salonId}:`, error.message);
            }
          }
          
          // Create afternoon slots (2 PM - 6 PM)
          for (let hour = 14; hour < 18; hour++) {
            const startTime = new Date(date);
            startTime.setHours(hour, 0, 0, 0);
            const endTime = new Date(startTime);
            endTime.setHours(hour + 1, 0, 0, 0);
            
            const timeSlot = {
              salonId,
              startDateTime: startTime.toISOString(),
              endDateTime: endTime.toISOString(),
              isBooked: 0,
              isBlocked: 0
            };
            
            try {
              const createdSlot = await storage.createTimeSlot(timeSlot);
              createdSlots.push(createdSlot);
            } catch (error) {
              console.log(`Failed to create time slot for salon ${salonId}:`, error.message);
            }
          }
          
          // Create evening slots (7 PM - 9 PM)
          for (let hour = 19; hour < 21; hour++) {
            const startTime = new Date(date);
            startTime.setHours(hour, 0, 0, 0);
            const endTime = new Date(startTime);
            endTime.setHours(hour + 1, 0, 0, 0);
            
            const timeSlot = {
              salonId,
              startDateTime: startTime.toISOString(),
              endDateTime: endTime.toISOString(),
              isBooked: 0,
              isBlocked: 0
            };
            
            try {
              const createdSlot = await storage.createTimeSlot(timeSlot);
              createdSlots.push(createdSlot);
            } catch (error) {
              console.log(`Failed to create time slot for salon ${salonId}:`, error.message);
            }
          }
        }
      }

      res.json({ 
        message: 'Time slots created successfully',
        count: createdSlots.length,
        slots: createdSlots.slice(0, 10) // Show first 10 slots as example
      });
    } catch (error) {
      console.error('Error creating time slots:', error);
      res.status(500).json({ 
        error: 'Failed to create time slots',
        message: error.message
      });
    }
  });

  // ===============================================
  // LOCATION SEARCH API (Public) - For LocationPickerModal
  // ===============================================

  // Location search endpoint for the location picker modal
  // Redis client for caching
  let redisClient: any = null;
  const CACHE_DURATION = 5 * 60; // 5 minutes in seconds
  
  // Initialize Redis client
  try {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      redisClient = createClient({ url: redisUrl });
      redisClient.on('error', (err: any) => console.error('Redis Client Error:', err));
      redisClient.on('connect', () => console.log('✅ Redis connected successfully'));
      redisClient.connect();
    } else {
      console.log('⚠️  REDIS_URL not found. Location search will use in-memory cache only.');
      console.log('   Add REDIS_URL to your .env file for better performance.');
    }
  } catch (error) {
    console.error('Redis connection error:', error);
  }
  
  // Fallback in-memory cache
  const locationSearchCache = new Map<string, { results: any[], timestamp: number }>();
  
  // Check Google Places API configuration
  const googlePlacesKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!googlePlacesKey) {
    console.log('⚠️  GOOGLE_PLACES_API_KEY not found. Add it to your .env file for better location search.');
    console.log('   Get your API key at: https://console.cloud.google.com/');
  } else {
    console.log('✅ Google Places API configured - location search will use Google Places API');
  }

  app.get('/api/locations/search', communicationRateLimits.analytics, async (req, res) => {
    // Prevent HTTP caching - always get fresh results
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      const query = req.query.q as string;
      
      if (!query || query.length < 2) {
        return res.json({ results: [] });
      }

      // Check cache first (Redis or in-memory)
      const cacheKey = `location_search:${query.toLowerCase().trim()}`;
      let cached: any = null;
      
      if (redisClient) {
        try {
          const cachedData = await redisClient.get(cacheKey);
          if (cachedData) {
            cached = JSON.parse(cachedData);
            console.log(`🚀 Redis cache hit for: "${query}"`);
            return res.json({ results: cached.results });
          }
        } catch (error) {
          console.error('Redis cache read error:', error);
        }
      } else {
        // Fallback to in-memory cache
        const inMemoryCached = locationSearchCache.get(cacheKey);
        if (inMemoryCached && (Date.now() - inMemoryCached.timestamp) < (CACHE_DURATION * 1000)) {
          console.log(`🚀 In-memory cache hit for: "${query}"`);
          return res.json({ results: inMemoryCached.results });
        }
      }

      // Use the existing places autocomplete endpoint logic
      const queryParams = {
        q: query,
        lat: req.query.lat as string,
        lng: req.query.lng as string,
        countrycode: req.query.countrycode as string
      };

      // Remove undefined values
      Object.keys(queryParams).forEach(key => {
        const value = (queryParams as any)[key];
        if (value === undefined) {
          delete (queryParams as any)[key];
        }
      });

      const validation = placesAutocompleteSchema.safeParse(queryParams);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const validatedParams = validation.data;
      let suggestions: any[] = [];

      // First, check our comprehensive Delhi NCR database for instant results
      const searchQuery = validatedParams.q.toLowerCase().trim();
      const delhiNCRLocations = [
        // Delhi - Central & South
        { name: 'Connaught Place', area: 'New Delhi', coords: { lat: 28.6315, lng: 77.2167 }, state: 'Delhi', country: 'India', priority: 1 },
        { name: 'Karol Bagh', area: 'New Delhi', coords: { lat: 28.6517, lng: 77.1909 }, state: 'Delhi', country: 'India', priority: 1 },
        { name: 'Lajpat Nagar', area: 'New Delhi', coords: { lat: 28.5679, lng: 77.2431 }, state: 'Delhi', country: 'India', priority: 1 },
        { name: 'Rajouri Garden', area: 'New Delhi', coords: { lat: 28.6408, lng: 77.1214 }, state: 'Delhi', country: 'India', priority: 1 },
        { name: 'Pitampura', area: 'New Delhi', coords: { lat: 28.7000, lng: 77.1333 }, state: 'Delhi', country: 'India', priority: 1 },
        { name: 'Rohini', area: 'New Delhi', coords: { lat: 28.7433, lng: 77.1028 }, state: 'Delhi', country: 'India', priority: 1 },
        { name: 'Dwarka', area: 'New Delhi', coords: { lat: 28.5921, lng: 77.0465 }, state: 'Delhi', country: 'India', priority: 1 },
        { name: 'Vasant Kunj', area: 'New Delhi', coords: { lat: 28.5425, lng: 77.1528 }, state: 'Delhi', country: 'India', priority: 1 },
        { name: 'Saket', area: 'New Delhi', coords: { lat: 28.5245, lng: 77.2069 }, state: 'Delhi', country: 'India', priority: 1 },
        { name: 'Greater Kailash', area: 'New Delhi', coords: { lat: 28.5480, lng: 77.2400 }, state: 'Delhi', country: 'India', priority: 1 },
        
        // Gurgaon/Gurugram
        { name: 'Cyber City', area: 'Gurugram', coords: { lat: 28.4960, lng: 77.0900 }, state: 'Haryana', country: 'India', priority: 1 },
        { name: 'Sector 29', area: 'Gurugram', coords: { lat: 28.4500, lng: 77.0300 }, state: 'Haryana', country: 'India', priority: 1 },
        { name: 'Sector 14', area: 'Gurugram', coords: { lat: 28.4600, lng: 77.0400 }, state: 'Haryana', country: 'India', priority: 1 },
        { name: 'Sector 15', area: 'Gurugram', coords: { lat: 28.4700, lng: 77.0500 }, state: 'Haryana', country: 'India', priority: 1 },
        { name: 'Sector 18', area: 'Gurugram', coords: { lat: 28.4800, lng: 77.0600 }, state: 'Haryana', country: 'India', priority: 1 },
        { name: 'Sector 25', area: 'Gurugram', coords: { lat: 28.4900, lng: 77.0700 }, state: 'Haryana', country: 'India', priority: 1 },
        { name: 'Sector 26', area: 'Gurugram', coords: { lat: 28.5000, lng: 77.0800 }, state: 'Haryana', country: 'India', priority: 1 },
        { name: 'Sector 27', area: 'Gurugram', coords: { lat: 28.5100, lng: 77.0900 }, state: 'Haryana', country: 'India', priority: 1 },
        { name: 'Sector 28', area: 'Gurugram', coords: { lat: 28.5200, lng: 77.1000 }, state: 'Haryana', country: 'India', priority: 1 },
        { name: 'Sector 30', area: 'Gurugram', coords: { lat: 28.5300, lng: 77.1100 }, state: 'Haryana', country: 'India', priority: 1 },
        
        // Noida
        { name: 'Sector 18', area: 'Noida', coords: { lat: 28.5900, lng: 77.3200 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Sector 62', area: 'Noida', coords: { lat: 28.6000, lng: 77.3300 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Sector 63', area: 'Noida', coords: { lat: 28.6100, lng: 77.3400 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Sector 64', area: 'Noida', coords: { lat: 28.6200, lng: 77.3500 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Sector 65', area: 'Noida', coords: { lat: 28.6300, lng: 77.3600 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Sector 66', area: 'Noida', coords: { lat: 28.6400, lng: 77.3700 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Sector 67', area: 'Noida', coords: { lat: 28.6500, lng: 77.3800 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Sector 68', area: 'Noida', coords: { lat: 28.6600, lng: 77.3900 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Sector 69', area: 'Noida', coords: { lat: 28.6700, lng: 77.4000 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Sector 70', area: 'Noida', coords: { lat: 28.6800, lng: 77.4100 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        
          // Greater Noida - Nirala Estate
          { name: 'Nirala Estate', area: 'Tech Zone IV, Patwari, Greater Noida', coords: { lat: 28.5355, lng: 77.3910 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Nirala Estate Phase 1', area: 'Greater Noida West Road, Tech Zone IV', coords: { lat: 28.5360, lng: 77.3920 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Nirala Estate Phase 3', area: 'Tech Zone IV, Patwari', coords: { lat: 28.5350, lng: 77.3900 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Nirala Estate Main Gate', area: 'Patwari, Greater Noida', coords: { lat: 28.5365, lng: 77.3915 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          
          // Greater Noida - Nirala Aspire (matching Fresha.com results)
          { name: 'Nirala Aspire', area: 'Sector 16, Panchsheel Greens 2, Greater Noida', coords: { lat: 28.5355, lng: 77.3910 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Nirala Aspire', area: 'Greater Noida West, Panchsheel Greens 2, Ghaziabad', coords: { lat: 28.5360, lng: 77.3920 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'NIRALA ASPIRE', area: 'Panchsheel Greens 2, Greater Noida', coords: { lat: 28.5350, lng: 77.3900 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Nirala Aspire Tower A-6', area: 'Panchsheel Greens 2, Ithaira, Ghaziabad', coords: { lat: 28.5364, lng: 77.3924 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Nirala Aspire Tower D-5', area: 'Nirala Aspire, Sector 16, Panchsheel Greens 2, Ithaira', coords: { lat: 28.5366, lng: 77.3926 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Nirala Aspire Tower B-3', area: 'Panchsheel Greens 2, Greater Noida', coords: { lat: 28.5368, lng: 77.3928 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Nirala Aspire Tower C-7', area: 'Sector 16, Panchsheel Greens 2, Greater Noida', coords: { lat: 28.5370, lng: 77.3930 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Sector Alpha 1', area: 'Greater Noida', coords: { lat: 28.5400, lng: 77.4000 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Sector Alpha 2', area: 'Greater Noida', coords: { lat: 28.5500, lng: 77.4100 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Sector Beta 1', area: 'Greater Noida', coords: { lat: 28.5600, lng: 77.4200 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Sector Beta 2', area: 'Greater Noida', coords: { lat: 28.5700, lng: 77.4300 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Sector Gamma 1', area: 'Greater Noida', coords: { lat: 28.5800, lng: 77.4400 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Sector Gamma 2', area: 'Greater Noida', coords: { lat: 28.5900, lng: 77.4500 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        
        // Faridabad
        { name: 'Sector 15', area: 'Faridabad', coords: { lat: 28.4000, lng: 77.3000 }, state: 'Haryana', country: 'India', priority: 1 },
        { name: 'Sector 16', area: 'Faridabad', coords: { lat: 28.4100, lng: 77.3100 }, state: 'Haryana', country: 'India', priority: 1 },
        { name: 'Sector 17', area: 'Faridabad', coords: { lat: 28.4200, lng: 77.3200 }, state: 'Haryana', country: 'India', priority: 1 },
        { name: 'Sector 18', area: 'Faridabad', coords: { lat: 28.4300, lng: 77.3300 }, state: 'Haryana', country: 'India', priority: 1 },
        { name: 'Sector 19', area: 'Faridabad', coords: { lat: 28.4400, lng: 77.3400 }, state: 'Haryana', country: 'India', priority: 1 },
        { name: 'Sector 20', area: 'Faridabad', coords: { lat: 28.4500, lng: 77.3500 }, state: 'Haryana', country: 'India', priority: 1 },
        
        // Ghaziabad
        { name: 'Vaishali', area: 'Ghaziabad', coords: { lat: 28.6500, lng: 77.3500 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Indirapuram', area: 'Ghaziabad', coords: { lat: 28.6400, lng: 77.3600 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Crossings Republik', area: 'Ghaziabad', coords: { lat: 28.6300, lng: 77.3700 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Raj Nagar', area: 'Ghaziabad', coords: { lat: 28.6200, lng: 77.3800 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        { name: 'Kaushambi', area: 'Ghaziabad', coords: { lat: 28.6100, lng: 77.3900 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
        
        // Popular landmarks and malls
        { name: 'Trident Embassy', area: 'Gurugram', coords: { lat: 28.4960, lng: 77.0900 }, state: 'Haryana', country: 'India', priority: 2 },
        { name: 'Select City Walk', area: 'Saket, New Delhi', coords: { lat: 28.5245, lng: 77.2069 }, state: 'Delhi', country: 'India', priority: 2 },
        { name: 'DLF Cyber Hub', area: 'Gurugram', coords: { lat: 28.4960, lng: 77.0900 }, state: 'Haryana', country: 'India', priority: 2 },
        { name: 'Ambience Mall', area: 'Gurugram', coords: { lat: 28.5000, lng: 77.1000 }, state: 'Haryana', country: 'India', priority: 2 },
        { name: 'Pacific Mall', area: 'Tagore Garden, New Delhi', coords: { lat: 28.6408, lng: 77.1214 }, state: 'Delhi', country: 'India', priority: 2 },
        { name: 'Metro Walk', area: 'Rohini, New Delhi', coords: { lat: 28.7433, lng: 77.1028 }, state: 'Delhi', country: 'India', priority: 2 },
        { name: 'Cross River Mall', area: 'Sector 18, Noida', coords: { lat: 28.5900, lng: 77.3200 }, state: 'Uttar Pradesh', country: 'India', priority: 2 },
        { name: 'Great India Place', area: 'Sector 18, Noida', coords: { lat: 28.5900, lng: 77.3200 }, state: 'Uttar Pradesh', country: 'India', priority: 2 },
        { name: 'Logix City Centre', area: 'Sector 32, Noida', coords: { lat: 28.6000, lng: 77.3300 }, state: 'Uttar Pradesh', country: 'India', priority: 2 },
        { name: 'DLF Mall of India', area: 'Sector 18, Noida', coords: { lat: 28.5682, lng: 77.3250 }, state: 'Uttar Pradesh', country: 'India', priority: 2 }
      ];

      // Smart search algorithm for Delhi NCR with fuzzy matching
      const searchResults = delhiNCRLocations.filter(loc => {
        const searchTerms = searchQuery.split(' ').filter(term => term.length > 0);
        const fullText = `${loc.name} ${loc.area} ${loc.state} ${loc.country}`.toLowerCase();
        
        // Check if all search terms match (with fuzzy matching for common variations)
        return searchTerms.every(term => {
          const lowerTerm = term.toLowerCase();
          
          // Direct match
          if (fullText.includes(lowerTerm)) return true;
          
          // Fuzzy matching for common variations
          if (lowerTerm === 'aspir' && fullText.includes('aspire')) return true;
          if (lowerTerm === 'aspire' && fullText.includes('aspir')) return true;
          if (lowerTerm === 'sec' && fullText.includes('sector')) return true;
          if (lowerTerm === 'sector' && fullText.includes('sec')) return true;
          if (lowerTerm === 'gr' && fullText.includes('greater')) return true;
          if (lowerTerm === 'greater' && fullText.includes('gr')) return true;
          if (lowerTerm === 'noida' && fullText.includes('noida')) return true;
          if (lowerTerm === 'delhi' && fullText.includes('delhi')) return true;
          
          return false;
        });
      });

      // Sort by priority and relevance
      suggestions = searchResults
        .sort((a, b) => {
          // First sort by priority (1 = high, 2 = medium)
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          // Then by exact name match
          const aExactMatch = a.name.toLowerCase().includes(searchQuery);
          const bExactMatch = b.name.toLowerCase().includes(searchQuery);
          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;
          return 0;
        })
        .slice(0, parseInt(queryParams.limit) || 10)
        .map((loc, index) => ({
          id: `delhi-ncr-${index}`,
          title: `${loc.name}, ${loc.area}`,
          subtitle: `${loc.state}, ${loc.country}`,
          address: `${loc.name}, ${loc.area}, ${loc.state}, ${loc.country}`,
          coords: loc.coords
        }));

      // If we have good results from our database, return them immediately
      if (suggestions.length > 0) {
        console.log(`✅ Found ${suggestions.length} Delhi NCR locations for "${searchQuery}"`);
        // Cache the results (Redis or in-memory)
        const cacheData = {
          results: suggestions,
          timestamp: Date.now()
        };
        
        if (redisClient) {
          try {
            await redisClient.setEx(cacheKey, CACHE_DURATION, JSON.stringify(cacheData));
            console.log(`💾 Cached in Redis: "${searchQuery}"`);
          } catch (error) {
            console.error('Redis cache write error:', error);
            // Fallback to in-memory cache
            locationSearchCache.set(cacheKey, cacheData);
          }
        } else {
          // Fallback to in-memory cache
          locationSearchCache.set(cacheKey, cacheData);
          console.log(`💾 Cached in memory: "${searchQuery}"`);
        }
        return res.json({ results: suggestions });
      }

      // Use Google Places API for best results
      try {
        const googlePlacesKey = process.env.GOOGLE_PLACES_API_KEY;
        if (!googlePlacesKey) {
          console.log('Google Places API key not found, using fallback locations');
          throw new Error('Google Places API key not configured');
        }

        // Google Places Autocomplete API
        const googleUrl = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
        const googleParams = new URLSearchParams({
          input: validatedParams.q,
          key: googlePlacesKey,
          types: 'establishment|geocode',
          language: 'en',
          components: 'country:in', // Focus on India
          location: '28.6139,77.2090', // Delhi coordinates for ranking
          radius: '50000' // 50km radius around Delhi
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const googleResponse = await fetch(`${googleUrl}?${googleParams}`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SalonHub/1.0'
          }
        });
        
        clearTimeout(timeoutId);

        if (googleResponse.ok) {
          const data = await googleResponse.json();
          
          if (data.status === 'OK' && data.predictions) {
            // Get detailed place information for each prediction
            const placeDetailsPromises = data.predictions.slice(0, 8).map(async (prediction: any) => {
              try {
                const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
                const detailsParams = new URLSearchParams({
                  place_id: prediction.place_id,
                  key: googlePlacesKey,
                  fields: 'formatted_address,geometry,name,address_components'
                });

                const detailsResponse = await fetch(`${detailsUrl}?${detailsParams}`);
                const detailsData = await detailsResponse.json();
                
                if (detailsData.status === 'OK' && detailsData.result) {
                  const place = detailsData.result;
                  const coords = place.geometry?.location;
                  
                  // Extract city, state, country from address components
                  const components = place.address_components || [];
                  const city = components.find((c: any) => c.types.includes('locality'))?.long_name || '';
                  const state = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name || '';
                  const country = components.find((c: any) => c.types.includes('country'))?.long_name || '';
                  
                  return {
                    id: prediction.place_id,
                    title: prediction.structured_formatting?.main_text || place.name || prediction.description,
                    subtitle: prediction.structured_formatting?.secondary_text || [city, state, country].filter(Boolean).join(', '),
                    address: place.formatted_address || prediction.description,
                    coords: coords ? {
                      lat: coords.lat,
                      lng: coords.lng
                    } : null
                  };
                }
              } catch (error) {
                console.error('Error fetching place details:', error);
              }
              
              // Fallback to basic prediction data
              return {
                id: prediction.place_id,
                title: prediction.structured_formatting?.main_text || prediction.description.split(',')[0],
                subtitle: prediction.structured_formatting?.secondary_text || prediction.description,
                address: prediction.description,
                coords: null
              };
            });

            suggestions = (await Promise.all(placeDetailsPromises)).filter(s => s.coords);
            console.log(`✅ Google Places found ${suggestions.length} results for "${validatedParams.q}"`);
            
            // Cache the Google Places results
            const cacheData = {
              results: suggestions,
              timestamp: Date.now()
            };
            
            if (redisClient) {
              try {
                await redisClient.setEx(cacheKey, CACHE_DURATION, JSON.stringify(cacheData));
                console.log(`💾 Cached Google Places in Redis: "${validatedParams.q}"`);
              } catch (error) {
                console.error('Redis cache write error:', error);
                locationSearchCache.set(cacheKey, cacheData);
              }
            } else {
              locationSearchCache.set(cacheKey, cacheData);
              console.log(`💾 Cached Google Places in memory: "${validatedParams.q}"`);
            }
          } else {
            console.log(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
            throw new Error(`Google Places API error: ${data.status}`);
          }
        } else {
          throw new Error(`Google Places API HTTP error: ${googleResponse.status}`);
        }
        
      } catch (googleError) {
        console.error('Google Places search error:', googleError);
        
        // Fallback: Comprehensive Delhi NCR locations database
        const fallbackQuery = validatedParams.q.toLowerCase();
        const delhiNCRLocations = [
          // Delhi - Central & South
          { name: 'Connaught Place', area: 'New Delhi', coords: { lat: 28.6315, lng: 77.2167 }, state: 'Delhi', country: 'India', priority: 1 },
          { name: 'Karol Bagh', area: 'New Delhi', coords: { lat: 28.6517, lng: 77.1909 }, state: 'Delhi', country: 'India', priority: 1 },
          { name: 'Lajpat Nagar', area: 'New Delhi', coords: { lat: 28.5679, lng: 77.2431 }, state: 'Delhi', country: 'India', priority: 1 },
          { name: 'Rajouri Garden', area: 'New Delhi', coords: { lat: 28.6408, lng: 77.1214 }, state: 'Delhi', country: 'India', priority: 1 },
          { name: 'Pitampura', area: 'New Delhi', coords: { lat: 28.7000, lng: 77.1333 }, state: 'Delhi', country: 'India', priority: 1 },
          { name: 'Rohini', area: 'New Delhi', coords: { lat: 28.7433, lng: 77.1028 }, state: 'Delhi', country: 'India', priority: 1 },
          { name: 'Dwarka', area: 'New Delhi', coords: { lat: 28.5921, lng: 77.0465 }, state: 'Delhi', country: 'India', priority: 1 },
          { name: 'Vasant Kunj', area: 'New Delhi', coords: { lat: 28.5425, lng: 77.1528 }, state: 'Delhi', country: 'India', priority: 1 },
          { name: 'Saket', area: 'New Delhi', coords: { lat: 28.5245, lng: 77.2069 }, state: 'Delhi', country: 'India', priority: 1 },
          { name: 'Greater Kailash', area: 'New Delhi', coords: { lat: 28.5480, lng: 77.2400 }, state: 'Delhi', country: 'India', priority: 1 },
          
          // Gurgaon/Gurugram
          { name: 'Cyber City', area: 'Gurugram', coords: { lat: 28.4960, lng: 77.0900 }, state: 'Haryana', country: 'India', priority: 1 },
          { name: 'Sector 29', area: 'Gurugram', coords: { lat: 28.4500, lng: 77.0300 }, state: 'Haryana', country: 'India', priority: 1 },
          { name: 'Sector 14', area: 'Gurugram', coords: { lat: 28.4600, lng: 77.0400 }, state: 'Haryana', country: 'India', priority: 1 },
          { name: 'Sector 15', area: 'Gurugram', coords: { lat: 28.4700, lng: 77.0500 }, state: 'Haryana', country: 'India', priority: 1 },
          { name: 'Sector 18', area: 'Gurugram', coords: { lat: 28.4800, lng: 77.0600 }, state: 'Haryana', country: 'India', priority: 1 },
          { name: 'Sector 25', area: 'Gurugram', coords: { lat: 28.4900, lng: 77.0700 }, state: 'Haryana', country: 'India', priority: 1 },
          { name: 'Sector 26', area: 'Gurugram', coords: { lat: 28.5000, lng: 77.0800 }, state: 'Haryana', country: 'India', priority: 1 },
          { name: 'Sector 27', area: 'Gurugram', coords: { lat: 28.5100, lng: 77.0900 }, state: 'Haryana', country: 'India', priority: 1 },
          { name: 'Sector 28', area: 'Gurugram', coords: { lat: 28.5200, lng: 77.1000 }, state: 'Haryana', country: 'India', priority: 1 },
          { name: 'Sector 30', area: 'Gurugram', coords: { lat: 28.5300, lng: 77.1100 }, state: 'Haryana', country: 'India', priority: 1 },
          
          // Noida
          { name: 'Sector 18', area: 'Noida', coords: { lat: 28.5900, lng: 77.3200 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Sector 62', area: 'Noida', coords: { lat: 28.6000, lng: 77.3300 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Sector 63', area: 'Noida', coords: { lat: 28.6100, lng: 77.3400 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Sector 64', area: 'Noida', coords: { lat: 28.6200, lng: 77.3500 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Sector 65', area: 'Noida', coords: { lat: 28.6300, lng: 77.3600 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Sector 66', area: 'Noida', coords: { lat: 28.6400, lng: 77.3700 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Sector 67', area: 'Noida', coords: { lat: 28.6500, lng: 77.3800 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Sector 68', area: 'Noida', coords: { lat: 28.6600, lng: 77.3900 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Sector 69', area: 'Noida', coords: { lat: 28.6700, lng: 77.4000 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Sector 70', area: 'Noida', coords: { lat: 28.6800, lng: 77.4100 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          
          // Greater Noida - Nirala Estate
          { name: 'Nirala Estate', area: 'Tech Zone IV, Patwari, Greater Noida', coords: { lat: 28.5355, lng: 77.3910 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Nirala Estate Phase 1', area: 'Greater Noida West Road, Tech Zone IV', coords: { lat: 28.5360, lng: 77.3920 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Nirala Estate Phase 3', area: 'Tech Zone IV, Patwari', coords: { lat: 28.5350, lng: 77.3900 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Nirala Estate Main Gate', area: 'Patwari, Greater Noida', coords: { lat: 28.5365, lng: 77.3915 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          
          // Greater Noida - Nirala Aspire (matching Fresha.com results)
          { name: 'Nirala Aspire', area: 'Sector 16, Panchsheel Greens 2, Greater Noida', coords: { lat: 28.5355, lng: 77.3910 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Nirala Aspire', area: 'Greater Noida West, Panchsheel Greens 2, Ghaziabad', coords: { lat: 28.5360, lng: 77.3920 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'NIRALA ASPIRE', area: 'Panchsheel Greens 2, Greater Noida', coords: { lat: 28.5350, lng: 77.3900 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Nirala Aspire Tower A-6', area: 'Panchsheel Greens 2, Ithaira, Ghaziabad', coords: { lat: 28.5364, lng: 77.3924 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Nirala Aspire Tower D-5', area: 'Nirala Aspire, Sector 16, Panchsheel Greens 2, Ithaira', coords: { lat: 28.5366, lng: 77.3926 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Nirala Aspire Tower B-3', area: 'Panchsheel Greens 2, Greater Noida', coords: { lat: 28.5368, lng: 77.3928 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Nirala Aspire Tower C-7', area: 'Sector 16, Panchsheel Greens 2, Greater Noida', coords: { lat: 28.5370, lng: 77.3930 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Sector Alpha 1', area: 'Greater Noida', coords: { lat: 28.5400, lng: 77.4000 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Sector Alpha 2', area: 'Greater Noida', coords: { lat: 28.5500, lng: 77.4100 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Sector Beta 1', area: 'Greater Noida', coords: { lat: 28.5600, lng: 77.4200 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Sector Beta 2', area: 'Greater Noida', coords: { lat: 28.5700, lng: 77.4300 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Sector Gamma 1', area: 'Greater Noida', coords: { lat: 28.5800, lng: 77.4400 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Sector Gamma 2', area: 'Greater Noida', coords: { lat: 28.5900, lng: 77.4500 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          
          // Faridabad
          { name: 'Sector 15', area: 'Faridabad', coords: { lat: 28.4000, lng: 77.3000 }, state: 'Haryana', country: 'India', priority: 1 },
          { name: 'Sector 16', area: 'Faridabad', coords: { lat: 28.4100, lng: 77.3100 }, state: 'Haryana', country: 'India', priority: 1 },
          { name: 'Sector 17', area: 'Faridabad', coords: { lat: 28.4200, lng: 77.3200 }, state: 'Haryana', country: 'India', priority: 1 },
          { name: 'Sector 18', area: 'Faridabad', coords: { lat: 28.4300, lng: 77.3300 }, state: 'Haryana', country: 'India', priority: 1 },
          { name: 'Sector 19', area: 'Faridabad', coords: { lat: 28.4400, lng: 77.3400 }, state: 'Haryana', country: 'India', priority: 1 },
          { name: 'Sector 20', area: 'Faridabad', coords: { lat: 28.4500, lng: 77.3500 }, state: 'Haryana', country: 'India', priority: 1 },
          
          // Ghaziabad
          { name: 'Vaishali', area: 'Ghaziabad', coords: { lat: 28.6500, lng: 77.3500 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Indirapuram', area: 'Ghaziabad', coords: { lat: 28.6400, lng: 77.3600 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Crossings Republik', area: 'Ghaziabad', coords: { lat: 28.6300, lng: 77.3700 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Raj Nagar', area: 'Ghaziabad', coords: { lat: 28.6200, lng: 77.3800 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          { name: 'Kaushambi', area: 'Ghaziabad', coords: { lat: 28.6100, lng: 77.3900 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
          
          // Popular landmarks and malls
          { name: 'Trident Embassy', area: 'Gurugram', coords: { lat: 28.4960, lng: 77.0900 }, state: 'Haryana', country: 'India', priority: 2 },
          { name: 'Select City Walk', area: 'Saket, New Delhi', coords: { lat: 28.5245, lng: 77.2069 }, state: 'Delhi', country: 'India', priority: 2 },
          { name: 'DLF Cyber Hub', area: 'Gurugram', coords: { lat: 28.4960, lng: 77.0900 }, state: 'Haryana', country: 'India', priority: 2 },
          { name: 'Ambience Mall', area: 'Gurugram', coords: { lat: 28.5000, lng: 77.1000 }, state: 'Haryana', country: 'India', priority: 2 },
          { name: 'Pacific Mall', area: 'Tagore Garden, New Delhi', coords: { lat: 28.6408, lng: 77.1214 }, state: 'Delhi', country: 'India', priority: 2 },
          { name: 'Metro Walk', area: 'Rohini, New Delhi', coords: { lat: 28.7433, lng: 77.1028 }, state: 'Delhi', country: 'India', priority: 2 },
          { name: 'Cross River Mall', area: 'Sector 18, Noida', coords: { lat: 28.5900, lng: 77.3200 }, state: 'Uttar Pradesh', country: 'India', priority: 2 },
          { name: 'Great India Place', area: 'Sector 18, Noida', coords: { lat: 28.5900, lng: 77.3200 }, state: 'Uttar Pradesh', country: 'India', priority: 2 },
          { name: 'Logix City Centre', area: 'Sector 32, Noida', coords: { lat: 28.6000, lng: 77.3300 }, state: 'Uttar Pradesh', country: 'India', priority: 2 },
          { name: 'DLF Mall of India', area: 'Sector 18, Noida', coords: { lat: 28.5682, lng: 77.3250 }, state: 'Uttar Pradesh', country: 'India', priority: 2 }
        ];
        
        // Smart search algorithm for Delhi NCR with fuzzy matching
        const searchResults = delhiNCRLocations.filter(loc => {
          const searchTerms = fallbackQuery.split(' ').filter(term => term.length > 0);
          const fullText = `${loc.name} ${loc.area} ${loc.state} ${loc.country}`.toLowerCase();
          
          // Check if all search terms match (with fuzzy matching for common variations)
          return searchTerms.every(term => {
            const lowerTerm = term.toLowerCase();
            
            // Direct match
            if (fullText.includes(lowerTerm)) return true;
            
            // Fuzzy matching for common variations
            if (lowerTerm === 'aspir' && fullText.includes('aspire')) return true;
            if (lowerTerm === 'aspire' && fullText.includes('aspir')) return true;
            if (lowerTerm === 'sec' && fullText.includes('sector')) return true;
            if (lowerTerm === 'sector' && fullText.includes('sec')) return true;
            if (lowerTerm === 'gr' && fullText.includes('greater')) return true;
            if (lowerTerm === 'greater' && fullText.includes('gr')) return true;
            if (lowerTerm === 'noida' && fullText.includes('noida')) return true;
            if (lowerTerm === 'delhi' && fullText.includes('delhi')) return true;
            
            return false;
          });
        });

        // Sort by priority and relevance
        suggestions = searchResults
          .sort((a, b) => {
            // First sort by priority (1 = high, 2 = medium)
            if (a.priority !== b.priority) {
              return a.priority - b.priority;
            }
            // Then by exact name match
            const aExactMatch = a.name.toLowerCase().includes(fallbackQuery);
            const bExactMatch = b.name.toLowerCase().includes(fallbackQuery);
            if (aExactMatch && !bExactMatch) return -1;
            if (!aExactMatch && bExactMatch) return 1;
            return 0;
          })
          .slice(0, parseInt(queryParams.limit) || 10)
          .map((loc, index) => ({
            id: `delhi-ncr-${index}`,
            title: `${loc.name}, ${loc.area}`,
            subtitle: `${loc.state}, ${loc.country}`,
            address: `${loc.name}, ${loc.area}, ${loc.state}, ${loc.country}`,
            coords: loc.coords
          }));
      }

      // Cache the results
      locationSearchCache.set(cacheKey, {
        results: suggestions,
        timestamp: Date.now()
      });

      console.log(`✅ Found ${suggestions.length} results for "${searchQuery}"`);
      res.json({ results: suggestions });

    } catch (error) {
      console.error('Location search error:', error);
      res.status(500).json({ 
        error: 'Failed to search locations',
        message: 'Please try again later'
      });
    }
  });

  // Reverse geocoding endpoint - convert coordinates to location name
  app.get('/api/locations/reverse', communicationRateLimits.analytics, async (req, res) => {
    // Prevent HTTP caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: 'Invalid coordinates' });
      }

      // Check our Delhi NCR database first for instant results
      const delhiNCRLocations = [
        { name: 'Connaught Place', area: 'New Delhi', coords: { lat: 28.6315, lng: 77.2167 }, state: 'Delhi' },
        { name: 'Cyber City', area: 'Gurugram', coords: { lat: 28.4960, lng: 77.0900 }, state: 'Haryana' },
        { name: 'Sector 18', area: 'Noida', coords: { lat: 28.5900, lng: 77.3200 }, state: 'Uttar Pradesh' },
        { name: 'Nirala Estate', area: 'Greater Noida', coords: { lat: 28.5355, lng: 77.3910 }, state: 'Uttar Pradesh' },
        { name: 'Saket', area: 'New Delhi', coords: { lat: 28.5245, lng: 77.2069 }, state: 'Delhi' },
        { name: 'Greater Noida', area: 'Greater Noida', coords: { lat: 28.4744, lng: 77.5040 }, state: 'Uttar Pradesh' },
        { name: 'Ghaziabad', area: 'Ghaziabad', coords: { lat: 28.6692, lng: 77.4538 }, state: 'Uttar Pradesh' },
        { name: 'Faridabad', area: 'Faridabad', coords: { lat: 28.4089, lng: 77.3178 }, state: 'Haryana' },
        { name: 'Gurugram', area: 'Gurugram', coords: { lat: 28.4595, lng: 77.0266 }, state: 'Haryana' },
        { name: 'Noida', area: 'Noida', coords: { lat: 28.5700, lng: 77.3200 }, state: 'Uttar Pradesh' },
        { name: 'Delhi', area: 'New Delhi', coords: { lat: 28.7041, lng: 77.1025 }, state: 'Delhi' }
      ];

      // Find nearest location from our database
      const findNearest = (locations: typeof delhiNCRLocations) => {
        let nearest = null;
        let minDistance = Infinity;

        for (const loc of locations) {
          const distance = Math.sqrt(
            Math.pow(lat - loc.coords.lat, 2) + Math.pow(lng - loc.coords.lng, 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            nearest = loc;
          }
        }

        // If within ~5km (0.05 degrees), return the nearest location
        if (minDistance < 0.05 && nearest) {
          return `${nearest.name}, ${nearest.area}`;
        }
        return null;
      };

      const nearestLocation = findNearest(delhiNCRLocations);
      if (nearestLocation) {
        console.log(`✅ Reverse geocoded to nearby location: ${nearestLocation}`);
        return res.json({ address: nearestLocation });
      }

      // Fall back to Google Places API for accurate reverse geocoding
      const googlePlacesKey = process.env.GOOGLE_PLACES_API_KEY;
      if (googlePlacesKey) {
        try {
          const googleUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
          const googleParams = new URLSearchParams({
            latlng: `${lat},${lng}`,
            key: googlePlacesKey,
            result_type: 'locality|sublocality|neighborhood'
          });

          const googleResponse = await fetch(`${googleUrl}?${googleParams}`, {
            headers: { 'Accept': 'application/json' }
          });

          if (googleResponse.ok) {
            const data = await googleResponse.json();
            if (data.status === 'OK' && data.results && data.results.length > 0) {
              const result = data.results[0];
              const address = result.formatted_address || result.address_components?.[0]?.long_name;
              console.log(`✅ Google reverse geocoded: ${address}`);
              return res.json({ address });
            }
          }
        } catch (error) {
          console.error('Google reverse geocoding error:', error);
        }
      }

      // Final fallback: simple area name
      const fallbackAddress = 'Current location';
      console.log(`⚠️ Reverse geocoding fallback for (${lat}, ${lng})`);
      res.json({ address: fallbackAddress });

    } catch (error) {
      console.error('Reverse geocoding error:', error);
      res.status(500).json({ error: 'Reverse geocoding failed', address: 'Current location' });
    }
  });

  // Location details endpoint for the location picker modal
  app.get('/api/locations/details', communicationRateLimits.analytics, async (req, res) => {
    try {
      const placeId = req.query.place_id as string;
      
      if (!placeId) {
        return res.status(400).json({
          error: 'Missing place_id parameter'
        });
      }

      // Use the existing places details endpoint logic
      const validation = placesDetailsSchema.safeParse({ placeId });
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      if (!GEOAPIFY_API_KEY) {
        return res.status(503).json({ 
          error: 'Places service not available', 
          message: 'Geocoding service is not configured' 
        });
      }

      const geoapifyParams = {
        apiKey: GEOAPIFY_API_KEY,
        id: placeId
      };

      const geoapifyResponse = await makeGeoapifyRequest(
        'https://api.geoapify.com/v1/geocode/search',
        geoapifyParams
      );

      if (!geoapifyResponse.features || geoapifyResponse.features.length === 0) {
        return res.status(404).json({ 
          error: 'Place not found',
          message: 'The specified place could not be found'
        });
      }

      const feature = geoapifyResponse.features[0];
      const result = {
        result: {
          place_id: feature.properties.place_id,
          formatted_address: feature.properties.formatted,
          geometry: {
            location: {
              lat: feature.geometry.coordinates[1],
              lng: feature.geometry.coordinates[0]
            }
          },
          address_components: feature.properties.address_components || [],
          name: feature.properties.name || feature.properties.street || feature.properties.city
        }
      };

      res.json(result);

    } catch (error) {
      console.error('Location details error:', error);
      res.status(500).json({ 
        error: 'Failed to get location details',
        message: 'Please try again later'
      });
    }
  });

  // Geocode endpoint for the location picker modal
  app.get('/api/locations/geocode', communicationRateLimits.analytics, async (req, res) => {
    try {
      const address = req.query.address as string;
      const lat = req.query.lat as string;
      const lng = req.query.lng as string;
      
      // Check if this is reverse geocoding (lat,lng to address)
      if (lat && lng) {
        try {
          const nominatimResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
          );
          
          if (nominatimResponse.ok) {
            const nominatimData = await nominatimResponse.json();
            if (nominatimData && nominatimData.display_name) {
              const result = {
                results: [{
                  geometry: {
                    location: {
                      lat: parseFloat(lat),
                      lng: parseFloat(lng)
                    }
                  },
                  formatted_address: nominatimData.display_name,
                  address_components: nominatimData.address || []
                }]
              };
              console.log(`Nominatim reverse geocoded ${lat}, ${lng} to:`, result.results[0].formatted_address);
              return res.json(result);
            }
          }
        } catch (nominatimError) {
          console.error('Nominatim reverse geocoding failed:', nominatimError);
        }
        
        return res.status(404).json({ 
          error: 'Location not found',
          message: 'The specified coordinates could not be reverse geocoded'
        });
      }
      
      if (!address) {
        return res.status(400).json({
          error: 'Missing address or coordinates parameter'
        });
      }

      // Use the existing places geocode endpoint logic
      const queryParams = {
        address: address,
        countrycode: req.query.countrycode as string
      };

      const validation = placesGeocodeSchema.safeParse(queryParams);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const validatedParams = validation.data;
      let result: any = null;

      if (GEOAPIFY_API_KEY) {
        try {
          const geoapifyParams: any = {
            apiKey: GEOAPIFY_API_KEY,
            text: validatedParams.address,
            limit: 1
          };

          if (validatedParams.countrycode) {
            geoapifyParams.filter = `countrycode:${validatedParams.countrycode}`;
          }

          const geoapifyResponse = await makeGeoapifyRequest(
            'https://api.geoapify.com/v1/geocode/search',
            geoapifyParams
          );

          if (geoapifyResponse.features && geoapifyResponse.features.length > 0) {
            const feature = geoapifyResponse.features[0];
            result = {
              results: [{
                geometry: {
                  location: {
                    lat: feature.geometry.coordinates[1],
                    lng: feature.geometry.coordinates[0]
                  }
                },
                formatted_address: feature.properties.formatted,
                address_components: feature.properties.address_components || []
              }]
            };
          }
        } catch (geoapifyError) {
          console.error('Geoapify geocoding error:', geoapifyError);
        }
      }

      // Fallback to Nominatim if Geoapify fails
      if (!result) {
        try {
          const nominatimResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(validatedParams.address)}&limit=1&addressdetails=1`
          );
          
          if (nominatimResponse.ok) {
            const nominatimData = await nominatimResponse.json();
            if (nominatimData && nominatimData.length > 0) {
              const place = nominatimData[0];
              result = {
                results: [{
                  geometry: {
                    location: {
                      lat: parseFloat(place.lat),
                      lng: parseFloat(place.lon)
                    }
                  },
                  formatted_address: place.display_name,
                  address_components: place.address || []
                }]
              };
              console.log(`Nominatim geocoded "${validatedParams.address}" to:`, result.results[0].geometry.location);
            }
          }
        } catch (nominatimError) {
          console.error('Nominatim geocoding also failed:', nominatimError);
        }
      }

      if (!result) {
        return res.status(404).json({ 
          error: 'Address not found',
          message: 'The specified address could not be geocoded'
        });
      }

      res.json(result);

    } catch (error) {
      console.error('Location geocode error:', error);
      res.status(500).json({ 
        error: 'Failed to geocode address',
        message: 'Please try again later'
      });
    }
  });

  // ===============================================
  // PLACES API ENDPOINTS (Public)
  // ===============================================
  
  // Geoapify API helper functions
  const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
  
  if (!GEOAPIFY_API_KEY) {
    console.warn('Geoapify API key not configured - Using Nominatim fallback for Places functionality');
  }

  const makeGeoapifyRequest = async (url: string, params: Record<string, string>): Promise<any> => {
    if (!GEOAPIFY_API_KEY) {
      throw new Error('Geoapify API key not configured');
    }

    const urlParams = new URLSearchParams({
      ...params,
      apiKey: GEOAPIFY_API_KEY
    });

    const response = await fetch(`${url}?${urlParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SalonHub/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Geoapify API error (${response.status}):`, errorText);
      throw new Error(`Geoapify API error: ${response.status}`);
    }

    return response.json();
  };

  // Nominatim API fallback helper functions (free, no API key required)
  const makeNominatimRequest = async (url: string, params: Record<string, string>, options: RequestInit = {}): Promise<any> => {
    const urlParams = new URLSearchParams({
      ...params,
      format: 'json',
      addressdetails: '1',
      limit: params.limit || '10'
    });

    const response = await fetch(`${url}?${urlParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SalonHub/1.0 (proximity search)'
      },
      ...options
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Nominatim API error (${response.status}):`, errorText);
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    return response.json();
  };

  // Autocomplete endpoint - GET /api/places/autocomplete?q=&lat=&lng=
  app.get('/api/places/autocomplete', communicationRateLimits.analytics, async (req, res) => {
    try {

      // Parse and validate query parameters
      const queryParams = {
        q: req.query.q as string,
        lat: req.query.lat ? parseFloat(req.query.lat as string) : undefined,
        lng: req.query.lng ? parseFloat(req.query.lng as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        countrycode: req.query.countrycode as string
      };

      // Remove undefined values
      Object.keys(queryParams).forEach(key => {
        const value = (queryParams as any)[key];
        if (value === undefined) {
          delete (queryParams as any)[key];
        }
      });

      const validation = placesAutocompleteSchema.safeParse(queryParams);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const validatedParams = validation.data;

      let suggestions: any[] = [];

      if (GEOAPIFY_API_KEY) {
        try {
          // Build Geoapify parameters
          const geoapifyParams: Record<string, string> = {
            text: validatedParams.q,
            limit: validatedParams.limit?.toString() || '10'
          };

          if (validatedParams.lat && validatedParams.lng) {
            geoapifyParams.bias = `proximity:${validatedParams.lng},${validatedParams.lat}`;
          }

          if (validatedParams.countrycode) {
            geoapifyParams.filter = `countrycode:${validatedParams.countrycode}`;
          }

          // Make request to Geoapify
          const geoapifyResponse = await makeGeoapifyRequest(
            'https://api.geoapify.com/v1/geocode/autocomplete',
            geoapifyParams
          );

          // Transform response to our format
          suggestions = geoapifyResponse.features?.map((feature: any) => ({
            id: feature.properties.place_id || `${feature.geometry.coordinates[1]}_${feature.geometry.coordinates[0]}`,
            title: feature.properties.formatted || feature.properties.name || '',
            subtitle: [
              feature.properties.city,
              feature.properties.state,
              feature.properties.country
            ].filter(Boolean).join(', '),
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0]
          })) || [];
        } catch (error) {
          console.warn('Geoapify autocomplete failed, falling back to Nominatim:', error);
        }
      }

      // Fallback to Nominatim if no Geoapify key or Geoapify failed
      if (suggestions.length === 0) {
        try {
          console.log('Using Nominatim fallback for autocomplete search:', validatedParams.q);
          
          const nominatimParams: Record<string, string> = {
            q: validatedParams.q,
            limit: validatedParams.limit?.toString() || '10'
          };

          if (validatedParams.countrycode) {
            nominatimParams.countrycodes = validatedParams.countrycode;
          }

          // Use viewbox for proximity bias if coordinates provided
          if (validatedParams.lat && validatedParams.lng) {
            const lat = validatedParams.lat;
            const lng = validatedParams.lng;
            const delta = 0.5; // ~55km radius
            nominatimParams.viewbox = `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`;
            nominatimParams.bounded = '1';
          }

          const nominatimResponse = await makeNominatimRequest(
            'https://nominatim.openstreetmap.org/search',
            nominatimParams
          );

          // Transform Nominatim response to our format
          suggestions = (nominatimResponse || []).map((place: any) => ({
            id: place.place_id?.toString() || `${place.lat}_${place.lon}`,
            title: place.display_name?.split(',')[0] || place.name || '',
            subtitle: place.display_name?.split(',').slice(1, 3).join(',').trim() || '',
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon)
          }));

          console.log(`Nominatim returned ${suggestions.length} suggestions for "${validatedParams.q}"`);
        } catch (nominatimError) {
          console.error('Nominatim autocomplete also failed:', nominatimError);
          // Continue with empty suggestions array
        }
      }

      res.json({
        suggestions,
        query: validatedParams.q,
        source: GEOAPIFY_API_KEY && suggestions.length > 0 ? 'geoapify' : 'nominatim'
      });

    } catch (error) {
      console.error('Places autocomplete error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch address suggestions',
        message: 'Please try again later'
      });
    }
  });

  // Details endpoint - GET /api/places/details?placeId=
  app.get('/api/places/details', communicationRateLimits.analytics, async (req, res) => {
    try {
      if (!GEOAPIFY_API_KEY) {
        return res.status(503).json({ 
          error: 'Places service not available', 
          message: 'Geocoding service is not configured' 
        });
      }

      const validation = placesDetailsSchema.safeParse({
        placeId: req.query.placeId as string
      });

      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const { placeId } = validation.data;

      // For Geoapify, we need to parse the place ID if it contains coordinates
      let geoapifyParams: Record<string, string>;
      
      if (placeId.includes('_')) {
        // This might be our custom coordinate-based ID
        const [lat, lng] = placeId.split('_');
        geoapifyParams = {
          lat,
          lon: lng
        };
      } else {
        // Use the place ID directly
        geoapifyParams = {
          place_id: placeId
        };
      }

      // Make request to Geoapify
      const geoapifyResponse = await makeGeoapifyRequest(
        'https://api.geoapify.com/v1/geocode/reverse',
        geoapifyParams
      );

      if (!geoapifyResponse.features || geoapifyResponse.features.length === 0) {
        return res.status(404).json({ 
          error: 'Place not found',
          message: 'The specified place could not be found'
        });
      }

      const feature = geoapifyResponse.features[0];
      const props = feature.properties;

      // Transform response to our format
      const result = {
        address: props.formatted || '',
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
        placeId: props.place_id || placeId,
        components: {
          city: props.city || '',
          state: props.state || '',
          country: props.country || '',
          postcode: props.postcode || '',
          street: props.street || '',
          housenumber: props.housenumber || ''
        }
      };

      res.json(result);

    } catch (error) {
      console.error('Places details error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch place details',
        message: 'Please try again later'
      });
    }
  });

  // Geocode endpoint - GET /api/places/geocode?address= OR /api/places/geocode?lat=&lng=
  app.get('/api/places/geocode', communicationRateLimits.analytics, async (req, res) => {
    try {

      // Parse query parameters for both forward and reverse geocoding
      const queryParams: any = {};
      
      if (req.query.address) {
        queryParams.address = req.query.address as string;
      }
      if (req.query.lat && req.query.lng) {
        queryParams.lat = parseFloat(req.query.lat as string);
        queryParams.lng = parseFloat(req.query.lng as string);
      }
      if (req.query.countrycode) {
        queryParams.countrycode = req.query.countrycode as string;
      }

      const validation = placesGeocodeSchema.safeParse(queryParams);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const validatedData = validation.data;
      let result: any = null;

      // Check if it's forward geocoding (address to coordinates) or reverse geocoding (coordinates to address)
      const isReverseGeocoding = 'lat' in validatedData && 'lng' in validatedData;
      const isForwardGeocoding = 'address' in validatedData;

      if (isReverseGeocoding) {
        // Reverse geocoding: coordinates -> address
        const { lat, lng, countrycode } = validatedData as { lat: number; lng: number; countrycode?: string };
        
        console.log(`Reverse geocoding coordinates: ${lat}, ${lng}`);

        // Try Geoapify reverse geocoding first if API key is available
        if (GEOAPIFY_API_KEY) {
          try {
            const geoapifyParams: Record<string, string> = {
              lat: lat.toString(),
              lon: lng.toString(),
              limit: '1'
            };

            if (countrycode) {
              geoapifyParams.filter = `countrycode:${countrycode}`;
            }

            const geoapifyResponse = await makeGeoapifyRequest(
              'https://api.geoapify.com/v1/geocode/reverse',
              geoapifyParams
            );

            if (geoapifyResponse.features && geoapifyResponse.features.length > 0) {
              const feature = geoapifyResponse.features[0];
              const props = feature.properties;

              result = {
                address: props.formatted || `${lat}, ${lng}`,
                lat: lat,
                lng: lng,
                confidence: props.confidence || 0.8,
                components: {
                  city: props.city || '',
                  state: props.state || '',
                  country: props.country || '',
                  postcode: props.postcode || '',
                  street: props.street || '',
                  housenumber: props.housenumber || ''
                },
                source: 'geoapify'
              };
            }
          } catch (error) {
            console.warn('Geoapify reverse geocoding failed, falling back to Nominatim:', error);
          }
        }

        // Fallback to Nominatim reverse geocoding
        if (!result) {
          try {
            console.log('Using Nominatim fallback for reverse geocoding:', lat, lng);
            
            const nominatimParams: Record<string, string> = {
              lat: lat.toString(),
              lon: lng.toString(),
              zoom: '18', // High zoom for detailed address
              addressdetails: '1'
            };

            if (countrycode) {
              nominatimParams.countrycodes = countrycode;
            }

            const nominatimResponse = await makeNominatimRequest(
              'https://nominatim.openstreetmap.org/reverse',
              nominatimParams
            );

            if (nominatimResponse) {
              const address = nominatimResponse.display_name || `${lat}, ${lng}`;
              result = {
                address: address,
                lat: lat,
                lng: lng,
                confidence: 0.7,
                components: {
                  city: nominatimResponse.address?.city || nominatimResponse.address?.town || nominatimResponse.address?.village || '',
                  state: nominatimResponse.address?.state || '',
                  country: nominatimResponse.address?.country || '',
                  postcode: nominatimResponse.address?.postcode || '',
                  street: nominatimResponse.address?.road || '',
                  housenumber: nominatimResponse.address?.house_number || ''
                },
                source: 'nominatim'
              };
              console.log(`Nominatim reverse geocoded ${lat}, ${lng} to:`, address);
            }
          } catch (nominatimError) {
            console.error('Nominatim reverse geocoding also failed:', nominatimError);
          }
        }

        if (!result) {
          return res.status(404).json({ 
            error: 'Location not found',
            message: 'The specified coordinates could not be reverse geocoded'
          });
        }

      } else if (isForwardGeocoding) {
        // Forward geocoding: address -> coordinates  
        const { address, countrycode } = validatedData as { address: string; countrycode?: string };

        console.log(`Forward geocoding address: ${address}`);

        // Try Geoapify first if API key is available
        if (GEOAPIFY_API_KEY) {
          try {
            // Build Geoapify parameters
            const geoapifyParams: Record<string, string> = {
              text: address,
              limit: '1' // We only need the best match
            };

            if (countrycode) {
              geoapifyParams.filter = `countrycode:${countrycode}`;
            }

            // Make request to Geoapify
            const geoapifyResponse = await makeGeoapifyRequest(
              'https://api.geoapify.com/v1/geocode/search',
              geoapifyParams
            );

            if (geoapifyResponse.features && geoapifyResponse.features.length > 0) {
              const feature = geoapifyResponse.features[0];
              const props = feature.properties;

              result = {
                address: props.formatted || address,
                lat: feature.geometry.coordinates[1],
                lng: feature.geometry.coordinates[0],
                confidence: props.confidence || 0.5,
                components: {
                  city: props.city || '',
                  state: props.state || '',
                  country: props.country || '',
                  postcode: props.postcode || '',
                  street: props.street || '',
                  housenumber: props.housenumber || ''
                },
                source: 'geoapify'
              };
            }
          } catch (error) {
            console.warn('Geoapify geocoding failed, falling back to Nominatim:', error);
          }
        }

        // Fallback to Nominatim if no result yet
        if (!result) {
          try {
            console.log('Using Nominatim fallback for geocoding:', address);
            
            const nominatimParams: Record<string, string> = {
              q: address,
              limit: '1'
            };

            if (countrycode) {
              nominatimParams.countrycodes = countrycode;
            }

            const nominatimResponse = await makeNominatimRequest(
              'https://nominatim.openstreetmap.org/search',
              nominatimParams
            );

            if (nominatimResponse && nominatimResponse.length > 0) {
              const place = nominatimResponse[0];
              result = {
                address: place.display_name || address,
                lat: parseFloat(place.lat),
                lng: parseFloat(place.lon),
                confidence: place.importance || 0.5,
                components: {
                  city: place.address?.city || place.address?.town || place.address?.village || '',
                  state: place.address?.state || '',
                  country: place.address?.country || '',
                  postcode: place.address?.postcode || '',
                  street: place.address?.road || '',
                  housenumber: place.address?.house_number || ''
                },
                source: 'nominatim'
              };
              console.log(`Nominatim geocoded "${address}" to:`, result.lat, result.lng);
            }
          } catch (nominatimError) {
            console.error('Nominatim geocoding also failed:', nominatimError);
          }
        }

        if (!result) {
          return res.status(404).json({ 
            error: 'Address not found',
            message: 'The specified address could not be geocoded'
          });
        }
      }

      res.json(result);

    } catch (error) {
      console.error('Places geocode error:', error);
      res.status(500).json({ 
        error: 'Failed to process geocode request',
        message: 'Please try again later'
      });
    }
  });

  // Get Razorpay public key for frontend
  app.get('/api/razorpay-key', (req, res) => {
    if (!razorpay) {
      return res.status(503).json({ error: 'Payment service not configured' });
    }
    res.json({ key: process.env.RAZORPAY_KEY_ID });
  });

  // Razorpay webhook endpoint for reliable payment processing
  app.post('/api/razorpay-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      if (!razorpay) {
        return res.status(503).json({ error: 'Payment service not configured' });
      }
      const signature = req.headers['x-razorpay-signature'] as string;
      
      if (!signature) {
        console.log('Webhook signature missing');
        return res.status(400).json({ error: 'Signature missing' });
      }

      // Validate webhook signature for security
      const body = req.body.toString();
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET!)
        .update(body)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.log('Invalid webhook signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const event = JSON.parse(body);
      const { payload } = event;

      console.log('Webhook received:', {
        event: event.event,
        paymentId: payload.payment?.entity?.id,
        orderId: payload.payment?.entity?.order_id,
        timestamp: new Date().toISOString()
      });

      // Handle different webhook events
      switch (event.event) {
        case 'payment.captured':
          await handlePaymentCaptured(payload.payment.entity);
          break;
        case 'payment.failed':
          await handlePaymentFailed(payload.payment.entity);
          break;
        case 'order.paid':
          await handleOrderPaid(payload.order.entity, payload.payment.entity);
          break;
        default:
          console.log(`Unhandled webhook event: ${event.event}`);
      }

      // Always respond with 200 for successful processing
      res.status(200).json({ status: 'success' });

    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Helper function to handle payment captured
  async function handlePaymentCaptured(payment: any) {
    try {
      console.log('Processing payment.captured:', payment.id);
      
      // Find payment record by Razorpay order ID
      const paymentRecord = await storage.getPaymentByRazorpayOrderId(payment.order_id);
      
      if (!paymentRecord) {
        console.error('Payment record not found for order:', payment.order_id);
        return;
      }

      // Check if already processed (idempotency)
      if (paymentRecord.status === 'completed') {
        console.log('Payment already processed:', payment.id);
        return;
      }

      // Verify payment details match our records
      if (payment.amount !== paymentRecord.amountPaisa) {
        console.error('Payment amount mismatch:', {
          expected: paymentRecord.amountPaisa,
          received: payment.amount
        });
        await storage.updatePaymentStatus(paymentRecord.id, 'failed');
        return;
      }

      // Update payment with Razorpay details
      await storage.updatePaymentDetails(
        paymentRecord.id,
        payment.id,
        'webhook_verified'
      );

      // Mark payment as completed
      await storage.updatePaymentStatus(paymentRecord.id, 'completed', new Date());

      // ============ OFFER VALIDATION & BOOKING CONFIRMATION ============
      // CRITICAL: Validate offers BEFORE confirming booking to prevent usage limit bypass
      const booking = await storage.getBooking(paymentRecord.bookingId);
      let bookingStatus = 'confirmed'; // Default status if no offer or offer valid
      
      if (booking && booking.offerId) {
        console.log(`Validating offer ${booking.offerId} for booking ${booking.id} before confirmation`);
        
        try {
          // Get user by email (check for authenticated user)
          const user = booking.guestSessionId ? null : await storage.getUserByEmail(booking.customerEmail);
          
          if (user) {
            // CRITICAL: Re-validate offer eligibility at payment time
            // This prevents users from bypassing usage limits by creating multiple bookings before paying
            const eligibility = await storage.getUserOfferEligibility(user.id, booking.offerId);
            
            // Check if user is still eligible (usage limit not exceeded)
            if (!eligibility.eligible) {
              console.error(`🚨 CRITICAL: Offer ${booking.offerId} usage limit exceeded for user ${user.id}. Reason: ${eligibility.reason}`);
              console.error(`   Booking ${booking.id} was created when user was eligible, but limit reached before payment.`);
              console.error(`   This indicates potential usage limit bypass attempt.`);
              
              // SECURITY: Mark booking as requiring manual review - do NOT auto-confirm
              bookingStatus = 'pending_review';
              
              // Add note to booking explaining the issue
              const currentNotes = booking.notes || '';
              const securityNote = `\n\n[SECURITY ALERT] Offer usage limit exceeded at payment time. Requires manual admin review before confirmation. User: ${user.id}, Offer: ${booking.offerId}, Reason: ${eligibility.reason}`;
              await storage.updateBooking(booking.id, { 
                notes: currentNotes + securityNote
              });
              
              // TODO: Consider implementing automatic refund via Razorpay API
              // For now, flag for manual admin intervention
              console.error(`   ACTION REQUIRED: Admin must review booking ${booking.id} and either confirm at full price or initiate refund.`);
              
            } else {
              // User is still eligible - track usage normally
              const usageNumber = eligibility.usageCount + 1;
              
              await storage.trackOfferUsage(
                user.id,
                booking.offerId,
                booking.id,
                booking.discountAmountPaisa || 0,
                usageNumber
              );
              console.log(`✅ Offer usage tracked for user ${user.id} (usage #${usageNumber})`);

              // Calculate and add cashback for launch offers
              const cashbackAmount = await calculateLaunchOfferCashback(
                user.id,
                booking.offerId,
                booking.originalAmountPaisa || booking.totalAmountPaisa
              );

              if (cashbackAmount > 0) {
                // Add cashback to user's wallet (this also creates the transaction record)
                await storage.addWalletCredit(
                  user.id, 
                  cashbackAmount, 
                  `Cashback from offer on booking ${booking.id}`,
                  booking.id,
                  booking.offerId
                );
                
                console.log(`✅ Cashback of ${cashbackAmount} paisa added to user ${user.id} wallet`);
              }
            }
          } else {
            console.log('Guest booking - offer usage not tracked for non-authenticated users');
          }
        } catch (offerError) {
          console.error('Error processing offer tracking/cashback:', offerError);
          // Don't fail the payment if offer tracking fails - but still flag for review if it's a security issue
          bookingStatus = 'pending_review';
        }
      }

      // Update booking status based on offer validation result
      await storage.updateBookingStatus(paymentRecord.bookingId, bookingStatus);
      console.log(`Booking ${paymentRecord.bookingId} status updated to: ${bookingStatus}`);

      // Schedule booking reminders only for confirmed bookings (not pending_review)
      if (bookingStatus === 'confirmed') {
        try {
          await schedulingService.scheduleBookingReminders(paymentRecord.bookingId);
        } catch (scheduleError) {
          console.error('Error scheduling booking reminders via webhook:', scheduleError);
        }
      } else {
        console.log(`Skipping reminder scheduling for booking ${paymentRecord.bookingId} with status: ${bookingStatus}`);
      }

      console.log('Payment successfully processed via webhook:', payment.id);

    } catch (error) {
      console.error('Error processing payment.captured:', error);
    }
  }

  // Helper function to handle payment failed
  async function handlePaymentFailed(payment: any) {
    try {
      console.log('Processing payment.failed:', payment.id);
      
      const paymentRecord = await storage.getPaymentByRazorpayOrderId(payment.order_id);
      
      if (!paymentRecord) {
        console.error('Payment record not found for order:', payment.order_id);
        return;
      }

      // Update payment status to failed
      await storage.updatePaymentStatus(paymentRecord.id, 'failed');
      
      // Update booking status to cancelled
      await storage.updateBookingStatus(paymentRecord.bookingId, 'cancelled');

      // Send cancellation notification
      try {
        const booking = await storage.getBooking(paymentRecord.bookingId);
        if (booking) {
          await communicationService.sendMessage({
            to: booking.customerEmail,
            channel: 'email',
            customContent: {
              subject: 'Booking Cancellation - Payment Failed',
              body: `Hi ${booking.customerName || 'Valued Customer'},\n\nWe're sorry, but your booking has been cancelled due to a payment issue. Please contact us if you'd like to reschedule.\n\nBest regards,\nYour Salon Team`
            },
            variables: {},
            salonId: booking.salonId,
            customerId: booking.customerEmail,
            bookingId: booking.id,
            type: 'transactional'
          });
        }
      } catch (cancelError) {
        console.error('Error sending cancellation notification:', cancelError);
      }

      console.log('Payment failure processed:', payment.id);

    } catch (error) {
      console.error('Error processing payment.failed:', error);
    }
  }

  // Helper function to handle order paid (backup for payment.captured)
  async function handleOrderPaid(order: any, payment: any) {
    try {
      console.log('Processing order.paid:', order.id);
      await handlePaymentCaptured(payment);
    } catch (error) {
      console.error('Error processing order.paid:', error);
    }
  }

  // Proximity search endpoint for salons
  app.get('/api/search/salons', spikeProtection, async (req, res) => {
    try {
      console.log('🔍 PROXIMITY SEARCH CALLED:', {
        url: req.url,
        query: req.query,
        userAgent: req.get('User-Agent')?.substring(0, 50),
        timestamp: new Date().toISOString()
      });
      
      // Parse and validate query parameters
      const rawParams = {
        lat: parseFloat(req.query.lat as string),
        lng: parseFloat(req.query.lng as string),
        radiusKm: parseFloat(req.query.radiusKm as string) || 10,
        category: req.query.category as string,
        q: req.query.q as string,
        sort: req.query.sort as string || 'distance',
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20,
        time: req.query.time as string,
        date: req.query.date as string,
        maxPrice: parseInt(req.query.maxPrice as string) || undefined,
        venueType: req.query.venueType as string || undefined,
        availableToday: req.query.availableToday === 'true' || undefined,
        instantBooking: req.query.instantBooking === 'true' || undefined,
        offerDeals: req.query.offerDeals === 'true' || undefined,
        acceptGroup: req.query.acceptGroup === 'true' || undefined,
      };

      console.log('📍 PROXIMITY SEARCH PARAMS:', rawParams);

      // Validate parameters using Zod schema
      const validationResult = salonSearchSchema.safeParse(rawParams);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid search parameters',
          details: validationResult.error.format(),
        });
      }

      const params = validationResult.data;

      // Get all matching salons using proximity search
      console.log(`🌍 Searching salons near (${params.lat}, ${params.lng}) within ${params.radiusKm}km`);
      let allResults = await storage.findSalonsNearLocation(
        params.lat, 
        params.lng, 
        params.radiusKm, 
        500 // Get up to 500 results for filtering/sorting
      );
      console.log(`📊 Found ${allResults.length} salons within radius`);

      // If no results found within radius, show some nearby salons with warning
      if (allResults.length === 0) {
        console.log('No salons found within radius, showing nearby salons...');
        const nearbySalons = await storage.findSalonsNearLocation(
          params.lat, 
          params.lng, 
          50, // Search within 50km
          5 // Limit to 5 results
        );
        allResults = nearbySalons.map(salon => ({
          ...salon,
          distance_km: salon.distance_km || 999, // Mark as far away
          outside_radius: true // Flag to show warning
        }));
      }

      // Apply additional filters
      let filteredResults = allResults;

      // Filter by category if specified
      if (params.category) {
        filteredResults = filteredResults.filter(salon => {
          const salonCategory = salon.category.toLowerCase();
          const searchCategory = params.category!.toLowerCase();
          
          // Handle different category formats
          if (searchCategory === 'hair') {
            return salonCategory.includes('hair') || 
                   salonCategory.includes('salon') || 
                   salonCategory === 'hair_salon';
          }
          
          return salonCategory.includes(searchCategory);
        });
      }

      // Smart service-to-category mapping and text search
      if (params.q) {
        const searchQuery = params.q.toLowerCase();
        
        // Map common service searches to categories
        const serviceToCategoryMap: { [key: string]: string[] } = {
          'hair': ['hair', 'salon', 'hair_salon'],
          'hair cut': ['hair', 'salon', 'hair_salon'],
          'haircut': ['hair', 'salon', 'hair_salon'],
          'hair color': ['hair', 'salon', 'hair_salon'],
          'hair coloring': ['hair', 'salon', 'hair_salon'],
          'styling': ['hair', 'salon', 'hair_salon'],
          'nails': ['nails', 'nail', 'nail_salon'],
          'manicure': ['nails', 'nail', 'nail_salon'],
          'pedicure': ['nails', 'nail', 'nail_salon'],
          'nail art': ['nails', 'nail', 'nail_salon'],
          'massage': ['massage', 'spa'],
          'facial': ['skincare', 'facial', 'beauty'],
          'skincare': ['skincare', 'facial', 'beauty'],
          'eyebrows': ['eyebrows', 'brows', 'beauty'],
          'waxing': ['waxing', 'beauty', 'hair'],
          'makeup': ['makeup', 'beauty', 'bridal'],
          'bridal': ['bridal', 'makeup', 'beauty']
        };
        
        // Find matching categories for the search query
        const matchingCategories = new Set<string>();
        for (const [service, categories] of Object.entries(serviceToCategoryMap)) {
          if (searchQuery.includes(service)) {
            categories.forEach(cat => matchingCategories.add(cat));
          }
        }
        
        // If we found matching categories, filter by them
        if (matchingCategories.size > 0) {
          filteredResults = filteredResults.filter(salon => {
            const salonCategory = salon.category.toLowerCase();
            return Array.from(matchingCategories).some(cat => 
              salonCategory.includes(cat)
            );
          });
        } else {
          // Only do text search if no category mapping was found
          filteredResults = filteredResults.filter(salon => 
            salon.name.toLowerCase().includes(searchQuery) ||
            (salon.description && salon.description.toLowerCase().includes(searchQuery)) ||
            salon.address.toLowerCase().includes(searchQuery) ||
            salon.city.toLowerCase().includes(searchQuery)
          );
        }
      }

      // Filter by max price if specified
      if (rawParams.maxPrice) {
        filteredResults = filteredResults.filter(salon => {
          // Parse priceRange ($, $$, $$$, $$$$) to numeric value
          const priceRangeMap: { [key: string]: number } = {
            '$': 1000,
            '$$': 3000,
            '$$$': 6000,
            '$$$$': 10000,
          };
          const salonMaxPrice = priceRangeMap[salon.priceRange] || 5000;
          return salonMaxPrice <= rawParams.maxPrice!;
        });
      }

      // Filter by venue type if specified
      if (rawParams.venueType && rawParams.venueType !== 'everyone') {
        filteredResults = filteredResults.filter(salon => 
          (salon as any).venueType === rawParams.venueType || 
          (salon as any).venueType === 'everyone' || 
          !(salon as any).venueType
        );
      }

      // Filter by instant booking if specified
      if (rawParams.instantBooking) {
        filteredResults = filteredResults.filter(salon => 
          (salon as any).instantBooking === 1
        );
      }

      // Filter by offer deals if specified
      if (rawParams.offerDeals) {
        filteredResults = filteredResults.filter(salon => 
          (salon as any).offerDeals === 1
        );
      }

      // Filter by accept group if specified
      if (rawParams.acceptGroup) {
        filteredResults = filteredResults.filter(salon => 
          (salon as any).acceptGroup === 1
        );
      }

      // Apply time-based filtering if time parameter is provided
      if (params.time) {
        console.log(`⏰ Filtering by time availability: ${params.time}`);
        
        // Map semantic time tokens to hour ranges
        const timeRange = params.time;
        let startHour: number;
        let endHour: number;
        
        // Check if it's a semantic token (morning, afternoon, evening) or actual time range
        if (timeRange === 'morning') {
          startHour = 6; // 6 AM
          endHour = 12; // 12 PM
        } else if (timeRange === 'afternoon') {
          startHour = 12; // 12 PM
          endHour = 18; // 6 PM
        } else if (timeRange === 'evening') {
          startHour = 18; // 6 PM
          endHour = 23; // 11 PM
        } else if (timeRange.includes(' - ')) {
          // Parse actual time range (e.g., "12:00 PM - 6:00 PM")
          const [startTimeStr, endTimeStr] = timeRange.split(' - ');
          
          const parseTime = (timeStr: string) => {
            const [time, period] = timeStr.trim().split(' ');
            const [hours, minutes] = time.split(':').map(Number);
            let hour24 = hours;
            if (period === 'PM' && hours !== 12) hour24 += 12;
            if (period === 'AM' && hours === 12) hour24 = 0;
            return hour24 + (minutes / 60);
          };
          
          startHour = parseTime(startTimeStr);
          endHour = parseTime(endTimeStr);
        } else {
          // Invalid format, skip time filtering
          startHour = 0;
          endHour = 24;
        }
        
        console.log(`⏰ Looking for salons available between ${startHour}:00 and ${endHour}:00`);
        
        // Filter salons that have availability during the requested time
        filteredResults = await Promise.all(
          filteredResults.map(async (salon) => {
            try {
              // Get available time slots for the salon
              let dateStr: string;
              if (params.date) {
                if (params.date === 'tomorrow') {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  dateStr = tomorrow.toISOString().split('T')[0];
                } else if (params.date === 'today') {
                  dateStr = new Date().toISOString().split('T')[0];
                } else {
                  // Assume params.date is in YYYY-MM-DD format
                  dateStr = params.date;
                }
              } else {
                // Default to today if no date specified
                dateStr = new Date().toISOString().split('T')[0];
              }
              
              const timeSlots = await storage.getAvailableTimeSlots(salon.id, dateStr);
              
              // If no time slots available (e.g., no business hours set), include salon anyway
              if (!timeSlots || timeSlots.length === 0) {
                console.log(`⏰ Salon ${salon.name} has no time slots, including in results`);
                return salon;
              }
              
              // Check if any time slots overlap with the requested time range
              const hasAvailability = timeSlots.some((slot: any) => {
                const slotStart = new Date(slot.startDateTime);
                const slotEnd = new Date(slot.endDateTime);
                const slotStartHour = slotStart.getHours() + (slotStart.getMinutes() / 60);
                const slotEndHour = slotEnd.getHours() + (slotEnd.getMinutes() / 60);
                
                // Check if slot overlaps with requested time range (any overlap counts)
                return slotStartHour < endHour && slotEndHour > startHour;
              });
              
              return hasAvailability ? salon : null;
            } catch (error) {
              console.log(`Error checking availability for salon ${salon.id}:`, error.message);
              // Include salon even if error - don't eliminate due to technical issues
              return salon;
            }
          })
        );
        
        // Remove null results
        filteredResults = filteredResults.filter(salon => salon !== null);
        console.log(`⏰ Time filtering complete: ${filteredResults.length} salons available during requested time`);
      }

      // Apply sorting
      switch (params.sort) {
        case 'recommended':
          // Sort by combination of rating and review count for recommendations
          filteredResults.sort((a, b) => {
            const scoreA = parseFloat(a.rating || '0') * Math.log10((a.reviewCount || 1) + 1);
            const scoreB = parseFloat(b.rating || '0') * Math.log10((b.reviewCount || 1) + 1);
            return scoreB - scoreA;
          });
          break;
        case 'top-rated':
        case 'rating':
          // Sort by rating first, then by review count as tiebreaker
          filteredResults.sort((a, b) => {
            const ratingDiff = parseFloat(b.rating || '0') - parseFloat(a.rating || '0');
            if (Math.abs(ratingDiff) < 0.1) {
              return (b.reviewCount || 0) - (a.reviewCount || 0);
            }
            return ratingDiff;
          });
          break;
        case 'nearest':
        case 'distance':
          filteredResults.sort((a, b) => a.distance - b.distance);
          break;
        case 'name':
          filteredResults.sort((a, b) => a.name.localeCompare(b.name));
          break;
        default:
          filteredResults.sort((a, b) => a.distance - b.distance);
          break;
      }

      // Apply pagination
      const totalResults = filteredResults.length;
      console.log(`✅ PROXIMITY SEARCH COMPLETE: ${totalResults} filtered results, returning page ${params.page}`);
      const totalPages = Math.ceil(totalResults / params.pageSize);
      const startIndex = (params.page - 1) * params.pageSize;
      const endIndex = startIndex + params.pageSize;
      const paginatedResults = filteredResults.slice(startIndex, endIndex);

      // Calculate actual driving distances using Mapbox Directions API (industry standard)
      // This replaces straight-line "as the crow flies" distance with real driving distance via roads
      // Similar to Google Maps, Uber, Fresha - only shows distances people can actually travel
      const mapboxToken = process.env.VITE_MAPBOX_TOKEN;
      const salonsWithDrivingDistance = await Promise.all(paginatedResults.map(async salon => {
        let drivingDistanceKm = salon.distance; // Fallback to straight-line distance
        
        if (mapboxToken) {
          try {
            // Call Mapbox Directions API to get actual driving distance
            const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${params.lng},${params.lat};${salon.longitude},${salon.latitude}?access_token=${mapboxToken}&geometries=geojson`;
            
            const response = await fetch(directionsUrl, {
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.routes && data.routes.length > 0) {
                // Convert meters to kilometers - this is the ACTUAL driving distance
                drivingDistanceKm = data.routes[0].distance / 1000;
                console.log(`🚗 ${salon.name}: Straight-line ${salon.distance.toFixed(1)}km → Driving ${drivingDistanceKm.toFixed(1)}km`);
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch driving distance for salon ${salon.id}, using straight-line distance`);
          }
        }
        
        return {
          ...salon,
          drivingDistance: drivingDistanceKm
        };
      }));

      // Format response with images, services, and time slots
      const response: SalonSearchResult = {
        salons: await Promise.all(salonsWithDrivingDistance.map(async salon => {
          // Fetch media assets for each salon
          const mediaAssets = await storage.getMediaAssetsBySalonId(salon.id);
          const primaryImage = mediaAssets?.find((asset: any) => asset.isPrimary)?.url || 
                               mediaAssets?.find((asset: any) => asset.assetType === 'cover')?.url || '';
          
          // Get all image URLs for gallery preview
          let imageUrls = mediaAssets
            ?.filter((asset: any) => asset.assetType === 'cover')
            ?.map((asset: any) => asset.url)
            ?.slice(0, 4) || []; // Limit to 4 images for performance
          
          // Fallback to salon.imageUrls if no media assets
          if (imageUrls.length === 0 && salon.imageUrls && Array.isArray(salon.imageUrls)) {
            imageUrls = salon.imageUrls.slice(0, 4);
          }
          
          // Fetch services offered by this salon
          const services = await storage.getServicesBySalonId(salon.id);
          const serviceDetails = services.slice(0, 3).map((service: any) => ({
            name: service.name,
            durationMinutes: service.durationMinutes,
            price: service.priceInPaisa / 100, // Convert paisa to rupees
            currency: service.currency || 'INR',
            imageUrl: service.imageUrl || null
          })); // Top 3 services with details
          
          // Generate time slots for the requested date with real-time availability
          let availableTimeSlots: any[] = [];
          try {
            // Determine search date based on params
            let searchDate: string;
            if (params.date) {
              if (params.date === 'tomorrow') {
                searchDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
              } else if (params.date === 'today') {
                searchDate = new Date().toISOString().split('T')[0];
              } else {
                // Assume params.date is in YYYY-MM-DD format
                searchDate = params.date;
              }
            } else {
              // Default to today if no date specified
              searchDate = new Date().toISOString().split('T')[0];
            }
            
            // Try to get slots from database first
            let timeSlots = await storage.getAvailableTimeSlots(salon.id, searchDate);
            
            // If no database slots, generate from businessHours (production fallback)
            if (timeSlots.length === 0 && salon.businessHours) {
              const businessHours = typeof salon.businessHours === 'string' 
                ? JSON.parse(salon.businessHours) 
                : salon.businessHours;
              
              const searchDateObj = new Date(searchDate + 'T00:00:00');
              const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
              const dayName = dayNames[searchDateObj.getDay()];
              const dayHours = businessHours[dayName];
              
              if (dayHours && dayHours.open && dayHours.start && dayHours.end) {
                // Generate slots from business hours (30-min intervals)
                const [startHour, startMin] = dayHours.start.split(':').map(Number);
                const [endHour, endMin] = dayHours.end.split(':').map(Number);
                
                const slots = [];
                let currentHour = startHour;
                let currentMin = startMin;
                
                while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
                  const slotDateTime = new Date(searchDateObj);
                  slotDateTime.setHours(currentHour, currentMin, 0, 0);
                  
                  slots.push({
                    startDateTime: slotDateTime.toISOString(),
                    staffName: null
                  });
                  
                  currentMin += 30;
                  if (currentMin >= 60) {
                    currentMin = 0;
                    currentHour++;
                  }
                }
                
                timeSlots = slots;
              }
            }
            
            // Get existing bookings for this date to check availability
            // Fetch confirmed and pending bookings separately
            const confirmedBookings = await storage.getBookingsBySalonId(salon.id, {
              status: 'confirmed',
              startDate: searchDate,
              endDate: searchDate
            });
            const pendingBookings = await storage.getBookingsBySalonId(salon.id, {
              status: 'pending',
              startDate: searchDate,
              endDate: searchDate
            });
            const bookings = [...confirmedBookings, ...pendingBookings];
            
            // Get current time for past slot detection
            const now = new Date();
            const isToday = searchDate === now.toISOString().split('T')[0];
            
            // Helper function to check if a slot is booked
            const isSlotBooked = (slotTime: Date): boolean => {
              const slotStartMinutes = slotTime.getHours() * 60 + slotTime.getMinutes();
              const slotEndMinutes = slotStartMinutes + 30; // Assuming 30-min slots
              
              for (const booking of bookings) {
                const [bookingHours, bookingMinutes] = booking.bookingTime.split(':').map(Number);
                const bookingStartMinutes = bookingHours * 60 + bookingMinutes;
                const bookingDuration = booking.serviceDuration || 30;
                const bookingEndMinutes = bookingStartMinutes + bookingDuration;
                
                // Check for overlap
                if (slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes) {
                  return true;
                }
              }
              return false;
            };
            
            // Helper function to check if slot is in the past
            const isSlotPast = (slotTime: Date): boolean => {
              if (!isToday) return false;
              return slotTime < now;
            };
              
            // Process all time slots and add availability status
            let processedSlots = timeSlots.map((slot: any) => {
              const slotTime = new Date(slot.startDateTime);
              const isBooked = isSlotBooked(slotTime);
              const isPast = isSlotPast(slotTime);
              
              return {
                time: slotTime.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                }),
                staffName: slot.staffName,
                available: !isBooked && !isPast, // Only available if not booked AND not past
                booked: isBooked,
                past: isPast,
                dateTime: slot.startDateTime
              };
            });
            
            // Filter by time range if specified
            if (params.time) {
              let startHour: number;
              let endHour: number;
              
              if (params.time === 'morning') {
                startHour = 6;
                endHour = 12;
              } else if (params.time === 'afternoon') {
                startHour = 12;
                endHour = 18;
              } else if (params.time === 'evening') {
                startHour = 18;
                endHour = 23;
              } else if (params.time.includes(' - ')) {
                const [startTimeStr, endTimeStr] = params.time.split(' - ');
                const parseTime = (timeStr: string) => {
                  const [time, period] = timeStr.trim().split(' ');
                  const [hours, minutes] = time.split(':').map(Number);
                  let hour24 = hours;
                  if (period === 'PM' && hours !== 12) hour24 += 12;
                  if (period === 'AM' && hours === 12) hour24 = 0;
                  return hour24 + (minutes / 60);
                };
                startHour = parseTime(startTimeStr);
                endHour = parseTime(endTimeStr);
              } else {
                startHour = 0;
                endHour = 24;
              }
              
              processedSlots = processedSlots.filter((slot: any) => {
                const slotDateTime = new Date(slot.dateTime);
                const slotHour = slotDateTime.getHours() + (slotDateTime.getMinutes() / 60);
                return slotHour >= startHour && slotHour < endHour;
              });
            }
            
            // Return only available slots first, then show up to 3 booked/past for reference
            const availableSlots = processedSlots.filter((s: any) => s.available).slice(0, 6);
            const unavailableSlots = processedSlots.filter((s: any) => !s.available).slice(0, 3);
            availableTimeSlots = [...availableSlots, ...unavailableSlots];
          } catch (error) {
            console.log(`Error fetching time slots for salon ${salon.id}:`, error.message);
          }
          
          return {
            id: salon.id,
            name: salon.name,
            description: salon.description,
            address: salon.address,
            city: salon.city,
            state: salon.state,
            zipCode: salon.zipCode,
            latitude: salon.latitude,
            longitude: salon.longitude,
            phone: salon.phone,
            email: salon.email,
            website: salon.website,
            category: salon.category,
            priceRange: salon.priceRange,
            rating: salon.rating || '0.00',
            reviewCount: salon.reviewCount,
            imageUrl: primaryImage,
            imageUrls: imageUrls, // Multiple images for gallery
            services: serviceDetails, // Top 3 services with details (name, price, duration)
            availableTimeSlots: availableTimeSlots, // Available time slots for filtered time
            openTime: salon.openTime,
            closeTime: salon.closeTime,
            distance_km: Math.max(0.01, Number(salon.drivingDistance.toFixed(2))), // ACTUAL driving distance via roads (industry standard)
            createdAt: salon.createdAt,
          };
        })),
        pagination: {
          page: params.page,
          pageSize: params.pageSize,
          total: totalResults,
          totalPages,
          hasMore: params.page < totalPages,
        },
        searchParams: {
          lat: params.lat,
          lng: params.lng,
          radiusKm: params.radiusKm,
          category: params.category,
          q: params.q,
          sort: params.sort,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error in proximity search:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Latitude must be') || 
            error.message.includes('Longitude must be') ||
            error.message.includes('Radius must be')) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      res.status(500).json({ error: 'Failed to search salons' });
    }
  });

  // Get available salons with search functionality
  app.get('/api/salons', async (req, res) => {
    try {
      const { 
        service, 
        location, 
        categories, 
        minPrice, 
        maxPrice, 
        minRating,
        lat,
        lng,
        radiusKm
      } = req.query;

      const salons = await storage.getAllSalons();
      
      // Calculate distances if coordinates are provided
      let salonsWithDistance = salons;
      if (lat && lng) {
        const userLat = parseFloat(lat as string);
        const userLng = parseFloat(lng as string);
        const radius = radiusKm ? parseFloat(radiusKm as string) : 50; // Default 50km
        
        // Calculate straight-line distance for each salon
        salonsWithDistance = salons.map(salon => ({
          ...salon,
          distance: calculateDistance(userLat, userLng, salon.latitude, salon.longitude)
        })).filter(salon => salon.distance <= radius)
          .sort((a, b) => a.distance - b.distance); // Sort by distance
        
        // Calculate actual driving distances using Mapbox Directions API (industry standard)
        const mapboxToken = process.env.VITE_MAPBOX_TOKEN;
        if (mapboxToken) {
          salonsWithDistance = await Promise.all(salonsWithDistance.map(async salon => {
            let drivingDistanceKm = salon.distance; // Fallback to straight-line
            
            try {
              const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLng},${userLat};${salon.longitude},${salon.latitude}?access_token=${mapboxToken}&geometries=geojson`;
              const response = await fetch(directionsUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.routes && data.routes.length > 0) {
                  drivingDistanceKm = data.routes[0].distance / 1000;
                  console.log(`🚗 ${salon.name}: Straight-line ${salon.distance.toFixed(1)}km → Driving ${drivingDistanceKm.toFixed(1)}km`);
                }
              }
            } catch (error) {
              console.warn(`Failed to fetch driving distance for salon ${salon.id}`);
            }
            
            return {
              ...salon,
              distance: drivingDistanceKm, // Replace with actual driving distance
              drivingDistance: drivingDistanceKm
            };
          }));
        }
      }
      
      // Format salons for frontend with proper structure including images
      let formattedSalons = await Promise.all(salonsWithDistance.map(async salon => {
        try {
          // Get the first media asset as the primary image
          const mediaAssets = await storage.getMediaAssetsBySalonId(salon.id);
          const primaryImage = mediaAssets.find(asset => asset.isPrimary) || mediaAssets[0];
          
          // Fetch services offered by this salon (top 3 for card display)
          const services = await storage.getServicesBySalonId(salon.id);
          const serviceDetails = services.slice(0, 3).map((service: any) => ({
            name: service.name,
            durationMinutes: service.durationMinutes,
            price: service.priceInPaisa / 100, // Convert paisa to rupees
            currency: service.currency || 'INR',
            imageUrl: service.imageUrl || null
          }));
          
          // Check if salon has active packages for India-specific badge
          const packages = await storage.getPackagesBySalonId(salon.id);
          const hasPackages = packages.some((pkg: any) => pkg.isActive === 1);
          
          // Check if salon has Google reviews for verification badge
          const reviews = await storage.getReviewsBySalonId(salon.id, 'google');
          const hasGoogleReviews = reviews.length > 0;
          
          console.log(`Salon ${salon.name}: Found ${mediaAssets.length} media assets, ${services.length} services, ${packages.length} packages, ${reviews.length} Google reviews, primary: ${primaryImage?.url || 'none'}`);
          
          // Parse category if it's a JSON string
          let categoryDisplay = salon.category;
          try {
            if (typeof salon.category === 'string' && salon.category.startsWith('[')) {
              const categories = JSON.parse(salon.category);
              categoryDisplay = Array.isArray(categories) ? categories[0] || 'Beauty Services' : salon.category;
            }
          } catch (e) {
            categoryDisplay = salon.category;
          }

          return {
            id: salon.id,
            name: salon.name,
            rating: parseFloat(salon.rating?.toString() || '0'),
            reviewCount: salon.reviewCount,
            location: `${salon.address}, ${salon.city}`,
            address: salon.address,
            category: categoryDisplay,
            priceRange: salon.priceRange,
            openTime: salon.closeTime, // Show when it closes
            image: primaryImage?.url || '', // Include primary image URL
            latitude: salon.latitude,
            longitude: salon.longitude,
            services: serviceDetails, // Add services array
            distance_km: salon.distance ? Math.max(0.01, Number(salon.distance.toFixed(2))) : undefined, // ACTUAL driving distance
            hasPackages, // India-specific: Package deals availability
            hasGoogleReviews // India-specific: Google Reviews verification
          };
        } catch (error) {
          console.error(`Error fetching media for salon ${salon.id}:`, error);
          
          // Parse category if it's a JSON string (error fallback)
          let categoryDisplay = salon.category;
          try {
            if (typeof salon.category === 'string' && salon.category.startsWith('[')) {
              const categories = JSON.parse(salon.category);
              categoryDisplay = Array.isArray(categories) ? categories[0] || 'Beauty Services' : salon.category;
            }
          } catch (e) {
            categoryDisplay = salon.category;
          }

          return {
            id: salon.id,
            name: salon.name,
            rating: parseFloat(salon.rating?.toString() || '0'),
            reviewCount: salon.reviewCount,
            location: `${salon.address}, ${salon.city}`,
            address: salon.address,
            category: categoryDisplay,
            priceRange: salon.priceRange,
            openTime: salon.closeTime,
            image: '', // Fallback to empty string
            latitude: salon.latitude,
            longitude: salon.longitude,
            services: [], // Empty services on error
            distance_km: salon.distance ? Math.max(0.01, Number(salon.distance.toFixed(2))) : undefined, // ACTUAL driving distance
            hasPackages: false, // Safe default on error
            hasGoogleReviews: false // Safe default on error
          };
        }
      }));

      // Apply search filters
      if (service && typeof service === 'string') {
        const searchTerm = service.toLowerCase();
        formattedSalons = formattedSalons.filter(salon => 
          salon.name.toLowerCase().includes(searchTerm) ||
          salon.category.toLowerCase().includes(searchTerm)
        );
      }

      if (location && typeof location === 'string') {
        const locationTerm = location.toLowerCase();
        formattedSalons = formattedSalons.filter(salon => 
          salon.location.toLowerCase().includes(locationTerm)
        );
      }

      if (categories && typeof categories === 'string') {
        const categoryList = categories.split(',');
        formattedSalons = formattedSalons.filter(salon => 
          categoryList.some(cat => salon.category.toLowerCase().includes(cat.toLowerCase()))
        );
      }

      if (minRating && typeof minRating === 'string') {
        const minRatingNum = parseFloat(minRating);
        formattedSalons = formattedSalons.filter(salon => 
          salon.rating >= minRatingNum
        );
      }

      // Price range filtering (basic implementation)
      if (minPrice && typeof minPrice === 'string') {
        const minPriceNum = parseInt(minPrice);
        formattedSalons = formattedSalons.filter(salon => {
          // Basic price range check - you may need to adjust based on your price range format
          return salon.priceRange !== 'Budget' || minPriceNum <= 100;
        });
      }

      if (maxPrice && typeof maxPrice === 'string') {
        const maxPriceNum = parseInt(maxPrice);
        formattedSalons = formattedSalons.filter(salon => {
          // Basic price range check - you may need to adjust based on your price range format
          return salon.priceRange !== 'Premium' || maxPriceNum >= 200;
        });
      }

      res.json(formattedSalons);
    } catch (error) {
      console.error('Error fetching salons:', error);
      res.status(500).json({ error: 'Failed to fetch salons' });
    }
  });

  // Get salons that the current user can manage (protected endpoint)
  app.get('/api/my/salons', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Fetch fresh organization memberships to avoid stale data
      const orgMemberships = await storage.getUserOrganizations(userId);
      
      // Get ALL salons (not just published ones) because business owners need to manage unpublished salons
      const allSalons = await storage.getSalons();  // This gets ALL salons without publish filter
      
      const accessibleSalons = allSalons.filter(salon => {
        if (salon.ownerId === userId) return true;
        if (salon.orgId) {
          return orgMemberships.some((membership: any) => 
            membership.orgId === salon.orgId && 
            ['owner', 'manager'].includes(membership.orgRole)
          );
        }
        return false;
      });
      
      console.log(`User ${userId} has access to ${accessibleSalons.length} salons`);
      res.json(accessibleSalons);
    } catch (error) {
      console.error('Error fetching user salons:', error);
      res.status(500).json({ error: 'Failed to fetch user salons' });
    }
  });

  // BOOKING MANAGEMENT ENDPOINTS
  
  // Get bookings for a salon (business dashboard)
  app.get('/api/salons/:salonId/bookings', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { status, startDate, endDate } = req.query;
      
      const bookings = await storage.getBookingsBySalonId(salonId, {
        status: status as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching salon bookings:', error);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  });
  
  // Get specific booking details
  app.get('/api/salons/:salonId/bookings/:bookingId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, bookingId } = req.params;
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      // SECURITY: Verify booking belongs to the specified salon
      if (booking.salonId !== salonId) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      res.json(booking);
    } catch (error) {
      console.error('Error fetching booking:', error);
      res.status(500).json({ error: 'Failed to fetch booking' });
    }
  });
  
  // Update booking status
  app.put('/api/salons/:salonId/bookings/:bookingId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, bookingId } = req.params;
      
      // Validate input using Zod schema
      const validationResult = updateBookingSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }

      const input: UpdateBookingInput = validationResult.data;
      
      // SECURITY: First fetch the booking to verify it belongs to the salon
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      // SECURITY: Verify booking belongs to the specified salon
      if (booking.salonId !== salonId) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      // Validate status transition
      const transitionValidation = validateStatusTransition(booking.status, input.status);
      if (!transitionValidation.isValid) {
        return res.status(400).json({ error: transitionValidation.error });
      }
      
      // Update booking status and track affected rows
      const statusUpdateCount = await storage.updateBookingStatus(bookingId, input.status);
      
      let notesUpdateCount = 0;
      // If notes provided, update booking notes
      if (input.notes !== undefined) {
        notesUpdateCount = await storage.updateBookingNotes(bookingId, input.notes);
      }
      
      // Return affected row count for accurate UX feedback
      const totalAffectedRows = Math.max(statusUpdateCount, notesUpdateCount);
      res.json({ 
        success: true, 
        message: 'Booking updated successfully',
        affectedRows: totalAffectedRows
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      res.status(500).json({ error: 'Failed to update booking' });
    }
  });

  // Bulk update booking status
  app.put('/api/salons/:salonId/bookings/bulk-update', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      // Validate input using Zod schema
      const validationResult = bulkUpdateBookingSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }

      const input: BulkUpdateBookingInput = validationResult.data;
      
      // Validate status transitions for each booking
      const bookingsToUpdate = [];
      for (const bookingId of input.bookingIds) {
        const booking = await storage.getBooking(bookingId);
        if (!booking) {
          return res.status(404).json({ error: `Booking ${bookingId} not found` });
        }
        
        // SECURITY: Verify booking belongs to the specified salon
        if (booking.salonId !== salonId) {
          return res.status(404).json({ error: `Booking ${bookingId} not found` });
        }
        
        // Validate status transition
        const transitionValidation = validateStatusTransition(booking.status, input.status);
        if (!transitionValidation.isValid) {
          return res.status(400).json({ 
            error: `Invalid transition for booking ${bookingId}: ${transitionValidation.error}`
          });
        }
        
        bookingsToUpdate.push(booking);
      }
      
      // Update all bookings and get affected row count
      const affectedRows = await storage.bulkUpdateBookingStatus(input.bookingIds, input.status, salonId);
      
      res.json({ 
        success: true, 
        message: `${affectedRows} booking(s) updated successfully to ${input.status}`,
        affectedRows: affectedRows,
        requestedCount: input.bookingIds.length
      });
    } catch (error) {
      console.error('Error bulk updating bookings:', error);
      res.status(500).json({ error: 'Failed to update bookings' });
    }
  });

  // Reschedule booking (drag-and-drop support)
  app.patch('/api/salons/:salonId/bookings/:bookingId/reschedule', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, bookingId } = req.params;
      
      // Validate input using Zod schema
      const validationResult = rescheduleBookingInputSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }

      const input: RescheduleBookingInput = validationResult.data;
      
      // Get the current booking to verify it belongs to the salon
      const currentBooking = await storage.getBooking(bookingId);
      if (!currentBooking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      // SECURITY: Verify booking belongs to the specified salon
      if (currentBooking.salonId !== salonId) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Check if booking can be rescheduled (only pending and confirmed bookings)
      if (!['pending', 'confirmed'].includes(currentBooking.status)) {
        return res.status(400).json({ 
          error: `Cannot reschedule a ${currentBooking.status} booking. Only pending and confirmed bookings can be rescheduled.`
        });
      }

      // Prevent rescheduling to past dates
      const today = new Date().toISOString().split('T')[0];
      if (input.bookingDate < today) {
        return res.status(400).json({ 
          error: 'Cannot reschedule booking to a past date'
        });
      }

      // Perform the reschedule with conflict validation
      const updatedBooking = await storage.rescheduleBooking(bookingId, {
        bookingDate: input.bookingDate,
        bookingTime: input.bookingTime,
        staffId: input.staffId
      });

      // Send reschedule notification
      try {
        const salon = await storage.getSalon(salonId);
        const service = await storage.getService(updatedBooking.serviceId);
        const staff = updatedBooking.staffId ? await storage.getStaff(updatedBooking.staffId) : null;
        
        const variables = {
          customer_name: updatedBooking.customerName || 'Valued Customer',
          salon_name: salon?.name || 'Your Salon',
          service_name: service?.name || 'Service',
          staff_name: staff?.name || 'Our team',
          old_date: new Date(currentBooking.bookingDate).toLocaleDateString(),
          old_time: currentBooking.bookingTime,
          new_date: new Date(updatedBooking.bookingDate).toLocaleDateString(),
          new_time: updatedBooking.bookingTime,
          total_amount: (updatedBooking.totalAmountPaisa / 100).toFixed(2)
        };
        
        await sendRescheduleNotification(
          updatedBooking.salonId,
          updatedBooking.id,
          updatedBooking.customerEmail,
          updatedBooking.customerPhone || undefined,
          variables
        );
      } catch (commError) {
        console.error('Error sending reschedule notification:', commError);
        // Don't fail the reschedule if communication fails
      }

      res.json({ 
        success: true, 
        message: 'Booking rescheduled successfully',
        booking: updatedBooking
      });
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      
      // Handle specific conflict errors with 409 status
      if (error instanceof Error) {
        if (error.message.includes('not available') || error.message.includes('conflicts with existing booking')) {
          return res.status(409).json({ 
            error: 'Scheduling conflict',
            details: error.message
          });
        }
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: error.message });
        }
      }
      
      res.status(500).json({ error: 'Failed to reschedule booking' });
    }
  });
  
  // Get salon dashboard analytics
  app.get('/api/salons/:salonId/analytics', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { period = '7d' } = req.query; // 7d, 30d, 90d, 1y
      
      const analytics = await storage.getSalonAnalytics(salonId, period as string);
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching salon analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Advanced Analytics Endpoints
  
  // Get advanced staff analytics
  app.get('/api/salons/:salonId/analytics/staff', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { period = '30d' } = req.query;
      
      const analytics = await storage.getAdvancedStaffAnalytics(salonId, period as string);
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching advanced staff analytics:', error);
      res.status(500).json({ error: 'Failed to fetch staff analytics' });
    }
  });

  // Get client retention analytics
  app.get('/api/salons/:salonId/analytics/retention', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { period = '30d' } = req.query;
      
      const analytics = await storage.getClientRetentionAnalytics(salonId, period as string);
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching client retention analytics:', error);
      res.status(500).json({ error: 'Failed to fetch retention analytics' });
    }
  });

  // Get service popularity analytics
  app.get('/api/salons/:salonId/analytics/services', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { period = '30d' } = req.query;
      
      const analytics = await storage.getServicePopularityAnalytics(salonId, period as string);
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching service popularity analytics:', error);
      res.status(500).json({ error: 'Failed to fetch service analytics' });
    }
  });

  // Get business intelligence metrics
  app.get('/api/salons/:salonId/analytics/intelligence', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { period = '30d' } = req.query;
      
      const analytics = await storage.getBusinessIntelligenceMetrics(salonId, period as string);
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching business intelligence metrics:', error);
      res.status(500).json({ error: 'Failed to fetch intelligence metrics' });
    }
  });

  // Get cohort analysis
  app.get('/api/salons/:salonId/analytics/cohorts', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      const analytics = await storage.getCohortAnalysis(salonId);
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching cohort analysis:', error);
      res.status(500).json({ error: 'Failed to fetch cohort analysis' });
    }
  });

  // Get customer segmentation
  app.get('/api/salons/:salonId/analytics/segmentation', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      const analytics = await storage.getCustomerSegmentation(salonId);
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching customer segmentation:', error);
      res.status(500).json({ error: 'Failed to fetch customer segmentation' });
    }
  });
  
  // Get customer profiles for a salon
  app.get('/api/salons/:salonId/customers', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const customers = await storage.getCustomersBySalonId(salonId);
      
      res.json(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });
  
  // Get detailed customer profile with booking history and stats
  app.get('/api/salons/:salonId/customers/:customerEmail', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, customerEmail } = req.params;
      const decodedEmail = decodeURIComponent(customerEmail);
      
      // Get or create customer profile
      let customerProfile = await storage.getCustomerProfile(salonId, decodedEmail);
      if (!customerProfile) {
        // Optimized: Direct query for customer booking instead of O(n) scan
        customerProfile = await storage.getOrCreateCustomerProfile(salonId, decodedEmail);
        if (!customerProfile) {
          return res.status(404).json({ error: 'Customer not found' });
        }
      }
      
      // Get booking history and stats
      const [bookingHistory, customerStats] = await Promise.all([
        storage.getCustomerBookingHistory(salonId, decodedEmail),
        storage.getCustomerStats(salonId, decodedEmail)
      ]);
      
      res.json({
        profile: customerProfile,
        bookingHistory,
        stats: customerStats
      });
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      res.status(500).json({ error: 'Failed to fetch customer profile' });
    }
  });
  
  // Update customer profile notes and preferences
  app.put('/api/salons/:salonId/customers/:customerEmail', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, customerEmail } = req.params;
      const decodedEmail = decodeURIComponent(customerEmail);
      
      // Validate request body using zod schema - whitelist only allowed fields
      const validation = updateCustomerNotesSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      // Check for unknown keys not in the schema
      const allowedFields = ['notes', 'preferences', 'isVip', 'tags'];
      const providedFields = Object.keys(req.body);
      const unknownFields = providedFields.filter(field => !allowedFields.includes(field));
      
      if (unknownFields.length > 0) {
        return res.status(400).json({ 
          error: 'Unknown fields provided', 
          unknownFields 
        });
      }
      
      // Get existing profile
      let customerProfile = await storage.getCustomerProfile(salonId, decodedEmail);
      if (!customerProfile) {
        return res.status(404).json({ error: 'Customer profile not found' });
      }
      
      // Update the profile with validated data
      await storage.updateCustomerProfile(customerProfile.id, salonId, validation.data);
      
      res.json({ success: true, message: 'Customer profile updated successfully' });
    } catch (error) {
      console.error('Error updating customer profile:', error);
      res.status(500).json({ error: 'Failed to update customer profile' });
    }
  });

  // Get available services
  app.get('/api/services', async (req, res) => {
    try {
      const { salonId } = req.query;
      
      if (salonId) {
        // Get services for a specific salon
        const services = await storage.getServicesBySalonId(salonId as string);
        res.json(services);
      } else {
        // Get all services (fallback for backward compatibility)
        const services = await storage.getAllServices();
        res.json(services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  });

  // Get service templates (for service library during business setup)
  app.get('/api/service-templates', async (req, res) => {
    try {
      const { gender, category, isPopular } = req.query;
      
      const serviceTemplates = await storage.getServiceTemplates({
        gender: gender as string | undefined,
        category: category as string | undefined,
        isPopular: isPopular === 'true' ? true : isPopular === 'false' ? false : undefined,
      });
      
      res.json(serviceTemplates || []);
    } catch (error) {
      console.error('Error fetching service templates:', error);
      res.status(500).json({ error: 'Failed to fetch service templates' });
    }
  });

  // Salon-specific services endpoints
  // Get services for a specific salon
  // PUBLIC: Get salon services for customer viewing (no auth required)
  app.get('/api/salons/:salonId/services', async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const t0 = Date.now();
      const services = await storage.getServicesBySalonId(salonId);
      const t1 = Date.now();
      console.log(`[perf] getServicesBySalonId(salonId=${salonId}) took ${t1 - t0}ms, count=${services?.length ?? 0}`);
      res.json(services || []);
    } catch (error) {
      console.error('Error fetching salon services:', error);
      res.status(500).json({ error: 'Failed to fetch salon services' });
    }
  });

  // PROTECTED: Get salon services for business management
  app.get('/api/salons/:salonId/services/manage', isAuthenticated, requireSalonAccess(['owner', 'manager', 'staff']), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const services = await storage.getServicesBySalonId(salonId);
      res.json(services || []);
    } catch (error) {
      console.error('Error fetching salon services:', error);
      res.status(500).json({ error: 'Failed to fetch salon services' });
    }
  });

  // Bulk create services for a specific salon (optimized for performance)
  app.post('/api/salons/:salonId/services/bulk', isAuthenticated, requireSalonAccess(['owner', 'manager']), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const servicesArray = Array.isArray(req.body) ? req.body : [req.body];
      
      // Ensure isActive is always an integer (0 or 1)
      const normalizeIsActive = (value: any): number => {
        if (typeof value === 'boolean') return value ? 1 : 0;
        if (typeof value === 'number') return value ? 1 : 0;
        if (typeof value === 'string') return value.toLowerCase() === 'true' ? 1 : 0;
        return 1; // Default to active
      };
      
      const t0 = Date.now();
      
      // Process all services in parallel
      const createdServices = await Promise.all(
        servicesArray.map((service: any) => 
          storage.createService({
            ...service,
            salonId,
            isActive: normalizeIsActive(service.isActive)
          })
        )
      );
      
      const t1 = Date.now();
      console.log(`[perf] Bulk createService took ${t1 - t0}ms for ${createdServices.length} services (salonId=${salonId})`);
      
      res.json(createdServices);
    } catch (error) {
      console.error('Error creating salon services in bulk:', error);
      res.status(500).json({ error: 'Failed to create salon services' });
    }
  });

  // Create service for a specific salon
  app.post('/api/salons/:salonId/services', isAuthenticated, requireSalonAccess(['owner', 'manager']), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      // Ensure isActive is always an integer (0 or 1)
      const normalizeIsActive = (value: any): number => {
        if (typeof value === 'boolean') return value ? 1 : 0;
        if (typeof value === 'number') return value ? 1 : 0;
        if (typeof value === 'string') return value.toLowerCase() === 'true' ? 1 : 0;
        return 1; // Default to active
      };
      
      const serviceData = {
        ...req.body,
        salonId,
        isActive: normalizeIsActive(req.body.isActive)
      };
      
      const t0 = Date.now();
      const service = await storage.createService(serviceData);
      const t1 = Date.now();
      console.log(`[perf] createService took ${t1 - t0}ms (salonId=${salonId})`);
      res.json(service);
    } catch (error) {
      console.error('Error creating salon service:', error);
      res.status(500).json({ error: 'Failed to create salon service' });
    }
  });

  // Update service for a specific salon
  app.put('/api/salons/:salonId/services/:serviceId', isAuthenticated, requireSalonAccess(['owner', 'manager']), async (req: any, res) => {
    try {
      const { salonId, serviceId } = req.params;
      
      // Verify service belongs to this salon
      const existingService = await storage.getService(serviceId);
      if (!existingService || existingService.salonId !== salonId) {
        return res.status(404).json({ error: 'Service not found or does not belong to this salon' });
      }
      
      const serviceData = {
        ...req.body,
        id: serviceId,
        salonId
      };
      
      await storage.updateService(serviceId, req.body);
      
      // Return updated service
      const updatedService = await storage.getService(serviceId);
      res.json(updatedService);
    } catch (error) {
      console.error('Error updating salon service:', error);
      res.status(500).json({ error: 'Failed to update salon service' });
    }
  });

  // Delete service for a specific salon
  app.delete('/api/salons/:salonId/services/:serviceId', isAuthenticated, requireSalonAccess(['owner', 'manager']), async (req: any, res) => {
    try {
      const { salonId, serviceId } = req.params;
      
      // Verify service belongs to this salon
      const existingService = await storage.getService(serviceId);
      if (!existingService || existingService.salonId !== salonId) {
        return res.status(404).json({ error: 'Service not found or does not belong to this salon' });
      }
      
      await storage.deleteService(serviceId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting salon service:', error);
      res.status(500).json({ error: 'Failed to delete salon service' });
    }
  });

  // ========== PACKAGE/COMBO ENDPOINTS ==========
  
  // PUBLIC: Get all packages for a salon
  app.get('/api/salons/:salonId/packages', async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const packages = await storage.getPackagesBySalonId(salonId);
      res.json(packages || []);
    } catch (error) {
      console.error('Error fetching salon packages:', error);
      res.status(500).json({ error: 'Failed to fetch salon packages' });
    }
  });

  // PUBLIC: Get single package with services
  app.get('/api/salons/:salonId/packages/:packageId', async (req: any, res) => {
    try {
      const { salonId, packageId } = req.params;
      const packageData = await storage.getPackageWithServices(packageId);
      
      if (!packageData || packageData.salonId !== salonId) {
        return res.status(404).json({ error: 'Package not found or does not belong to this salon' });
      }
      
      res.json(packageData);
    } catch (error) {
      console.error('Error fetching package:', error);
      res.status(500).json({ error: 'Failed to fetch package' });
    }
  });

  // PROTECTED: Create package for a salon
  app.post('/api/salons/:salonId/packages', isAuthenticated, requireSalonAccess(['owner', 'manager']), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      // Validate request body
      const validationResult = createPackageSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid package data', 
          details: validationResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }

      const { serviceIds, name, description, discountedPricePaisa } = validationResult.data;
      
      // Fetch all selected services to calculate totals
      if (!serviceIds || serviceIds.length < 2) {
        return res.status(400).json({ error: 'Package must include at least 2 services' });
      }
      
      const services = await Promise.all(
        serviceIds.map((id: string) => storage.getService(id))
      );
      
      // Validate all services exist and belong to this salon
      const invalidService = services.find(s => !s || s.salonId !== salonId);
      if (invalidService === undefined && services.some(s => !s)) {
        return res.status(400).json({ error: 'One or more services not found' });
      }
      if (invalidService) {
        return res.status(400).json({ error: 'All services must belong to this salon' });
      }
      
      // Calculate totals
      const totalDurationMinutes = services.reduce((sum, s) => sum + (s?.durationMinutes || 0), 0);
      const regularPricePaisa = services.reduce((sum, s) => sum + (s?.priceInPaisa || 0), 0);
      
      // Validate regular price is positive (prevent division by zero)
      if (regularPricePaisa <= 0) {
        return res.status(400).json({ error: 'Services must have a total price greater than 0' });
      }
      
      // Validate discounted price is less than regular price
      if (discountedPricePaisa >= regularPricePaisa) {
        return res.status(400).json({ 
          error: 'Discounted price must be less than regular price', 
          details: { regularPrice: regularPricePaisa / 100, discountedPrice: discountedPricePaisa / 100 } 
        });
      }
      
      const discountPercentage = Math.round(((regularPricePaisa - discountedPricePaisa) / regularPricePaisa) * 100);
      
      // Create the package with services in a single transaction
      const newPackage = await storage.createPackageWithServices({
        name,
        description,
        salonId,
        totalDurationMinutes,
        packagePriceInPaisa: discountedPricePaisa,
        regularPriceInPaisa: regularPricePaisa,
        discountPercentage,
        currency: 'INR',
        isActive: 1
      }, serviceIds, salonId);
      
      // Return package with services
      const packageWithServices = await storage.getPackageWithServices(newPackage.id);
      res.json(packageWithServices);
    } catch (error) {
      console.error('Error creating package:', error);
      res.status(500).json({ error: 'Failed to create package' });
    }
  });

  // PROTECTED: Update package
  app.put('/api/salons/:salonId/packages/:packageId', isAuthenticated, requireSalonAccess(['owner', 'manager']), async (req: any, res) => {
    try {
      const { salonId, packageId } = req.params;
      
      // Validate request body
      const validationResult = updatePackageSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid package data', 
          details: validationResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      
      // Verify package belongs to this salon
      const existingPackage = await storage.getPackage(packageId);
      if (!existingPackage || existingPackage.salonId !== salonId) {
        return res.status(404).json({ error: 'Package not found or does not belong to this salon' });
      }
      
      const { serviceIds, name, description, discountedPricePaisa } = validationResult.data;
      
      // If services are being updated, recalculate totals
      if (serviceIds && serviceIds.length > 0) {
        const services = await Promise.all(
          serviceIds.map((id: string) => storage.getService(id))
        );
        
        // Validate all services exist and belong to this salon
        const invalidService = services.find(s => !s || s.salonId !== salonId);
        if (invalidService === undefined && services.some(s => !s)) {
          return res.status(400).json({ error: 'One or more services not found' });
        }
        if (invalidService) {
          return res.status(400).json({ error: 'All services must belong to this salon' });
        }
        
        // Calculate new totals
        const totalDurationMinutes = services.reduce((sum, s) => sum + (s?.durationMinutes || 0), 0);
        const regularPricePaisa = services.reduce((sum, s) => sum + (s?.priceInPaisa || 0), 0);
        
        // Validate regular price is positive (prevent division by zero)
        if (regularPricePaisa <= 0) {
          return res.status(400).json({ error: 'Services must have a total price greater than 0' });
        }
        
        const finalDiscountedPrice = discountedPricePaisa || existingPackage.packagePriceInPaisa;
        
        // Validate discounted price is less than regular price
        if (finalDiscountedPrice >= regularPricePaisa) {
          return res.status(400).json({ 
            error: 'Discounted price must be less than regular price', 
            details: { regularPrice: regularPricePaisa / 100, discountedPrice: finalDiscountedPrice / 100 } 
          });
        }
        
        const discountPercentage = Math.round(((regularPricePaisa - finalDiscountedPrice) / regularPricePaisa) * 100);
        
        // Update package with services in a single transaction
        await storage.updatePackageWithServices(packageId, {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(discountedPricePaisa && { packagePriceInPaisa: discountedPricePaisa }),
          totalDurationMinutes,
          regularPriceInPaisa: regularPricePaisa,
          discountPercentage,
        }, serviceIds, salonId);
      } else {
        // Update only basic fields if services aren't changing
        await storage.updatePackageWithServices(packageId, {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(discountedPricePaisa && { 
            packagePriceInPaisa: discountedPricePaisa,
            discountPercentage: Math.round(((existingPackage.regularPriceInPaisa - discountedPricePaisa) / existingPackage.regularPriceInPaisa) * 100)
          }),
        }, null, salonId);
      }
      
      // Return updated package with services
      const updatedPackage = await storage.getPackageWithServices(packageId);
      res.json(updatedPackage);
    } catch (error) {
      console.error('Error updating package:', error);
      res.status(500).json({ error: 'Failed to update package' });
    }
  });

  // PROTECTED: Delete package
  app.delete('/api/salons/:salonId/packages/:packageId', isAuthenticated, requireSalonAccess(['owner', 'manager']), async (req: any, res) => {
    try {
      const { salonId, packageId } = req.params;
      
      // Verify package belongs to this salon
      const existingPackage = await storage.getPackage(packageId);
      if (!existingPackage || existingPackage.salonId !== salonId) {
        return res.status(404).json({ error: 'Package not found or does not belong to this salon' });
      }
      
      await storage.deletePackage(packageId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting package:', error);
      res.status(500).json({ error: 'Failed to delete package' });
    }
  });

  // Create booking endpoint - Supports multiple services with SERVER-SIDE PRICE VALIDATION and offers
  app.post('/api/bookings', async (req, res) => {
    try {
      const {
        salonId,
        serviceIds,
        date,
        time,
        staffId,
        customerName,
        customerEmail,
        customerPhone,
        paymentMethod,
        isGuest,
        totalPrice,
        totalDuration,
        offerId
      } = req.body;

      // Validate required fields
      if (!salonId || !serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
        return res.status(400).json({ error: 'Missing required fields: salonId and serviceIds are required' });
      }

      if (!date || !time) {
        return res.status(400).json({ error: 'Missing required fields: date and time are required' });
      }

      if (!customerEmail) {
        return res.status(400).json({ error: 'Customer email is required' });
      }

      // Validate phone number is provided and verified via OTP
      if (!customerPhone) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      // Note: Phone verification is now handled by Firebase Phone Auth on the frontend
      // The PhoneVerification component ensures phones are verified before booking
      console.log(`📞 Booking request for phone: ${customerPhone}`);

      // Fetch all services from database for SERVER-SIDE PRICE VALIDATION
      const services = await Promise.all(
        serviceIds.map((id: string) => storage.getService(id))
      );

      // Validate all services exist and belong to the salon
      for (let i = 0; i < services.length; i++) {
        const service = services[i];
        if (!service || !service.isActive) {
          return res.status(404).json({ error: `Service ${serviceIds[i]} not found or inactive` });
        }
        if (service.salonId !== salonId) {
          return res.status(400).json({ error: `Service ${serviceIds[i]} does not belong to salon ${salonId}` });
        }
      }

      // Validate staffId if provided
      if (staffId) {
        const staff = await storage.getStaff(staffId);
        if (!staff) {
          return res.status(404).json({ error: 'Staff member not found' });
        }
        if (staff.salonId !== salonId) {
          return res.status(400).json({ error: 'Staff member does not belong to this salon' });
        }
      }

      // Calculate server-side price (CRITICAL: Never trust client-side prices)
      const serverTotalPrice = services.reduce((sum, service) => sum + service!.priceInPaisa, 0);
      const serverTotalDuration = services.reduce((sum, service) => sum + service!.durationMinutes, 0);

      // Validate client sent correct totals (prevent price and duration manipulation)
      if (totalPrice !== serverTotalPrice) {
        console.warn(`Price mismatch: client sent ${totalPrice}, server calculated ${serverTotalPrice}`);
        return res.status(400).json({ 
          error: 'Price validation failed',
          details: 'The booking price does not match server calculations'
        });
      }

      if (totalDuration !== serverTotalDuration) {
        console.warn(`Duration mismatch: client sent ${totalDuration}, server calculated ${serverTotalDuration}`);
        return res.status(400).json({ 
          error: 'Duration validation failed',
          details: 'The booking duration does not match server calculations'
        });
      }

      // Validate and apply offer if provided
      let discountInPaisa = 0;
      let finalAmountInPaisa = serverTotalPrice;
      let offerSnapshot = null;
      let userId = (req as any).user?.id || 'guest';

      if (offerId) {
        // Get offer details
        const offer = await storage.getOfferById(offerId);
        if (!offer) {
          return res.status(404).json({ error: 'Offer not found' });
        }

        // Validate offer is active and approved
        if (!offer.isActive || offer.approvalStatus !== 'approved') {
          return res.status(400).json({ error: 'Offer is not available' });
        }

        // Validate offer applies to this salon
        // Platform-wide offers (isPlatformWide === true) apply to all salons
        // Salon-specific offers must match the salonId
        if (!offer.isPlatformWide && offer.salonId !== salonId) {
          return res.status(400).json({ error: 'Offer does not apply to this salon' });
        }

        // Check offer validity dates
        const now = new Date();
        if (offer.validFrom && new Date(offer.validFrom) > now) {
          return res.status(400).json({ error: 'Offer not yet valid' });
        }
        if (offer.validUntil && new Date(offer.validUntil) < now) {
          return res.status(400).json({ error: 'Offer has expired' });
        }

        // Check user eligibility (for authenticated users)
        if (userId !== 'guest') {
          const eligibility = await storage.getUserOfferEligibility(userId, offerId);
          if (!eligibility.eligible) {
            return res.status(400).json({ 
              error: 'Not eligible for this offer',
              reason: eligibility.reason
            });
          }
        }

        // Check minimum purchase requirement
        if (offer.minimumPurchase && serverTotalPrice < offer.minimumPurchase) {
          return res.status(400).json({ 
            error: `Minimum purchase of ₹${(offer.minimumPurchase / 100).toFixed(0)} required for this offer`
          });
        }

        // Calculate discount (server-side) based on discountType and discountValue
        if (offer.discountType === 'percentage') {
          discountInPaisa = Math.floor((serverTotalPrice * offer.discountValue) / 100);
        } else if (offer.discountType === 'fixed') {
          discountInPaisa = offer.discountValue;
        }

        // Apply max discount cap
        if (offer.maxDiscount && discountInPaisa > offer.maxDiscount) {
          discountInPaisa = offer.maxDiscount;
        }

        // Ensure discount never exceeds total price (prevent negative final amount)
        if (discountInPaisa > serverTotalPrice) {
          discountInPaisa = serverTotalPrice;
        }

        finalAmountInPaisa = serverTotalPrice - discountInPaisa;

        // Create offer snapshot for booking record
        offerSnapshot = {
          offerId: offer.id,
          offerTitle: offer.title,
          discountType: offer.discountType,
          discountValue: offer.discountValue,
          discountApplied: discountInPaisa
        };

        console.log(`✅ Offer applied: ${offer.title}, discount: ₹${(discountInPaisa / 100).toFixed(0)}`);
      }

      // Create booking record
      // Note: Currently storing primary service only. Multiple services stored in notes.
      // TODO: Create booking_services join table for proper multi-service support
      const bookingId = crypto.randomUUID();
      
      const booking = await storage.createBooking({
        salonId,
        serviceId: serviceIds[0], // Primary service (for backward compatibility)
        customerName: customerName || '',
        customerEmail,
        customerPhone: customerPhone || null,
        staffId: staffId || null,
        bookingDate: date,
        bookingTime: time,
        status: 'pending',
        totalAmountPaisa: serverTotalPrice,
        discountInPaisa: discountInPaisa,
        finalAmountPaisa: finalAmountInPaisa,
        offerId: offerId || null,
        offerSnapshot: offerSnapshot ? JSON.stringify(offerSnapshot) : null,
        paymentStatus: paymentMethod === 'pay_at_salon' ? 'pending' : 'pending',
        paymentMethod: paymentMethod || 'pay_at_salon',
        notes: serviceIds.length > 1 ? `Multiple services: ${services.map(s => s!.name).join(', ')}` : null,
        guestSessionId: isGuest ? bookingId : null
      });

      // Track offer usage if offer was applied
      if (offerId && userId !== 'guest' && discountInPaisa > 0) {
        // Get current usage count to determine usage number
        const eligibility = await storage.getUserOfferEligibility(userId, offerId);
        const usageNumber = (eligibility.usageCount || 0) + 1;
        
        await storage.trackOfferUsage(userId, offerId, booking.id, discountInPaisa, usageNumber);
        console.log(`✅ Offer usage tracked: user ${userId}, offer ${offerId}, usage #${usageNumber}`);
      }

      console.log(`✅ Booking created: ${booking.id} with ${serviceIds.length} services${offerId ? ' and offer applied' : ''}`);

      // Send booking confirmation notification (email + SMS)
      try {
        const salon = await storage.getSalon(salonId);
        const service = services[0]; // Primary service
        const staff = staffId ? await storage.getStaff(staffId) : null;
        
        await sendBookingConfirmation(
          salonId,
          booking.id,
          customerEmail,
          customerPhone || undefined,
          {
            customer_name: customerName || 'Valued Customer',
            salon_name: salon?.businessName || 'Our Salon',
            service_name: serviceIds.length > 1 
              ? `${services.map(s => s!.name).join(', ')}` 
              : service!.name,
            booking_date: date,
            booking_time: time,
            staff_name: staff?.name || 'Our Team',
            total_amount: (finalAmountInPaisa / 100).toFixed(0)
          }
        );
        console.log(`✅ Booking confirmation notification sent for booking ${booking.id}`);
      } catch (notificationError) {
        console.error('Failed to send booking confirmation notification:', notificationError);
        // Don't fail the booking if notification fails
      }

      res.json({
        success: true,
        bookingId: booking.id,
        totalPrice: serverTotalPrice,
        discountApplied: discountInPaisa,
        finalPrice: finalAmountInPaisa,
        totalDuration: serverTotalDuration,
        offerApplied: offerSnapshot,
        message: 'Booking created successfully'
      });

    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  });

  // Create payment order endpoint - SERVER-SIDE PRICE CALCULATION
  app.post('/api/create-payment-order', async (req, res) => {
    try {
      // Check if Razorpay is needed (only for "pay_now" bookings)
      if (!razorpay && req.body.booking?.paymentMethod !== 'pay_at_salon') {
        return res.status(503).json({ error: 'Payment service not configured' });
      }
      // DEBUG: Log minimal identifiers (no PII)
      console.log('Payment order request:', {
        salonId: req.body.salonId,
        serviceId: req.body.serviceId,
        bookingDate: req.body.booking?.date,
        timestamp: new Date().toISOString()
      });
      
      // Validate input using Zod schema
      const validationResult = createPaymentOrderSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log('Validation failed:', validationResult.error.issues);
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }

      const input: CreatePaymentOrderInput = validationResult.data;
      
      // Get service details from database - CRITICAL: Server-side price lookup
      const service = await storage.getService(input.serviceId);
      if (!service || !service.isActive) {
        return res.status(404).json({ error: 'Service not found or inactive' });
      }

      // CRITICAL: Ensure service belongs to the specified salon
      if (service.salonId !== input.salonId) {
        console.log(`Service-salon mismatch: service ${input.serviceId} belongs to salon ${service.salonId}, not ${input.salonId}`);
        return res.status(400).json({ error: 'Service does not belong to the specified salon' });
      }

      // CONFLICT VALIDATION: Check for overlapping bookings before creating
      let timeRange;
      try {
        timeRange = storage.computeBookingTimeRange(
          input.booking.date, 
          input.booking.time, 
          service.durationMinutes
        );
      } catch (timeError) {
        const errorMessage = timeError instanceof Error ? timeError.message : 'Invalid time format';
        console.error('Invalid booking time:', errorMessage);
        return res.status(400).json({ 
          error: 'Invalid booking time',
          details: errorMessage
        });
      }

      const { start, end } = timeRange;

      try {
        // Check for overlapping bookings (no staff ID specified yet, so check all)
        const overlappingBookings = await storage.findOverlappingBookings(
          input.salonId, 
          null, // No specific staff member yet
          start, 
          end
        );

        if (overlappingBookings.length > 0) {
          return res.status(409).json({ 
            error: 'Scheduling conflict',
            details: 'This time slot conflicts with an existing booking. Please choose a different time.'
          });
        }

        // Prevent booking in the past
        const now = new Date();
        if (start < now) {
          return res.status(400).json({ 
            error: 'Cannot book appointments in the past'
          });
        }
      } catch (conflictError) {
        console.error('Error checking booking conflicts:', conflictError);
        return res.status(500).json({ error: 'Failed to validate booking time slot' });
      }

      // OFFER VALIDATION AND DISCOUNT CALCULATION
      let offerValidation = {
        isValid: false,
        discountAmount: 0,
        finalAmount: service.priceInPaisa,
        cashbackAmount: 0,
        offer: null as any
      };

      const userId = (req as any).session?.userId;
      
      if (input.booking.offerId) {
        console.log(`Validating offer ${input.booking.offerId} for booking`);
        offerValidation = await validateAndCalculateOffer(
          input.booking.offerId,
          userId,
          service.priceInPaisa,
          input.salonId
        );

        if (!offerValidation.isValid) {
          console.log(`Offer validation failed: ${offerValidation.reason}`);
          return res.status(400).json({ 
            error: 'Offer validation failed',
            details: offerValidation.reason || 'Invalid offer'
          });
        }

        console.log(`✅ Offer validated: ${offerValidation.discountAmount} paisa discount applied`);
      }

      // Create booking record BEFORE payment - ensures we have a record
      const tCreateBooking0 = Date.now();
      const booking = await storage.createBooking({
        salonId: input.salonId,
        serviceId: input.serviceId,
        userId: userId || null, // Link to authenticated user (null for guests)
        customerName: input.booking.customer.name || '', // Empty string for guest bookings
        customerEmail: input.booking.customer.email,
        customerPhone: input.booking.customer.phone || '', // Empty string for guest bookings
        bookingDate: input.booking.date,
        bookingTime: input.booking.time,
        status: input.booking.paymentMethod === 'pay_at_salon' ? 'confirmed' : 'pending',
        totalAmountPaisa: offerValidation.finalAmount, // Use discounted amount
        currency: service.currency,
        paymentMethod: input.booking.paymentMethod || 'pay_now', // Include payment method
        notes: input.booking.notes,
        guestSessionId: userId ? null : (input.booking.guestSessionId || null), // Only use guest session for non-authenticated users
        // Offer-related fields
        offerId: input.booking.offerId || null,
        originalAmountPaisa: input.booking.offerId ? service.priceInPaisa : null,
        discountAmountPaisa: input.booking.offerId ? offerValidation.discountAmount : null,
        finalAmountPaisa: input.booking.offerId ? offerValidation.finalAmount : null,
      });
      const tCreateBooking1 = Date.now();
      console.log(`[perf] createBooking took ${tCreateBooking1 - tCreateBooking0}ms (bookingId=${booking.id})`);

      // Auto-send booking confirmation if customer opted in
      try {
        const salon = await storage.getSalon(input.salonId);
        const variables = {
          customer_name: booking.customerName || 'Valued Customer',
          salon_name: salon?.name || 'Your Salon',
          service_name: service.name,
          booking_date: new Date(booking.bookingDate).toLocaleDateString(),
          booking_time: booking.bookingTime,
          staff_name: 'Our team'
        };
        
        // Send booking confirmation immediately  
        await sendBookingConfirmation(
          booking.salonId,
          booking.id,
          booking.customerEmail,
          booking.customerPhone || undefined,
          variables
        );
      } catch (commError) {
        console.error('Error sending booking confirmation:', commError);
        // Don't fail the booking creation if communication fails
      }

      // Handle different payment methods
      if (input.booking.paymentMethod === 'pay_at_salon') {
        // For "pay at salon", no immediate payment processing needed
        // Just return booking confirmation details
        res.json({
          booking_id: booking.id,
          payment_method: 'pay_at_salon',
          amount: offerValidation.finalAmount,
          original_amount: input.booking.offerId ? service.priceInPaisa : undefined,
          discount: input.booking.offerId ? offerValidation.discountAmount : undefined,
          currency: service.currency,
          status: 'confirmed'
        });
      } else {
        // Handle "pay now" with Razorpay
        // Create payment record
        const tCreatePayment0 = Date.now();
        const payment = await storage.createPayment({
          bookingId: booking.id,
          amountPaisa: offerValidation.finalAmount, // Use discounted amount
          currency: service.currency,
          status: 'pending',
          razorpayOrderId: null,
          razorpayPaymentId: null,
          razorpaySignature: null
        });
        const tCreatePayment1 = Date.now();
        console.log(`[perf] createPayment took ${tCreatePayment1 - tCreatePayment0}ms (paymentId=${payment.id})`);

        // Create Razorpay order
        const razorpayOrderOptions = {
          amount: offerValidation.finalAmount, // Use discounted amount - SERVER CONTROLLED
          currency: service.currency,
          receipt: `bk_${Date.now()}`, // Use timestamp to fit 40 char limit
          notes: {
            booking_id: booking.id,
            payment_id: payment.id,
            service_name: service.name,
            customer_email: input.booking.customer.email,
            offer_id: input.booking.offerId || '',
            discount: offerValidation.discountAmount || 0
          }
        };

        if (!razorpay) {
          return res.status(503).json({ error: 'Payment service not configured' });
        }
        
        const tRz0 = Date.now();
        const order = await razorpay.orders.create(razorpayOrderOptions);
        const tRz1 = Date.now();
        console.log(`[perf] razorpay.orders.create took ${tRz1 - tRz0}ms (orderId=${order.id})`);
        
        // Update payment with Razorpay order ID
        const tUpdatePayment0 = Date.now();
        await storage.updatePaymentOrderId(payment.id, order.id);
        const tUpdatePayment1 = Date.now();
        console.log(`[perf] updatePaymentOrderId took ${tUpdatePayment1 - tUpdatePayment0}ms (paymentId=${payment.id})`);

        res.json({
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          booking_id: booking.id,
          payment_id: payment.id
        });
      }
    } catch (error) {
      console.error('Error creating payment order:', error);
      res.status(500).json({ error: 'Failed to create payment order' });
    }
  });

  // Verify payment endpoint - COMPREHENSIVE VERIFICATION
  app.post('/api/verify-payment', async (req, res) => {
    try {
      if (!razorpay) {
        return res.status(503).json({ error: 'Payment service not configured' });
      }
      // Validate input using Zod schema
      const validationResult = verifyPaymentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }

      const input: VerifyPaymentInput = validationResult.data;

      // Find payment record by Razorpay order ID
      const payment = await storage.getPaymentByRazorpayOrderId(input.razorpay_order_id);
      
      if (!payment) {
        return res.status(404).json({ error: 'Payment record not found' });
      }

      // Check if payment already processed (idempotency)
      if (payment.status === 'completed') {
        return res.json({ 
          success: true,
          message: 'Payment already verified',
          payment_id: payment.razorpayPaymentId
        });
      }

      // Verify signature - CRITICAL SECURITY CHECK
      const body = input.razorpay_order_id + '|' + input.razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== input.razorpay_signature) {
        await storage.updatePaymentStatus(payment.id, 'failed');
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid payment signature' 
        });
      }

      // ADDITIONAL VERIFICATION: Fetch payment from Razorpay API
      try {
        const razorpayPayment = await razorpay.payments.fetch(input.razorpay_payment_id);
        
        // Verify payment details match our records
        if (razorpayPayment.order_id !== input.razorpay_order_id) {
          await storage.updatePaymentStatus(payment.id, 'failed');
          return res.status(400).json({ error: 'Payment order mismatch' });
        }

        if (razorpayPayment.amount !== payment.amountPaisa) {
          await storage.updatePaymentStatus(payment.id, 'failed');
          return res.status(400).json({ error: 'Payment amount mismatch' });
        }

        if (razorpayPayment.currency !== payment.currency) {
          await storage.updatePaymentStatus(payment.id, 'failed');
          return res.status(400).json({ error: 'Payment currency mismatch' });
        }

        if (razorpayPayment.status !== 'captured') {
          await storage.updatePaymentStatus(payment.id, 'failed');
          return res.status(400).json({ error: 'Payment not captured' });
        }
      } catch (razorpayError) {
        console.error('Error fetching payment from Razorpay:', razorpayError);
        await storage.updatePaymentStatus(payment.id, 'failed');
        return res.status(400).json({ error: 'Failed to verify payment with Razorpay' });
      }

      // Payment verified successfully - Update records
      await storage.updatePaymentDetails(
        payment.id, 
        input.razorpay_payment_id, 
        input.razorpay_signature
      );
      await storage.updatePaymentStatus(payment.id, 'completed', new Date());
      
      // Update booking status
      await storage.updateBookingStatus(payment.bookingId, 'confirmed');

      // Schedule booking reminders when payment is confirmed
      try {
        await schedulingService.scheduleBookingReminders(payment.bookingId);
      } catch (scheduleError) {
        console.error('Error scheduling booking reminders:', scheduleError);
        // Don't fail payment verification if scheduling fails
      }

      console.log('Payment verified successfully:', {
        payment_id: payment.id,
        booking_id: payment.bookingId,
        razorpay_payment_id: input.razorpay_payment_id,
        amount: payment.amountPaisa
      });
      
      res.json({ 
        success: true,
        message: 'Payment verified successfully',
        payment_id: input.razorpay_payment_id,
        booking_id: payment.bookingId
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({ error: 'Payment verification failed' });
    }
  });

  // Calendar Management Routes - Protected by authentication
  
  // Staff management - requires salon management access
  // PUBLIC: Get salon staff for customer viewing (no auth required)
  app.get('/api/salons/:salonId/staff', async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const staff = await storage.getStaffBySalonId(salonId);
      res.json(staff);
    } catch (error) {
      console.error('Error fetching staff:', error);
      res.status(500).json({ error: 'Failed to fetch staff' });
    }
  });

  // PROTECTED: Get salon staff for business management
  app.get('/api/salons/:salonId/staff/manage', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const staff = await storage.getStaffBySalonId(salonId);
      res.json(staff);
    } catch (error) {
      console.error('Error fetching staff:', error);
      res.status(500).json({ error: 'Failed to fetch staff' });
    }
  });

  // PROTECTED: Get intelligent role suggestions based on salon's services
  app.get('/api/salons/:salonId/suggested-roles', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      // Get all active services for this salon
      const services = await storage.getServicesBySalonId(salonId);
      const activeServices = services.filter(s => s.isActive === 1);
      
      // Use the intelligent mapping to get suggested roles
      const { getSuggestedRolesFromServices } = await import('../shared/service-role-mapping.js');
      const suggestedRoles = getSuggestedRolesFromServices(activeServices);
      
      res.json({
        suggestedRoles,
        totalServices: activeServices.length,
        message: activeServices.length === 0 
          ? 'Add services first to get intelligent role suggestions' 
          : `Found ${suggestedRoles.length} suggested role${suggestedRoles.length !== 1 ? 's' : ''} based on your ${activeServices.length} service${activeServices.length !== 1 ? 's' : ''}`
      });
    } catch (error) {
      console.error('Error getting suggested roles:', error);
      res.status(500).json({ error: 'Failed to get suggested roles' });
    }
  });

  app.post('/api/salons/:salonId/staff', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const staffData = { ...req.body, salonId };
      const newStaff = await storage.createStaff(staffData);
      res.status(201).json(newStaff);
    } catch (error) {
      console.error('Error creating staff:', error);
      res.status(500).json({ error: 'Failed to create staff member' });
    }
  });

  app.put('/api/salons/:salonId/staff/:staffId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { staffId, salonId } = req.params;
      
      // Verify the staff member belongs to this salon
      const existingStaff = await storage.getStaff(staffId);
      if (!existingStaff) {
        return res.status(404).json({ error: 'Staff member not found' });
      }
      if (existingStaff.salonId !== salonId) {
        return res.status(403).json({ error: 'Staff member does not belong to this salon' });
      }
      
      // Filter out fields that shouldn't be updated
      const { id, createdAt, salonId: _, orgId, ...updateData } = req.body;
      
      // Update the staff member with filtered data
      await storage.updateStaff(staffId, updateData);
      
      // Fetch and return the updated staff member
      const updatedStaff = await storage.getStaff(staffId);
      res.json(updatedStaff);
    } catch (error) {
      console.error('Error updating staff:', error);
      res.status(500).json({ error: 'Failed to update staff member' });
    }
  });

  // Availability patterns management - requires salon management access
  app.get('/api/salons/:salonId/availability-patterns', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const patterns = await storage.getAvailabilityPatternsBySalonId(salonId);
      res.json(patterns);
    } catch (error) {
      console.error('Error fetching availability patterns:', error);
      res.status(500).json({ error: 'Failed to fetch availability patterns' });
    }
  });

  app.post('/api/salons/:salonId/availability-patterns', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const patternData = { ...req.body, salonId };
      const newPattern = await storage.createAvailabilityPattern(patternData);
      
      // Generate slots for the next 90 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);
      
      await storage.generateTimeSlotsFromPattern(newPattern.id, startDate, endDate);
      
      res.status(201).json(newPattern);
    } catch (error) {
      console.error('Error creating availability pattern:', error);
      res.status(500).json({ error: 'Failed to create availability pattern' });
    }
  });

  app.put('/api/availability-patterns/:patternId', isAuthenticated, async (req: any, res) => {
    try {
      const { patternId } = req.params;
      
      // Check authorization - user must have access to the salon this pattern belongs to
      const pattern = await storage.getAvailabilityPattern(patternId);
      if (!pattern) {
        return res.status(404).json({ error: 'Availability pattern not found' });
      }
      
      const salon = await storage.getSalonById(pattern.salonId);
      if (!salon) {
        return res.status(404).json({ error: 'Salon not found' });
      }
      
      const hasAccess = req.user?.orgMemberships?.some((membership: any) => 
        membership.orgId === salon.orgId && 
        ['owner', 'manager'].includes(membership.orgRole)
      );
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this salon' });
      }
      
      await storage.updateAvailabilityPattern(patternId, req.body);
      
      // Regenerate slots for this pattern
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);
      
      await storage.generateTimeSlotsFromPattern(patternId, startDate, endDate);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating availability pattern:', error);
      res.status(500).json({ error: 'Failed to update availability pattern' });
    }
  });

  app.delete('/api/availability-patterns/:patternId', isAuthenticated, async (req: any, res) => {
    try {
      const { patternId } = req.params;
      
      // Check authorization - user must have access to the salon this pattern belongs to
      const pattern = await storage.getAvailabilityPattern(patternId);
      if (!pattern) {
        return res.status(404).json({ error: 'Availability pattern not found' });
      }
      
      const salon = await storage.getSalonById(pattern.salonId);
      if (!salon) {
        return res.status(404).json({ error: 'Salon not found' });
      }
      
      const hasAccess = req.user?.orgMemberships?.some((membership: any) => 
        membership.orgId === salon.orgId && 
        ['owner', 'manager'].includes(membership.orgRole)
      );
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this salon' });
      }
      
      await storage.deleteAvailabilityPattern(patternId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting availability pattern:', error);
      res.status(500).json({ error: 'Failed to delete availability pattern' });
    }
  });

  // Time slots and availability - different access levels
  // Available slots - public read access for customers booking appointments
  app.get('/api/salons/:salonId/available-slots', async (req, res) => {
    try {
      const { salonId } = req.params;
      const { date, staffId } = req.query;
      
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ error: 'Date parameter is required' });
      }
      
      const availableSlots = await storage.getAvailableTimeSlots(
        salonId, 
        date, 
        staffId as string | undefined
      );
      
      res.json(availableSlots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      res.status(500).json({ error: 'Failed to fetch available slots' });
    }
  });

  // Time slots management - requires salon access
  app.get('/api/salons/:salonId/time-slots', isAuthenticated, requireSalonAccess(['owner', 'manager', 'staff']), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
        return res.status(400).json({ error: 'startDate and endDate parameters are required' });
      }
      
      const timeSlots = await storage.getTimeSlotsByDateRange(salonId, startDate, endDate);
      res.json(timeSlots);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      res.status(500).json({ error: 'Failed to fetch time slots' });
    }
  });

  // Block/unblock time slots - requires staff access or management access
  app.post('/api/time-slots/:slotId/block', isAuthenticated, async (req: any, res) => {
    try {
      const { slotId } = req.params;
      
      // Get slot details to verify access
      const slot = await storage.getTimeSlot(slotId);
      if (!slot) {
        return res.status(404).json({ error: 'Time slot not found' });
      }
      
      const salon = await storage.getSalonById(slot.salonId);
      if (!salon) {
        return res.status(404).json({ error: 'Salon not found' });
      }
      
      // Check if user has management access or is staff for this salon
      const hasManagementAccess = req.user?.orgMemberships?.some((membership: any) => 
        membership.orgId === salon.orgId && 
        ['owner', 'manager'].includes(membership.orgRole)
      );
      
      const isStaff = await storage.isUserStaffOfSalon(req.user!.id, slot.salonId);
      
      if (!hasManagementAccess && !isStaff) {
        return res.status(403).json({ error: 'Access denied to manage this time slot' });
      }
      
      await storage.blockTimeSlot(slotId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error blocking time slot:', error);
      res.status(500).json({ error: 'Failed to block time slot' });
    }
  });

  app.post('/api/time-slots/:slotId/unblock', isAuthenticated, async (req: any, res) => {
    try {
      const { slotId } = req.params;
      
      // Get slot details to verify access
      const slot = await storage.getTimeSlot(slotId);
      if (!slot) {
        return res.status(404).json({ error: 'Time slot not found' });
      }
      
      const salon = await storage.getSalonById(slot.salonId);
      if (!salon) {
        return res.status(404).json({ error: 'Salon not found' });
      }
      
      // Check if user has management access or is staff for this salon
      const hasManagementAccess = req.user?.orgMemberships?.some((membership: any) => 
        membership.orgId === salon.orgId && 
        ['owner', 'manager'].includes(membership.orgRole)
      );
      
      const isStaff = await storage.isUserStaffOfSalon(req.user!.id, slot.salonId);
      
      if (!hasManagementAccess && !isStaff) {
        return res.status(403).json({ error: 'Access denied to manage this time slot' });
      }
      
      await storage.unblockTimeSlot(slotId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error unblocking time slot:', error);
      res.status(500).json({ error: 'Failed to unblock time slot' });
    }
  });

  // Regenerate availability for a salon - requires management access
  app.post('/api/salons/:salonId/regenerate-availability', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { startDate: startDateStr, endDate: endDateStr } = req.body;
      
      const startDate = startDateStr ? new Date(startDateStr) : new Date();
      const endDate = endDateStr ? new Date(endDateStr) : (() => {
        const date = new Date();
        date.setDate(date.getDate() + 90);
        return date;
      })();
      
      await storage.regenerateTimeSlotsForSalon(salonId, startDate, endDate);
      
      res.json({ 
        success: true, 
        message: 'Availability regenerated successfully',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
    } catch (error) {
      console.error('Error regenerating availability:', error);
      res.status(500).json({ error: 'Failed to regenerate availability' });
    }
  });

  // ==========================================
  // BUSINESS PROFILE SETUP API ENDPOINTS
  // ==========================================
  
  // Booking Settings Management
  app.get('/api/salons/:salonId/booking-settings', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const settings = await storage.getBookingSettings(salonId);
      res.json(settings);
    } catch (error) {
      console.error('Error fetching booking settings:', error);
      res.status(500).json({ error: 'Failed to fetch booking settings' });
    }
  });
  
  app.post('/api/salons/:salonId/booking-settings', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      // Validate input using Zod schema
      const validationResult = insertBookingSettingsSchema.safeParse({ ...req.body, salonId });
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      // Check if booking settings already exist (upsert logic)
      const existingSettings = await storage.getBookingSettings(salonId);
      if (existingSettings) {
        await storage.updateBookingSettings(salonId, validationResult.data);
        const updatedSettings = await storage.getBookingSettings(salonId);
        return res.json(updatedSettings);
      }
      
      const newSettings = await storage.createBookingSettings(validationResult.data);
      res.status(201).json(newSettings);
    } catch (error) {
      console.error('Error creating booking settings:', error);
      res.status(500).json({ error: 'Failed to create booking settings' });
    }
  });
  
  app.put('/api/salons/:salonId/booking-settings', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      // Validate input using Zod schema (partial updates allowed)
      const partialSchema = insertBookingSettingsSchema.omit({ salonId: true }).partial();
      const validationResult = partialSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      // Check if booking settings exist
      const existingSettings = await storage.getBookingSettings(salonId);
      if (!existingSettings) {
        return res.status(404).json({ error: 'Booking settings not found' });
      }
      
      await storage.updateBookingSettings(salonId, validationResult.data);
      const updatedSettings = await storage.getBookingSettings(salonId);
      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating booking settings:', error);
      res.status(500).json({ error: 'Failed to update booking settings' });
    }
  });

  // Resources Management (chairs, rooms, equipment)
  app.get('/api/salons/:salonId/resources', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const resources = await storage.getResourcesBySalonId(salonId);
      res.json(resources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      res.status(500).json({ error: 'Failed to fetch resources' });
    }
  });
  
  app.post('/api/salons/:salonId/resources', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      // Validate input using Zod schema
      const validationResult = insertResourceSchema.safeParse({ ...req.body, salonId });
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      const newResource = await storage.createResource(validationResult.data);
      res.status(201).json(newResource);
    } catch (error) {
      console.error('Error creating resource:', error);
      res.status(500).json({ error: 'Failed to create resource' });
    }
  });
  
  app.put('/api/salons/:salonId/resources/:resourceId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, resourceId } = req.params;
      
      // Validate input using Zod schema (partial updates allowed)
      const partialSchema = insertResourceSchema.omit({ salonId: true }).partial();
      const validationResult = partialSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      // Check if resource exists and belongs to salon
      const existingResource = await storage.getResource(resourceId);
      if (!existingResource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      if (existingResource.salonId !== salonId) {
        return res.status(403).json({ error: 'Resource does not belong to this salon' });
      }
      
      await storage.updateResource(resourceId, salonId, validationResult.data);
      const updatedResource = await storage.getResource(resourceId);
      res.json(updatedResource);
    } catch (error) {
      console.error('Error updating resource:', error);
      res.status(500).json({ error: 'Failed to update resource' });
    }
  });
  
  app.delete('/api/salons/:salonId/resources/:resourceId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, resourceId } = req.params;
      await storage.deleteResource(resourceId, salonId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting resource:', error);
      res.status(500).json({ error: 'Failed to delete resource' });
    }
  });

  // Staff-Service Mappings Management
  app.get('/api/salons/:salonId/staff-services', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { staffId, serviceId } = req.query;
      
      if (staffId && serviceId) {
        const staffService = await storage.getStaffService(staffId as string, serviceId as string);
        res.json(staffService);
      } else {
        const staffServices = await storage.getStaffServicesBySalonId(salonId);
        res.json(staffServices);
      }
    } catch (error) {
      console.error('Error fetching staff services:', error);
      res.status(500).json({ error: 'Failed to fetch staff services' });
    }
  });
  
  app.post('/api/salons/:salonId/staff-services', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      // Validate input using Zod schema
      const validationResult = insertStaffServiceSchema.safeParse({ ...req.body, salonId });
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      const newStaffService = await storage.createStaffService(validationResult.data);
      res.status(201).json(newStaffService);
    } catch (error) {
      console.error('Error creating staff service:', error);
      res.status(500).json({ error: 'Failed to create staff service' });
    }
  });
  
  app.put('/api/salons/:salonId/staff-services/:staffId/:serviceId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { staffId, serviceId } = req.params;
      await storage.updateStaffService(staffId, serviceId, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating staff service:', error);
      res.status(500).json({ error: 'Failed to update staff service' });
    }
  });
  
  app.delete('/api/salons/:salonId/staff-services/:staffId/:serviceId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { staffId, serviceId } = req.params;
      await storage.deleteStaffService(staffId, serviceId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting staff service:', error);
      res.status(500).json({ error: 'Failed to delete staff service' });
    }
  });

  // Service-Resource Mappings Management  
  app.get('/api/salons/:salonId/service-resources', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { serviceId, resourceId } = req.query;
      
      if (serviceId && resourceId) {
        const serviceResource = await storage.getServiceResource(serviceId as string, resourceId as string);
        res.json(serviceResource);
      } else {
        const serviceResources = await storage.getServiceResourcesBySalonId(salonId);
        res.json(serviceResources);
      }
    } catch (error) {
      console.error('Error fetching service resources:', error);
      res.status(500).json({ error: 'Failed to fetch service resources' });
    }
  });
  
  app.post('/api/salons/:salonId/service-resources', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      // Validate input using Zod schema
      const validationResult = insertServiceResourceSchema.safeParse({ ...req.body, salonId });
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      const newServiceResource = await storage.createServiceResource(validationResult.data);
      res.status(201).json(newServiceResource);
    } catch (error) {
      console.error('Error creating service resource:', error);
      res.status(500).json({ error: 'Failed to create service resource' });
    }
  });
  
  app.put('/api/salons/:salonId/service-resources/:serviceId/:resourceId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { serviceId, resourceId } = req.params;
      await storage.updateServiceResource(serviceId, resourceId, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating service resource:', error);
      res.status(500).json({ error: 'Failed to update service resource' });
    }
  });
  
  app.delete('/api/salons/:salonId/service-resources/:serviceId/:resourceId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { serviceId, resourceId } = req.params;
      await storage.deleteServiceResource(serviceId, resourceId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting service resource:', error);
      res.status(500).json({ error: 'Failed to delete service resource' });
    }
  });

  // Media Assets Management
  // PUBLIC: Get salon media assets for customer viewing (no auth required)
  app.get('/api/salons/:salonId/media-assets', async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { assetType } = req.query;
      
      if (assetType) {
        const assets = await storage.getMediaAssetsByType(salonId, assetType as string);
        res.json(assets);
      } else {
        const assets = await storage.getMediaAssetsBySalonId(salonId);
        res.json(assets);
      }
    } catch (error) {
      console.error('Error fetching media assets:', error);
      res.status(500).json({ error: 'Failed to fetch media assets' });
    }
  });

  // PROTECTED: Get salon media assets for business management
  app.get('/api/salons/:salonId/media-assets/manage', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { assetType } = req.query;
      
      if (assetType) {
        const assets = await storage.getMediaAssetsByType(salonId, assetType as string);
        res.json(assets);
      } else {
        const assets = await storage.getMediaAssetsBySalonId(salonId);
        res.json(assets);
      }
    } catch (error) {
      console.error('Error fetching media assets:', error);
      res.status(500).json({ error: 'Failed to fetch media assets' });
    }
  });
  
  app.post('/api/salons/:salonId/media-assets', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      // Validate input using Zod schema
      const validationResult = insertMediaAssetSchema.safeParse({ ...req.body, salonId });
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      const newAsset = await storage.createMediaAsset(validationResult.data);
      res.status(201).json(newAsset);
    } catch (error) {
      console.error('Error creating media asset:', error);
      res.status(500).json({ error: 'Failed to create media asset' });
    }
  });
  
  app.put('/api/salons/:salonId/media-assets/:assetId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, assetId } = req.params;
      await storage.updateMediaAsset(assetId, salonId, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating media asset:', error);
      res.status(500).json({ error: 'Failed to update media asset' });
    }
  });
  
  app.delete('/api/salons/:salonId/media-assets/:assetId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, assetId } = req.params;
      await storage.deleteMediaAsset(assetId, salonId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting media asset:', error);
      res.status(500).json({ error: 'Failed to delete media asset' });
    }
  });

  // Set primary media asset endpoint
  app.put('/api/salons/:salonId/media-assets/:mediaId/set-primary', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, mediaId } = req.params;
      
      // Validate parameters
      if (!salonId || !mediaId) {
        return res.status(400).json({ error: 'Salon ID and Media ID are required' });
      }
      
      // Check if the media asset exists before setting as primary
      const existingAsset = await storage.getMediaAsset(mediaId);
      if (!existingAsset) {
        return res.status(404).json({ error: 'Media asset not found' });
      }
      
      // Verify the asset belongs to the salon
      if (existingAsset.salonId !== salonId) {
        return res.status(403).json({ error: 'Media asset does not belong to this salon' });
      }
      
      // Set as primary media asset (this also handles single-primary constraint)
      const updatedAsset = await storage.setPrimaryMediaAsset(salonId, mediaId);
      
      res.json(updatedAsset);
    } catch (error) {
      console.error('Error setting primary media asset:', error);
      if (error instanceof Error && error.message === 'Media asset not found') {
        return res.status(404).json({ error: 'Media asset not found' });
      }
      res.status(500).json({ error: 'Failed to set primary media asset' });
    }
  });

  // Tax Rates Management
  app.get('/api/salons/:salonId/tax-rates', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const taxRates = await storage.getTaxRatesBySalonId(salonId);
      res.json(taxRates);
    } catch (error) {
      console.error('Error fetching tax rates:', error);
      res.status(500).json({ error: 'Failed to fetch tax rates' });
    }
  });
  
  app.post('/api/salons/:salonId/tax-rates', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      // Validate input using Zod schema
      const validationResult = insertTaxRateSchema.safeParse({ ...req.body, salonId });
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      const newTaxRate = await storage.createTaxRate(validationResult.data);
      res.status(201).json(newTaxRate);
    } catch (error) {
      console.error('Error creating tax rate:', error);
      res.status(500).json({ error: 'Failed to create tax rate' });
    }
  });
  
  app.put('/api/salons/:salonId/tax-rates/:taxRateId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, taxRateId } = req.params;
      
      // Validate input using Zod schema (partial updates allowed)
      const partialSchema = insertTaxRateSchema.omit({ salonId: true }).partial();
      const validationResult = partialSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      // Check if tax rate exists and belongs to salon
      const existingTaxRate = await storage.getTaxRate(taxRateId);
      if (!existingTaxRate) {
        return res.status(404).json({ error: 'Tax rate not found' });
      }
      if (existingTaxRate.salonId !== salonId) {
        return res.status(403).json({ error: 'Tax rate does not belong to this salon' });
      }
      
      await storage.updateTaxRate(taxRateId, salonId, validationResult.data);
      const updatedTaxRate = await storage.getTaxRate(taxRateId);
      res.json(updatedTaxRate);
    } catch (error) {
      console.error('Error updating tax rate:', error);
      res.status(500).json({ error: 'Failed to update tax rate' });
    }
  });
  
  app.post('/api/salons/:salonId/tax-rates/:taxRateId/set-default', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, taxRateId } = req.params;
      await storage.setDefaultTaxRate(salonId, taxRateId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error setting default tax rate:', error);
      res.status(500).json({ error: 'Failed to set default tax rate' });
    }
  });
  
  app.delete('/api/salons/:salonId/tax-rates/:taxRateId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, taxRateId } = req.params;
      
      // Check if tax rate exists and belongs to salon
      const existingTaxRate = await storage.getTaxRate(taxRateId);
      if (!existingTaxRate) {
        return res.status(404).json({ error: 'Tax rate not found' });
      }
      if (existingTaxRate.salonId !== salonId) {
        return res.status(403).json({ error: 'Tax rate does not belong to this salon' });
      }
      
      await storage.deleteTaxRate(taxRateId, salonId);
      res.json({ success: true, message: 'Tax rate deleted successfully' });
    } catch (error) {
      console.error('Error deleting tax rate:', error);
      res.status(500).json({ error: 'Failed to delete tax rate' });
    }
  });

  // Payout Accounts Management
  app.get('/api/salons/:salonId/payout-accounts', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const accounts = await storage.getPayoutAccountsBySalonId(salonId);
      res.json(accounts);
    } catch (error) {
      console.error('Error fetching payout accounts:', error);
      res.status(500).json({ error: 'Failed to fetch payout accounts' });
    }
  });
  
  app.post('/api/salons/:salonId/payout-accounts', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      // Validate input using Zod schema
      const validationResult = insertPayoutAccountSchema.safeParse({ ...req.body, salonId });
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      const newAccount = await storage.createPayoutAccount(validationResult.data);
      res.status(201).json(newAccount);
    } catch (error) {
      console.error('Error creating payout account:', error);
      res.status(500).json({ error: 'Failed to create payout account' });
    }
  });
  
  app.put('/api/salons/:salonId/payout-accounts/:accountId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, accountId } = req.params;
      await storage.updatePayoutAccount(accountId, salonId, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating payout account:', error);
      res.status(500).json({ error: 'Failed to update payout account' });
    }
  });
  
  app.post('/api/salons/:salonId/payout-accounts/:accountId/set-default', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, accountId } = req.params;
      await storage.setDefaultPayoutAccount(salonId, accountId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error setting default payout account:', error);
      res.status(500).json({ error: 'Failed to set default payout account' });
    }
  });
  
  app.delete('/api/salons/:salonId/payout-accounts/:accountId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, accountId } = req.params;
      await storage.deletePayoutAccount(accountId, salonId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting payout account:', error);
      res.status(500).json({ error: 'Failed to delete payout account' });
    }
  });

  // Publish State Management
  app.get('/api/salons/:salonId/publish-state', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const state = await storage.getPublishState(salonId);
      if (!state) {
        return res.status(404).json({ error: 'Publish state not found' });
      }
      res.json(state);
    } catch (error) {
      console.error('Error fetching publish state:', error);
      res.status(500).json({ error: 'Failed to fetch publish state' });
    }
  });
  
  app.post('/api/salons/:salonId/publish-state', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      // Validate input using Zod schema
      const validationResult = insertPublishStateSchema.safeParse({ ...req.body, salonId });
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      // Check if publish state already exists (upsert logic)
      const existingState = await storage.getPublishState(salonId);
      if (existingState) {
        await storage.updatePublishState(salonId, validationResult.data);
        const updatedState = await storage.getPublishState(salonId);
        return res.json(updatedState);
      }
      
      const newState = await storage.createPublishState(validationResult.data);
      res.status(201).json(newState);
    } catch (error) {
      console.error('Error creating publish state:', error);
      res.status(500).json({ error: 'Failed to create publish state' });
    }
  });
  
  app.put('/api/salons/:salonId/publish-state', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      // Validate input using Zod schema (partial updates allowed)
      const partialSchema = insertPublishStateSchema.omit({ salonId: true }).partial();
      const validationResult = partialSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      // Check if publish state exists
      const existingState = await storage.getPublishState(salonId);
      if (!existingState) {
        return res.status(404).json({ error: 'Publish state not found' });
      }
      
      await storage.updatePublishState(salonId, validationResult.data);
      const updatedState = await storage.getPublishState(salonId);
      res.json(updatedState);
    } catch (error) {
      console.error('Error updating publish state:', error);
      res.status(500).json({ error: 'Failed to update publish state' });
    }
  });

  // Dashboard Completion Status
  app.get('/api/salons/:salonId/dashboard-completion', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const completion = await storage.checkDashboardCompletion(salonId);
      console.log('📊 Dashboard Completion Debug:', JSON.stringify(completion, null, 2));
      res.json(completion);
    } catch (error) {
      console.error('Error fetching dashboard completion:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard completion status' });
    }
  });

  // ===============================================
  // FINANCIAL REPORTING SYSTEM API ENDPOINTS
  // ===============================================

  // Expense Category Endpoints
  app.get('/api/salons/:salonId/expense-categories', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const categories = await storage.getExpenseCategoriesBySalonId(salonId);
      res.json(categories);
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      res.status(500).json({ error: 'Failed to fetch expense categories' });
    }
  });

  app.post('/api/salons/:salonId/expense-categories', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const validationResult = insertExpenseCategorySchema.safeParse({ ...req.body, salonId });
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      const category = await storage.createExpenseCategory(validationResult.data);
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating expense category:', error);
      res.status(500).json({ error: 'Failed to create expense category' });
    }
  });

  app.put('/api/salons/:salonId/expense-categories/:categoryId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, categoryId } = req.params;
      const partialSchema = insertExpenseCategorySchema.omit({ salonId: true }).partial();
      const validationResult = partialSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      await storage.updateExpenseCategory(categoryId, salonId, validationResult.data);
      const updatedCategory = await storage.getExpenseCategory(categoryId);
      res.json(updatedCategory);
    } catch (error) {
      console.error('Error updating expense category:', error);
      res.status(500).json({ error: 'Failed to update expense category' });
    }
  });

  app.delete('/api/salons/:salonId/expense-categories/:categoryId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, categoryId } = req.params;
      await storage.deleteExpenseCategory(categoryId, salonId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting expense category:', error);
      res.status(500).json({ error: 'Failed to delete expense category' });
    }
  });

  app.post('/api/salons/:salonId/expense-categories/default', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const categories = await storage.createDefaultExpenseCategories(salonId);
      res.status(201).json(categories);
    } catch (error) {
      console.error('Error creating default expense categories:', error);
      res.status(500).json({ error: 'Failed to create default expense categories' });
    }
  });

  // Expense Endpoints
  app.get('/api/salons/:salonId/expenses', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { categoryId, status, startDate, endDate, createdBy } = req.query;
      const filters = {
        categoryId: categoryId as string,
        status: status as string,
        startDate: startDate as string,
        endDate: endDate as string,
        createdBy: createdBy as string,
      };
      
      const expenses = await storage.getExpensesBySalonId(salonId, filters);
      res.json(expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({ error: 'Failed to fetch expenses' });
    }
  });

  app.post('/api/salons/:salonId/expenses', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const validationResult = insertExpenseSchema.safeParse({ 
        ...req.body, 
        salonId,
        createdBy: req.user.id 
      });
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      const expense = await storage.createExpense(validationResult.data);
      res.status(201).json(expense);
    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({ error: 'Failed to create expense' });
    }
  });

  app.put('/api/salons/:salonId/expenses/:expenseId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, expenseId } = req.params;
      const partialSchema = insertExpenseSchema.omit({ salonId: true, createdBy: true }).partial();
      const validationResult = partialSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      await storage.updateExpense(expenseId, salonId, validationResult.data);
      const updatedExpense = await storage.getExpense(expenseId);
      res.json(updatedExpense);
    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(500).json({ error: 'Failed to update expense' });
    }
  });

  app.post('/api/salons/:salonId/expenses/:expenseId/approve', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, expenseId } = req.params;
      await storage.approveExpense(expenseId, req.user.id);
      const updatedExpense = await storage.getExpense(expenseId);
      res.json(updatedExpense);
    } catch (error) {
      console.error('Error approving expense:', error);
      res.status(500).json({ error: 'Failed to approve expense' });
    }
  });

  app.post('/api/salons/:salonId/expenses/:expenseId/reject', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, expenseId } = req.params;
      await storage.rejectExpense(expenseId, req.user.id);
      const updatedExpense = await storage.getExpense(expenseId);
      res.json(updatedExpense);
    } catch (error) {
      console.error('Error rejecting expense:', error);
      res.status(500).json({ error: 'Failed to reject expense' });
    }
  });

  app.get('/api/salons/:salonId/expenses/analytics', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { period = 'monthly' } = req.query;
      const analytics = await storage.getExpenseAnalytics(salonId, period as string);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching expense analytics:', error);
      res.status(500).json({ error: 'Failed to fetch expense analytics' });
    }
  });

  // Commission Rate Endpoints
  app.get('/api/salons/:salonId/commission-rates', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const rates = await storage.getCommissionRatesBySalonId(salonId);
      res.json(rates);
    } catch (error) {
      console.error('Error fetching commission rates:', error);
      res.status(500).json({ error: 'Failed to fetch commission rates' });
    }
  });

  app.post('/api/salons/:salonId/commission-rates', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const validationResult = insertCommissionRateSchema.safeParse({ ...req.body, salonId });
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      const rate = await storage.createCommissionRate(validationResult.data);
      res.status(201).json(rate);
    } catch (error) {
      console.error('Error creating commission rate:', error);
      res.status(500).json({ error: 'Failed to create commission rate' });
    }
  });

  app.put('/api/salons/:salonId/commission-rates/:rateId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, rateId } = req.params;
      const partialSchema = insertCommissionRateSchema.omit({ salonId: true }).partial();
      const validationResult = partialSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      await storage.updateCommissionRate(rateId, salonId, validationResult.data);
      const updatedRate = await storage.getCommissionRate(rateId);
      res.json(updatedRate);
    } catch (error) {
      console.error('Error updating commission rate:', error);
      res.status(500).json({ error: 'Failed to update commission rate' });
    }
  });

  app.post('/api/salons/:salonId/commission-rates/:rateId/deactivate', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { rateId } = req.params;
      await storage.deactivateCommissionRate(rateId);
      const updatedRate = await storage.getCommissionRate(rateId);
      res.json(updatedRate);
    } catch (error) {
      console.error('Error deactivating commission rate:', error);
      res.status(500).json({ error: 'Failed to deactivate commission rate' });
    }
  });

  // Commission Endpoints
  app.get('/api/salons/:salonId/commissions', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { staffId, period, paymentStatus, startDate, endDate } = req.query;
      const filters = {
        staffId: staffId as string,
        period: period as string,
        paymentStatus: paymentStatus as string,
        startDate: startDate as string,
        endDate: endDate as string,
      };
      
      const commissions = await storage.getCommissionsBySalonId(salonId, filters);
      res.json(commissions);
    } catch (error) {
      console.error('Error fetching commissions:', error);
      res.status(500).json({ error: 'Failed to fetch commissions' });
    }
  });

  app.post('/api/salons/:salonId/commissions', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const validationResult = insertCommissionSchema.safeParse({ ...req.body, salonId });
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      const commission = await storage.createCommission(validationResult.data);
      res.status(201).json(commission);
    } catch (error) {
      console.error('Error creating commission:', error);
      res.status(500).json({ error: 'Failed to create commission' });
    }
  });

  app.post('/api/salons/:salonId/commissions/pay-bulk', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { commissionIds, paymentMethod, paymentReference } = req.body;
      if (!Array.isArray(commissionIds) || commissionIds.length === 0) {
        return res.status(400).json({ error: 'Commission IDs are required' });
      }
      
      const paidCount = await storage.payCommissions(
        commissionIds, 
        req.user.id, 
        paymentMethod, 
        paymentReference
      );
      res.json({ paidCount, message: `${paidCount} commissions paid successfully` });
    } catch (error) {
      console.error('Error paying commissions:', error);
      res.status(500).json({ error: 'Failed to pay commissions' });
    }
  });

  app.get('/api/salons/:salonId/commissions/analytics', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { period = 'monthly' } = req.query;
      const analytics = await storage.getCommissionAnalytics(salonId, period as string);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching commission analytics:', error);
      res.status(500).json({ error: 'Failed to fetch commission analytics' });
    }
  });

  // Budget Endpoints
  app.get('/api/salons/:salonId/budgets', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { categoryId, budgetType, isActive } = req.query;
      const filters = {
        categoryId: categoryId as string,
        budgetType: budgetType as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      };
      
      const budgets = await storage.getBudgetsBySalonId(salonId, filters);
      res.json(budgets);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      res.status(500).json({ error: 'Failed to fetch budgets' });
    }
  });

  app.post('/api/salons/:salonId/budgets', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const validationResult = insertBudgetSchema.safeParse({ 
        ...req.body, 
        salonId,
        createdBy: req.user.id 
      });
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      const budget = await storage.createBudget(validationResult.data);
      res.status(201).json(budget);
    } catch (error) {
      console.error('Error creating budget:', error);
      res.status(500).json({ error: 'Failed to create budget' });
    }
  });

  app.put('/api/salons/:salonId/budgets/:budgetId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, budgetId } = req.params;
      const partialSchema = insertBudgetSchema.omit({ salonId: true, createdBy: true }).partial();
      const validationResult = partialSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      await storage.updateBudget(budgetId, salonId, validationResult.data);
      const updatedBudget = await storage.getBudget(budgetId);
      res.json(updatedBudget);
    } catch (error) {
      console.error('Error updating budget:', error);
      res.status(500).json({ error: 'Failed to update budget' });
    }
  });

  app.get('/api/salons/:salonId/budgets/analytics', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { period = 'monthly' } = req.query;
      const analytics = await storage.getBudgetAnalytics(salonId, period as string);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching budget analytics:', error);
      res.status(500).json({ error: 'Failed to fetch budget analytics' });
    }
  });

  // Financial Analytics Endpoints
  app.get('/api/salons/:salonId/financial-analytics/kpis/:period', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, period } = req.params;
      const kpis = await storage.getFinancialKPIs(salonId, period);
      res.json(kpis);
    } catch (error) {
      console.error('Error fetching financial KPIs:', error);
      res.status(500).json({ error: 'Failed to fetch financial KPIs' });
    }
  });

  app.get('/api/salons/:salonId/financial-analytics/forecast/:months', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, months } = req.params;
      const monthsNum = parseInt(months);
      if (isNaN(monthsNum) || monthsNum < 1 || monthsNum > 24) {
        return res.status(400).json({ error: 'Months must be a number between 1 and 24' });
      }
      
      const forecast = await storage.getFinancialForecast(salonId, monthsNum);
      res.json(forecast);
    } catch (error) {
      console.error('Error fetching financial forecast:', error);
      res.status(500).json({ error: 'Failed to fetch financial forecast' });
    }
  });

  // Financial Report Endpoints
  app.get('/api/salons/:salonId/financial-reports', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { reportType, reportPeriod } = req.query;
      const filters = {
        reportType: reportType as string,
        reportPeriod: reportPeriod as string,
      };
      
      const reports = await storage.getFinancialReportsBySalonId(salonId, filters);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching financial reports:', error);
      res.status(500).json({ error: 'Failed to fetch financial reports' });
    }
  });

  app.post('/api/salons/:salonId/financial-reports', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const validationResult = insertFinancialReportSchema.safeParse({ 
        ...req.body, 
        salonId,
        generatedBy: req.user.id 
      });
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      const report = await storage.createFinancialReport(validationResult.data);
      res.status(201).json(report);
    } catch (error) {
      console.error('Error creating financial report:', error);
      res.status(500).json({ error: 'Failed to create financial report' });
    }
  });

  // P&L endpoint with query parameters (existing)
  app.get('/api/salons/:salonId/financial-reports/profit-loss', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }
      
      const plStatement = await storage.generateProfitLossStatement(
        salonId, 
        startDate as string, 
        endDate as string
      );
      res.json(plStatement);
    } catch (error) {
      console.error('Error generating P&L statement:', error);
      res.status(500).json({ error: 'Failed to generate P&L statement' });
    }
  });

  // P&L endpoint with URL parameters (for frontend compatibility)
  app.get('/api/salons/:salonId/financial-reports/profit-loss/:startDate/:endDate', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, startDate, endDate } = req.params;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }
      
      const plStatement = await storage.generateProfitLossStatement(
        salonId, 
        startDate, 
        endDate
      );
      res.json(plStatement);
    } catch (error) {
      console.error('Error generating P&L statement:', error);
      res.status(500).json({ error: 'Failed to generate P&L statement' });
    }
  });

  app.get('/api/salons/:salonId/financial-reports/cash-flow', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }
      
      const cashFlowStatement = await storage.generateCashFlowStatement(
        salonId, 
        startDate as string, 
        endDate as string
      );
      res.json(cashFlowStatement);
    } catch (error) {
      console.error('Error generating cash flow statement:', error);
      res.status(500).json({ error: 'Failed to generate cash flow statement' });
    }
  });

  // Tax Setting Endpoints
  app.get('/api/salons/:salonId/tax-settings', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const settings = await storage.getTaxSettingsBySalonId(salonId);
      res.json(settings);
    } catch (error) {
      console.error('Error fetching tax settings:', error);
      res.status(500).json({ error: 'Failed to fetch tax settings' });
    }
  });

  app.post('/api/salons/:salonId/tax-settings', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const validationResult = insertTaxSettingSchema.safeParse({ ...req.body, salonId });
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      const setting = await storage.createTaxSetting(validationResult.data);
      res.status(201).json(setting);
    } catch (error) {
      console.error('Error creating tax setting:', error);
      res.status(500).json({ error: 'Failed to create tax setting' });
    }
  });

  app.get('/api/salons/:salonId/tax-settings/liability', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { period = 'monthly' } = req.query;
      const liability = await storage.calculateTaxLiability(salonId, period as string);
      res.json(liability);
    } catch (error) {
      console.error('Error calculating tax liability:', error);
      res.status(500).json({ error: 'Failed to calculate tax liability' });
    }
  });

  // Financial Analytics Endpoints
  app.get('/api/salons/:salonId/financial-analytics/kpis', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { period = 'monthly' } = req.query;
      const kpis = await storage.getFinancialKPIs(salonId, period as string);
      res.json(kpis);
    } catch (error) {
      console.error('Error fetching financial KPIs:', error);
      res.status(500).json({ error: 'Failed to fetch financial KPIs' });
    }
  });

  app.get('/api/salons/:salonId/financial-analytics/forecast', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { months = 12 } = req.query;
      const forecast = await storage.getFinancialForecast(salonId, parseInt(months as string));
      res.json(forecast);
    } catch (error) {
      console.error('Error fetching financial forecast:', error);
      res.status(500).json({ error: 'Failed to fetch financial forecast' });
    }
  });

  // =================================
  // COMMUNICATION SYSTEM API ENDPOINTS
  // =================================
  
  // Message Template Endpoints
  app.get('/api/salons/:salonId/message-templates', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { type } = req.query;
      const templates = await storage.getMessageTemplatesBySalonId(salonId, type);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching message templates:', error);
      res.status(500).json({ error: 'Failed to fetch message templates' });
    }
  });
  
  app.post('/api/salons/:salonId/message-templates', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const validationResult = insertMessageTemplateSchema.safeParse({
        ...req.body,
        salonId,
        createdBy: req.user.id
      });
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.issues
        });
      }
      
      const template = await storage.createMessageTemplate(validationResult.data);
      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating message template:', error);
      res.status(500).json({ error: 'Failed to create message template' });
    }
  });
  
  app.put('/api/salons/:salonId/message-templates/:templateId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, templateId } = req.params;
      const updates = req.body;
      await storage.updateMessageTemplate(templateId, salonId, updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating message template:', error);
      res.status(500).json({ error: 'Failed to update message template' });
    }
  });
  
  app.delete('/api/salons/:salonId/message-templates/:templateId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, templateId } = req.params;
      await storage.deleteMessageTemplate(templateId, salonId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting message template:', error);
      res.status(500).json({ error: 'Failed to delete message template' });
    }
  });
  
  // TODO: Implement createDefaultMessageTemplates in storage interface
  // app.post('/api/salons/:salonId/message-templates/defaults', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
  //   try {
  //     const { salonId } = req.params;
  //     const templates = await storage.createDefaultMessageTemplates(salonId);
  //     res.status(201).json(templates);
  //   } catch (error) {
  //     console.error('Error creating default message templates:', error);
  //     res.status(500).json({ error: 'Failed to create default message templates' });
  //   }
  // });
  
  // TODO: Implement missing storage methods for customer segments, communication campaigns, and inventory management
  // The following routes are commented out until storage methods are implemented
  // All functionality for A/B testing is preserved below

  /*
  // Customer Segment Endpoints
  app.get('/api/salons/:salonId/customer-segments', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const segments = await storage.getCustomerSegmentsBySalonId(salonId);
      res.json(segments);
    } catch (error) {
      console.error('Error fetching customer segments:', error);
      res.status(500).json({ error: 'Failed to fetch customer segments' });
    }
  });
  
  app.post('/api/salons/:salonId/customer-segments', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const validationResult = insertCustomerSegmentSchema.safeParse({
        ...req.body,
        salonId,
        createdBy: req.user.id
      });
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.issues
        });
      }
      
      const segment = await storage.createCustomerSegment(validationResult.data);
      res.status(201).json(segment);
    } catch (error) {
      console.error('Error creating customer segment:', error);
      res.status(500).json({ error: 'Failed to create customer segment' });
    }
  });
  
  app.put('/api/salons/:salonId/customer-segments/:segmentId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, segmentId } = req.params;
      const updates = req.body;
      await storage.updateCustomerSegment(segmentId, salonId, updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating customer segment:', error);
      res.status(500).json({ error: 'Failed to update customer segment' });
    }
  });
  
  app.delete('/api/salons/:salonId/customer-segments/:segmentId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, segmentId } = req.params;
      await storage.deleteCustomerSegment(segmentId, salonId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting customer segment:', error);
      res.status(500).json({ error: 'Failed to delete customer segment' });
    }
  });
  
  app.get('/api/salons/:salonId/customer-segments/:segmentId/customers', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, segmentId } = req.params;
      const customers = await storage.getCustomersInSegment(segmentId, salonId);
      res.json(customers);
    } catch (error) {
      console.error('Error fetching segment customers:', error);
      res.status(500).json({ error: 'Failed to fetch segment customers' });
    }
  });
  
  // Communication Campaign Endpoints
  app.get('/api/salons/:salonId/communication-campaigns', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { status, type } = req.query;
      const campaigns = await storage.getCommunicationCampaignsBySalonId(salonId, { status, type });
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching communication campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch communication campaigns' });
    }
  });
  
  app.post('/api/salons/:salonId/communication-campaigns', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const validationResult = insertCommunicationCampaignSchema.safeParse({
        ...req.body,
        salonId,
        createdBy: req.user.id
      });
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.issues
        });
      }
      
      const campaign = await storage.createCommunicationCampaign(validationResult.data);
      res.status(201).json(campaign);
    } catch (error) {
      console.error('Error creating communication campaign:', error);
      res.status(500).json({ error: 'Failed to create communication campaign' });
    }
  });
  
  app.put('/api/salons/:salonId/communication-campaigns/:campaignId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, campaignId } = req.params;
      const updates = req.body;
      await storage.updateCommunicationCampaign(campaignId, salonId, updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating communication campaign:', error);
      res.status(500).json({ error: 'Failed to update communication campaign' });
    }
  });
  
  app.delete('/api/salons/:salonId/communication-campaigns/:campaignId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, campaignId } = req.params;
      await storage.deleteCommunicationCampaign(campaignId, salonId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting communication campaign:', error);
      res.status(500).json({ error: 'Failed to delete communication campaign' });
    }
  });
  
  app.post('/api/salons/:salonId/communication-campaigns/:campaignId/start', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { campaignId } = req.params;
      await storage.startCommunicationCampaign(campaignId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error starting communication campaign:', error);
      res.status(500).json({ error: 'Failed to start communication campaign' });
    }
  });
  
  app.post('/api/salons/:salonId/communication-campaigns/:campaignId/pause', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { campaignId } = req.params;
      await storage.pauseCommunicationCampaign(campaignId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error pausing communication campaign:', error);
      res.status(500).json({ error: 'Failed to pause communication campaign' });
    }
  });
  
  // Communication History Endpoints
  app.get('/api/salons/:salonId/communication-history', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const filters = req.query;
      const history = await storage.getCommunicationHistoryBySalonId(salonId, filters);
      res.json(history);
    } catch (error) {
      console.error('Error fetching communication history:', error);
      res.status(500).json({ error: 'Failed to fetch communication history' });
    }
  });
  
  app.get('/api/customers/:customerId/salons/:salonId/communication-history', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { customerId, salonId } = req.params;
      const history = await storage.getCommunicationHistoryByCustomer(customerId, salonId);
      res.json(history);
    } catch (error) {
      console.error('Error fetching customer communication history:', error);
      res.status(500).json({ error: 'Failed to fetch customer communication history' });
    }
  });
  
  // Communication Preferences Endpoints
  app.get('/api/customers/:customerId/salons/:salonId/communication-preferences', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { customerId, salonId } = req.params;
      let preferences = await storage.getCommunicationPreferences(customerId, salonId);
      
      // Create default preferences if they don't exist
      if (!preferences) {
        preferences = await storage.createCommunicationPreferences({
          customerId,
          salonId,
          emailOptIn: 1,
          smsOptIn: 1,
          marketingOptIn: 1,
          bookingNotifications: 1,
          promotionalOffers: 1,
          birthdayOffers: 1,
          preferredChannel: 'email'
        });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error('Error fetching communication preferences:', error);
      res.status(500).json({ error: 'Failed to fetch communication preferences' });
    }
  });
  
  app.put('/api/customers/:customerId/salons/:salonId/communication-preferences', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { customerId, salonId } = req.params;
      const updates = req.body;
      await storage.updateCommunicationPreferences(customerId, salonId, updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating communication preferences:', error);
      res.status(500).json({ error: 'Failed to update communication preferences' });
    }
  });
  
  app.post('/api/customers/:customerId/salons/:salonId/unsubscribe', async (req: any, res) => {
    try {
      const { customerId, salonId } = req.params;
      const { reason } = req.body;
      await storage.unsubscribeFromCommunications(customerId, salonId, reason);
      res.json({ success: true, message: 'Successfully unsubscribed from communications' });
    } catch (error) {
      console.error('Error unsubscribing from communications:', error);
      res.status(500).json({ error: 'Failed to unsubscribe from communications' });
    }
  });
  
  // Scheduled Messages Endpoints
  app.get('/api/salons/:salonId/scheduled-messages', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const filters = req.query;
      const messages = await storage.getScheduledMessagesBySalonId(salonId, filters);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching scheduled messages:', error);
      res.status(500).json({ error: 'Failed to fetch scheduled messages' });
    }
  });
  
  app.post('/api/salons/:salonId/scheduled-messages', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const validationResult = insertScheduledMessageSchema.safeParse({
        ...req.body,
        salonId
      });
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.issues
        });
      }
      
      const message = await storage.createScheduledMessage(validationResult.data);
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating scheduled message:', error);
      res.status(500).json({ error: 'Failed to create scheduled message' });
    }
  });
  
  app.delete('/api/salons/:salonId/scheduled-messages/:messageId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { messageId } = req.params;
      await storage.cancelScheduledMessage(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error cancelling scheduled message:', error);
      res.status(500).json({ error: 'Failed to cancel scheduled message' });
    }
  });
  
  // Communication Analytics & Dashboard Endpoints
  app.get('/api/salons/:salonId/communication-dashboard/metrics', communicationRateLimits.analytics, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { period = 'monthly' } = req.query;
      const metrics = await analyticsService.getCommunicationDashboardMetrics(salonId, period as string);
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching communication dashboard metrics:', error);
      res.status(500).json({ error: 'Failed to fetch communication dashboard metrics' });
    }
  });
  
  app.get('/api/salons/:salonId/communication-analytics', communicationRateLimits.analytics, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const filters = req.query;
      const analytics = await storage.getCommunicationAnalytics(salonId, filters);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching communication analytics:', error);
      res.status(500).json({ error: 'Failed to fetch communication analytics' });
    }
  });
  
  // Enhanced analytics endpoints using the analytics service
  app.get('/api/salons/:salonId/communication-analytics/campaigns', communicationRateLimits.analytics, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { campaignId } = req.query;
      const analytics = await analyticsService.getCampaignPerformanceAnalytics(salonId, campaignId as string);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching campaign performance analytics:', error);
      res.status(500).json({ error: 'Failed to fetch campaign performance analytics' });
    }
  });
  
  app.get('/api/salons/:salonId/communication-analytics/channels', communicationRateLimits.analytics, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { period = 'monthly' } = req.query;
      const analytics = await analyticsService.getChannelPerformanceAnalytics(salonId, period as string);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching channel performance analytics:', error);
      res.status(500).json({ error: 'Failed to fetch channel performance analytics' });
    }
  });
  
  app.post('/api/salons/:salonId/communication-analytics/snapshot', communicationRateLimits.templateOperations, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { period = 'daily' } = req.body;
      await analyticsService.storeAnalyticsSnapshot(salonId, period);
      res.json({ success: true, message: 'Analytics snapshot stored successfully' });
    } catch (error) {
      console.error('Error storing analytics snapshot:', error);
      res.status(500).json({ error: 'Failed to store analytics snapshot' });
    }
  });
  
  // Booking Notification Automation Endpoints
  app.post('/api/bookings/:bookingId/schedule-notifications', isAuthenticated, async (req: any, res) => {
    try {
      const { bookingId } = req.params;
      await storage.scheduleBookingNotifications(bookingId);
      res.json({ success: true, message: 'Booking notifications scheduled successfully' });
    } catch (error) {
      console.error('Error scheduling booking notifications:', error);
      res.status(500).json({ error: 'Failed to schedule booking notifications' });
    }
  });
  
  app.post('/api/bookings/:bookingId/cancel-notifications', isAuthenticated, async (req: any, res) => {
    try {
      const { bookingId } = req.params;
      await storage.cancelBookingNotifications(bookingId);
      res.json({ success: true, message: 'Booking notifications cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling booking notifications:', error);
      res.status(500).json({ error: 'Failed to cancel booking notifications' });
    }
  });
  
  app.post('/api/bookings/:bookingId/send-confirmation', isAuthenticated, async (req: any, res) => {
    try {
      const { bookingId } = req.params;
      const success = await storage.sendBookingConfirmation(bookingId);
      res.json({ success, message: success ? 'Confirmation sent successfully' : 'Failed to send confirmation' });
    } catch (error) {
      console.error('Error sending booking confirmation:', error);
      res.status(500).json({ error: 'Failed to send booking confirmation' });
    }
  });
  
  app.post('/api/bookings/:bookingId/send-reminder', isAuthenticated, async (req: any, res) => {
    try {
      const { bookingId } = req.params;
      const { reminderType } = req.body;
      const success = await storage.sendBookingReminder(bookingId, reminderType);
      res.json({ success, message: success ? 'Reminder sent successfully' : 'Failed to send reminder' });
    } catch (error) {
      console.error('Error sending booking reminder:', error);
      res.status(500).json({ error: 'Failed to send booking reminder' });
    }
  });
  
  // Template Processing Endpoints
  app.post('/api/salons/:salonId/templates/preview', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { templateContent, bookingId, customerId } = req.body;
      
      const variables = await storage.getTemplateVariables(salonId, bookingId, customerId);
      const processedContent = await storage.processTemplate(templateContent, variables);
      
      res.json({ 
        processedContent,
        variables: Object.keys(variables)
      });
    } catch (error) {
      console.error('Error processing template preview:', error);
      res.status(500).json({ error: 'Failed to process template preview' });
    }
  });
  
  app.get('/api/salons/:salonId/template-variables', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { bookingId, customerId } = req.query;
      const variables = await storage.getTemplateVariables(salonId, bookingId, customerId);
      res.json(variables);
    } catch (error) {
      console.error('Error fetching template variables:', error);
      res.status(500).json({ error: 'Failed to fetch template variables' });
    }
  });

  // =================================
  // CUSTOMER SEGMENTS ENDPOINTS
  // =================================
  
  app.get('/api/salons/:salonId/customer-segments', communicationRateLimits.analytics, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const segments = await storage.getCustomerSegmentsBySalonId(salonId);
      res.json(segments);
    } catch (error) {
      console.error('Error fetching customer segments:', error);
      res.status(500).json({ error: 'Failed to fetch customer segments' });
    }
  });
  
  app.post('/api/salons/:salonId/customer-segments', communicationRateLimits.templateOperations, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const segmentData = { ...req.body, salonId };
      
      const validationResult = insertCustomerSegmentSchema.safeParse(segmentData);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Invalid segment data', details: validationResult.error.errors });
      }
      
      const segment = await storage.createCustomerSegment(validationResult.data);
      
      // Update customer count for the segment
      await storage.updateSegmentCustomerCount(segment.id);
      
      res.status(201).json(segment);
    } catch (error) {
      console.error('Error creating customer segment:', error);
      res.status(500).json({ error: 'Failed to create customer segment' });
    }
  });
  
  app.put('/api/salons/:salonId/customer-segments/:segmentId', communicationRateLimits.templateOperations, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, segmentId } = req.params;
      const updates = req.body;
      
      await storage.updateCustomerSegment(segmentId, salonId, updates);
      
      // Update customer count for the segment
      await storage.updateSegmentCustomerCount(segmentId);
      
      res.json({ success: true, message: 'Customer segment updated successfully' });
    } catch (error) {
      console.error('Error updating customer segment:', error);
      res.status(500).json({ error: 'Failed to update customer segment' });
    }
  });
  
  app.delete('/api/salons/:salonId/customer-segments/:segmentId', communicationRateLimits.templateOperations, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, segmentId } = req.params;
      await storage.deleteCustomerSegment(segmentId, salonId);
      res.json({ success: true, message: 'Customer segment deleted successfully' });
    } catch (error) {
      console.error('Error deleting customer segment:', error);
      res.status(500).json({ error: 'Failed to delete customer segment' });
    }
  });
  
  app.get('/api/salons/:salonId/customer-segments/:segmentId/customers', communicationRateLimits.analytics, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, segmentId } = req.params;
      const customers = await storage.getCustomersInSegment(segmentId, salonId);
      res.json(customers);
    } catch (error) {
      console.error('Error fetching customers in segment:', error);
      res.status(500).json({ error: 'Failed to fetch customers in segment' });
    }
  });

  // =================================
  // COMMUNICATION CAMPAIGNS ENDPOINTS  
  // =================================
  
  app.get('/api/salons/:salonId/communication-campaigns', communicationRateLimits.analytics, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const filters = req.query;
      const campaigns = await storage.getCommunicationCampaignsBySalonId(salonId, filters);
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching communication campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch communication campaigns' });
    }
  });
  
  app.post('/api/salons/:salonId/communication-campaigns', communicationRateLimits.templateOperations, checkBusinessLimits, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const campaignData = { ...req.body, salonId, createdBy: req.user.id };
      
      const validationResult = insertCommunicationCampaignSchema.safeParse(campaignData);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Invalid campaign data', details: validationResult.error.errors });
      }
      
      const campaign = await storage.createCommunicationCampaign(validationResult.data);
      res.status(201).json(campaign);
    } catch (error) {
      console.error('Error creating communication campaign:', error);
      res.status(500).json({ error: 'Failed to create communication campaign' });
    }
  });
  
  app.put('/api/salons/:salonId/communication-campaigns/:campaignId', communicationRateLimits.templateOperations, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, campaignId } = req.params;
      const updates = req.body;
      
      await storage.updateCommunicationCampaign(campaignId, salonId, updates);
      res.json({ success: true, message: 'Communication campaign updated successfully' });
    } catch (error) {
      console.error('Error updating communication campaign:', error);
      res.status(500).json({ error: 'Failed to update communication campaign' });
    }
  });
  
  app.delete('/api/salons/:salonId/communication-campaigns/:campaignId', communicationRateLimits.templateOperations, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, campaignId } = req.params;
      await storage.deleteCommunicationCampaign(campaignId, salonId);
      res.json({ success: true, message: 'Communication campaign deleted successfully' });
    } catch (error) {
      console.error('Error deleting communication campaign:', error);
      res.status(500).json({ error: 'Failed to delete communication campaign' });
    }
  });
  
  // Campaign execution endpoints
  app.post('/api/salons/:salonId/communication-campaigns/:campaignId/start', communicationRateLimits.sendCampaign, checkBusinessLimits, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, campaignId } = req.params;
      
      // Get campaign details
      const campaign = await storage.getCommunicationCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      if (campaign.status !== 'draft') {
        return res.status(400).json({ error: 'Campaign must be in draft status to start' });
      }
      
      // Start the campaign
      await storage.startCommunicationCampaign(campaignId);
      
      // Get customers in target segment
      if (campaign.targetSegmentId) {
        const customers = await storage.getCustomersInSegment(campaign.targetSegmentId, salonId);
        
        // Send messages to all customers in segment
        const sendPromises = customers.map(customer => {
          if (customer.email) {
            return communicationService.sendMessage({
              to: customer.email,
              channel: campaign.channel as 'email' | 'sms',
              templateId: campaign.templateId || undefined,
              customContent: campaign.templateId ? undefined : {
                subject: campaign.subject || 'Message from your salon',
                body: campaign.content || ''
              },
              variables: {
                customer_name: customer.firstName || 'Valued Customer',
                salon_name: campaign.salonId // Would get actual salon name
              },
              salonId,
              customerId: customer.id,
              campaignId,
              type: 'campaign'
            });
          }
          return Promise.resolve({ success: false, error: 'No email address' });
        });
        
        const results = await Promise.allSettled(sendPromises);
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;
        
        // Update campaign stats
        await storage.updateCampaignStats(campaignId, {
          messagesSent: successful,
          messagesFailed: failed
        });
        
        res.json({ 
          success: true, 
          message: 'Campaign started successfully',
          stats: { sent: successful, failed }
        });
      } else {
        res.json({ success: true, message: 'Campaign started (no target segment specified)' });
      }
      
    } catch (error) {
      console.error('Error starting communication campaign:', error);
      res.status(500).json({ error: 'Failed to start communication campaign' });
    }
  });
  
  app.post('/api/salons/:salonId/communication-campaigns/:campaignId/pause', communicationRateLimits.templateOperations, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { campaignId } = req.params;
      await storage.pauseCommunicationCampaign(campaignId);
      res.json({ success: true, message: 'Campaign paused successfully' });
    } catch (error) {
      console.error('Error pausing communication campaign:', error);
      res.status(500).json({ error: 'Failed to pause communication campaign' });
    }
  });
  
  app.post('/api/salons/:salonId/communication-campaigns/:campaignId/complete', communicationRateLimits.templateOperations, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { campaignId } = req.params;
      await storage.completeCommunicationCampaign(campaignId);
      res.json({ success: true, message: 'Campaign completed successfully' });
    } catch (error) {
      console.error('Error completing communication campaign:', error);
      res.status(500).json({ error: 'Failed to complete communication campaign' });
    }
  });

  // =================================
  // MESSAGE SENDING ENDPOINTS
  // =================================
  
  app.post('/api/salons/:salonId/send-message', communicationRateLimits.sendMessage, spikeProtection, checkBusinessLimits, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { 
        to, 
        channel, 
        templateId, 
        customContent, 
        variables, 
        customerId, 
        bookingId, 
        type = 'transactional' 
      } = req.body;
      
      // Validate required fields
      if (!to || !channel) {
        return res.status(400).json({ error: 'Recipient and channel are required' });
      }
      
      if (!templateId && !customContent) {
        return res.status(400).json({ error: 'Either templateId or customContent is required' });
      }
      
      // Validate email/phone format
      if (channel === 'email' && !communicationService.isValidEmail(to)) {
        return res.status(400).json({ error: 'Invalid email address format' });
      }
      
      if (channel === 'sms' && !communicationService.isValidPhoneNumber(to)) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }
      
      const result = await communicationService.sendMessage({
        to,
        channel: channel as 'email' | 'sms',
        templateId,
        customContent,
        variables: variables || {},
        salonId,
        customerId,
        bookingId,
        type: type as any
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });
  
  app.post('/api/salons/:salonId/send-bulk-messages', communicationRateLimits.sendCampaign, checkBusinessLimits, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { messages } = req.body;
      
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required' });
      }
      
      if (messages.length > 1000) {
        return res.status(400).json({ error: 'Maximum 1000 messages per bulk send' });
      }
      
      // Validate each message
      for (const msg of messages) {
        if (!msg.to || !msg.channel) {
          return res.status(400).json({ error: 'Each message must have recipient and channel' });
        }
      }
      
      const sendRequests = messages.map(msg => ({
        ...msg,
        salonId,
        variables: msg.variables || {},
        type: msg.type || 'marketing'
      }));
      
      const results = await communicationService.sendBulkMessages(sendRequests);
      
      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;
      
      res.json({
        success: true,
        results,
        summary: {
          total: results.length,
          successful,
          failed
        }
      });
    } catch (error) {
      console.error('Error sending bulk messages:', error);
      res.status(500).json({ error: 'Failed to send bulk messages' });
    }
  });

  // =================================
  // SCHEDULING ENDPOINTS
  // =================================
  
  app.post('/api/salons/:salonId/schedule-message', communicationRateLimits.sendMessage, checkBusinessLimits, isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const {
        to,
        channel,
        templateId,
        customContent,
        variables,
        scheduledFor,
        customerId,
        bookingId,
        type = 'scheduled'
      } = req.body;
      
      // Validate required fields
      if (!to || !channel || !scheduledFor) {
        return res.status(400).json({ error: 'Recipient, channel, and scheduledFor are required' });
      }
      
      const scheduledDate = new Date(scheduledFor);
      if (scheduledDate <= new Date()) {
        return res.status(400).json({ error: 'Scheduled time must be in the future' });
      }
      
      const scheduledMessage = await schedulingService.scheduleMessage({
        salonId,
        customerId,
        bookingId,
        templateId,
        type,
        channel: channel as 'email' | 'sms',
        recipient: to,
        subject: customContent?.subject,
        content: customContent?.body || '',
        variables: variables || {},
        scheduledFor: scheduledDate
      });
      
      res.status(201).json({
        success: true,
        scheduledMessage,
        message: 'Message scheduled successfully'
      });
    } catch (error) {
      console.error('Error scheduling message:', error);
      res.status(500).json({ error: 'Failed to schedule message' });
    }
  });

  // =================================  
  // BOOKING AUTOMATION INTEGRATION
  // =================================
  
  // Enhanced booking confirmation with communication service
  app.post('/api/bookings/:bookingId/send-confirmation-enhanced', isAuthenticated, async (req: any, res) => {
    try {
      const { bookingId } = req.params;
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      const salon = await storage.getSalon(booking.salonId);
      const service = await storage.getService(booking.serviceId);
      
      const variables = {
        customer_name: booking.customerName,
        salon_name: salon?.name || 'Your Salon',
        service_name: service?.name || 'Service',
        booking_date: new Date(booking.bookingDate).toLocaleDateString(),
        booking_time: booking.bookingTime,
        staff_name: 'Our team' // Would get actual staff name
      };
      
      const results = await sendBookingConfirmation(
        booking.salonId,
        booking.id,
        booking.customerEmail,
        booking.customerPhone || undefined,
        variables
      );
      
      res.json({
        success: true,
        results,
        message: 'Booking confirmation sent successfully'
      });
    } catch (error) {
      console.error('Error sending enhanced booking confirmation:', error);
      res.status(500).json({ error: 'Failed to send booking confirmation' });
    }
  });
  
  // Schedule booking reminders with new scheduling service
  app.post('/api/bookings/:bookingId/schedule-reminders-enhanced', isAuthenticated, async (req: any, res) => {
    try {
      const { bookingId } = req.params;
      await schedulingService.scheduleBookingReminders(bookingId);
      
      res.json({
        success: true,
        message: 'Booking reminders scheduled successfully'
      });
    } catch (error) {
      console.error('Error scheduling enhanced booking reminders:', error);
      res.status(500).json({ error: 'Failed to schedule booking reminders' });
    }
  });

  // =================================
  // INVENTORY MANAGEMENT ROUTES
  // =================================

  // Vendor management routes
  app.get('/api/salons/:salonId/vendors', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const vendors = await storage.getVendorsBySalonId(salonId);
      res.json(vendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      res.status(500).json({ error: 'Failed to fetch vendors' });
    }
  });

  app.post('/api/salons/:salonId/vendors', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const vendorData = insertVendorSchema.parse({ ...req.body, salonId });
      const vendor = await storage.createVendor(vendorData);
      res.status(201).json(vendor);
    } catch (error) {
      console.error('Error creating vendor:', error);
      res.status(500).json({ error: 'Failed to create vendor' });
    }
  });

  app.put('/api/salons/:salonId/vendors/:vendorId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, vendorId } = req.params;
      const updates = insertVendorSchema.partial().parse(req.body);
      await storage.updateVendor(vendorId, salonId, updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating vendor:', error);
      res.status(500).json({ error: 'Failed to update vendor' });
    }
  });

  app.delete('/api/salons/:salonId/vendors/:vendorId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, vendorId } = req.params;
      await storage.deleteVendor(vendorId, salonId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting vendor:', error);
      res.status(500).json({ error: 'Failed to delete vendor' });
    }
  });

  // Product category routes
  app.get('/api/salons/:salonId/product-categories', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const categories = await storage.getProductCategoriesBySalonId(salonId);
      res.json(categories);
    } catch (error) {
      console.error('Error fetching product categories:', error);
      res.status(500).json({ error: 'Failed to fetch product categories' });
    }
  });

  app.post('/api/salons/:salonId/product-categories', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const categoryData = insertProductCategorySchema.parse({ ...req.body, salonId });
      const category = await storage.createProductCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating product category:', error);
      res.status(500).json({ error: 'Failed to create product category' });
    }
  });

  app.post('/api/salons/:salonId/product-categories/default', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const categories = await storage.createDefaultProductCategories(salonId);
      res.status(201).json(categories);
    } catch (error) {
      console.error('Error creating default categories:', error);
      res.status(500).json({ error: 'Failed to create default categories' });
    }
  });

  app.put('/api/salons/:salonId/product-categories/:categoryId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, categoryId } = req.params;
      const updates = insertProductCategorySchema.partial().parse(req.body);
      await storage.updateProductCategory(categoryId, salonId, updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating product category:', error);
      res.status(500).json({ error: 'Failed to update product category' });
    }
  });

  app.delete('/api/salons/:salonId/product-categories/:categoryId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, categoryId } = req.params;
      await storage.deleteProductCategory(categoryId, salonId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting product category:', error);
      res.status(500).json({ error: 'Failed to delete product category' });
    }
  });

  // Product management routes
  app.get('/api/salons/:salonId/products', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { categoryId, vendorId, isActive, lowStock, search } = req.query;
      
      const filters: any = {};
      if (categoryId) filters.categoryId = categoryId as string;
      if (vendorId) filters.vendorId = vendorId as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (lowStock === 'true') filters.lowStock = true;
      if (search) filters.search = search as string;
      
      const products = await storage.getProductsBySalonId(salonId, filters);
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.get('/api/salons/:salonId/products/low-stock', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const products = await storage.getLowStockProducts(salonId);
      res.json(products);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      res.status(500).json({ error: 'Failed to fetch low stock products' });
    }
  });

  app.get('/api/salons/:salonId/products/expiring', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { daysAhead } = req.query;
      const products = await storage.getExpiringProducts(salonId, daysAhead ? parseInt(daysAhead as string) : undefined);
      res.json(products);
    } catch (error) {
      console.error('Error fetching expiring products:', error);
      res.status(500).json({ error: 'Failed to fetch expiring products' });
    }
  });

  app.post('/api/salons/:salonId/products', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const productData = insertProductSchema.parse({ ...req.body, salonId });
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.put('/api/salons/:salonId/products/:productId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, productId } = req.params;
      const updates = insertProductSchema.partial().parse(req.body);
      await storage.updateProduct(productId, salonId, updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.put('/api/salons/:salonId/products/:productId/stock', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, productId } = req.params;
      const { newStock, reason, staffId } = req.body;
      
      if (typeof newStock !== 'number' || !reason) {
        return res.status(400).json({ error: 'newStock (number) and reason are required' });
      }
      
      await storage.updateProductStock(productId, salonId, newStock, reason, staffId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating product stock:', error);
      res.status(500).json({ error: 'Failed to update product stock' });
    }
  });

  app.delete('/api/salons/:salonId/products/:productId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, productId } = req.params;
      await storage.deleteProduct(productId, salonId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Stock movement routes
  app.get('/api/salons/:salonId/stock-movements', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { productId, type, startDate, endDate, staffId } = req.query;
      
      const filters: any = {};
      if (productId) filters.productId = productId as string;
      if (type) filters.type = type as string;
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;
      if (staffId) filters.staffId = staffId as string;
      
      const movements = await storage.getStockMovementsBySalonId(salonId, filters);
      res.json(movements);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      res.status(500).json({ error: 'Failed to fetch stock movements' });
    }
  });

  app.get('/api/products/:productId/stock-history', isAuthenticated, async (req: any, res) => {
    try {
      const { productId } = req.params;
      const { limit } = req.query;
      const history = await storage.getProductStockHistory(productId, limit ? parseInt(limit as string) : undefined);
      res.json(history);
    } catch (error) {
      console.error('Error fetching product stock history:', error);
      res.status(500).json({ error: 'Failed to fetch product stock history' });
    }
  });

  app.post('/api/salons/:salonId/stock-movements', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const movementData = insertStockMovementSchema.parse({ ...req.body, salonId });
      const movement = await storage.createStockMovement(movementData);
      res.status(201).json(movement);
    } catch (error) {
      console.error('Error creating stock movement:', error);
      res.status(500).json({ error: 'Failed to create stock movement' });
    }
  });

  // Purchase order routes
  app.get('/api/salons/:salonId/purchase-orders', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { vendorId, status, startDate, endDate } = req.query;
      
      const filters: any = {};
      if (vendorId) filters.vendorId = vendorId as string;
      if (status) filters.status = status as string;
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;
      
      const orders = await storage.getPurchaseOrdersBySalonId(salonId, filters);
      res.json(orders);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
  });

  app.post('/api/salons/:salonId/purchase-orders', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const userId = req.user.id;
      
      // Generate order number
      const orderNumber = await storage.generatePurchaseOrderNumber(salonId);
      
      const orderData = insertPurchaseOrderSchema.parse({ 
        ...req.body, 
        salonId,
        orderNumber,
        createdBy: userId
      });
      
      const order = await storage.createPurchaseOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      console.error('Error creating purchase order:', error);
      res.status(500).json({ error: 'Failed to create purchase order' });
    }
  });

  app.put('/api/salons/:salonId/purchase-orders/:orderId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, orderId } = req.params;
      const updates = insertPurchaseOrderSchema.partial().parse(req.body);
      await storage.updatePurchaseOrder(orderId, salonId, updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating purchase order:', error);
      res.status(500).json({ error: 'Failed to update purchase order' });
    }
  });

  app.post('/api/salons/:salonId/purchase-orders/:orderId/submit', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, orderId } = req.params;
      const userId = req.user.id;
      await storage.submitPurchaseOrder(orderId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error submitting purchase order:', error);
      res.status(500).json({ error: 'Failed to submit purchase order' });
    }
  });

  app.post('/api/salons/:salonId/purchase-orders/:orderId/receive', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, orderId } = req.params;
      const { items } = req.body;
      const userId = req.user.id;
      
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Items array is required' });
      }
      
      await storage.receivePurchaseOrder(orderId, userId, items);
      res.json({ success: true });
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      res.status(500).json({ error: 'Failed to receive purchase order' });
    }
  });

  app.post('/api/salons/:salonId/purchase-orders/:orderId/cancel', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, orderId } = req.params;
      const userId = req.user.id;
      await storage.cancelPurchaseOrder(orderId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error cancelling purchase order:', error);
      res.status(500).json({ error: 'Failed to cancel purchase order' });
    }
  });

  // Purchase order items routes
  app.get('/api/purchase-orders/:orderId/items', isAuthenticated, async (req: any, res) => {
    try {
      const { orderId } = req.params;
      const items = await storage.getPurchaseOrderItemsByOrderId(orderId);
      res.json(items);
    } catch (error) {
      console.error('Error fetching purchase order items:', error);
      res.status(500).json({ error: 'Failed to fetch purchase order items' });
    }
  });

  app.post('/api/purchase-orders/:orderId/items', isAuthenticated, async (req: any, res) => {
    try {
      const { orderId } = req.params;
      const itemData = insertPurchaseOrderItemSchema.parse({ ...req.body, purchaseOrderId: orderId });
      const item = await storage.createPurchaseOrderItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error('Error creating purchase order item:', error);
      res.status(500).json({ error: 'Failed to create purchase order item' });
    }
  });

  app.put('/api/purchase-order-items/:itemId', isAuthenticated, async (req: any, res) => {
    try {
      const { itemId } = req.params;
      const updates = insertPurchaseOrderItemSchema.partial().parse(req.body);
      await storage.updatePurchaseOrderItem(itemId, updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating purchase order item:', error);
      res.status(500).json({ error: 'Failed to update purchase order item' });
    }
  });

  app.delete('/api/purchase-order-items/:itemId', isAuthenticated, async (req: any, res) => {
    try {
      const { itemId } = req.params;
      await storage.deletePurchaseOrderItem(itemId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting purchase order item:', error);
      res.status(500).json({ error: 'Failed to delete purchase order item' });
    }
  });

  // Product usage routes
  app.get('/api/salons/:salonId/product-usage', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const usage = await storage.getProductUsagesBySalonId(salonId);
      res.json(usage);
    } catch (error) {
      console.error('Error fetching product usage:', error);
      res.status(500).json({ error: 'Failed to fetch product usage' });
    }
  });

  app.get('/api/services/:serviceId/product-usage', isAuthenticated, async (req: any, res) => {
    try {
      const { serviceId } = req.params;
      const usage = await storage.getProductUsagesByServiceId(serviceId);
      res.json(usage);
    } catch (error) {
      console.error('Error fetching service product usage:', error);
      res.status(500).json({ error: 'Failed to fetch service product usage' });
    }
  });

  app.get('/api/services/:serviceId/product-cost', isAuthenticated, async (req: any, res) => {
    try {
      const { serviceId } = req.params;
      const cost = await storage.calculateServiceProductCost(serviceId);
      res.json({ cost });
    } catch (error) {
      console.error('Error calculating service product cost:', error);
      res.status(500).json({ error: 'Failed to calculate service product cost' });
    }
  });

  app.post('/api/salons/:salonId/product-usage', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const usageData = insertProductUsageSchema.parse({ ...req.body, salonId });
      const usage = await storage.createProductUsage(usageData);
      res.status(201).json(usage);
    } catch (error) {
      console.error('Error creating product usage:', error);
      res.status(500).json({ error: 'Failed to create product usage' });
    }
  });

  app.put('/api/salons/:salonId/product-usage/:usageId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, usageId } = req.params;
      const updates = insertProductUsageSchema.partial().parse(req.body);
      await storage.updateProductUsage(usageId, salonId, updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating product usage:', error);
      res.status(500).json({ error: 'Failed to update product usage' });
    }
  });

  app.delete('/api/salons/:salonId/product-usage/:usageId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, usageId } = req.params;
      await storage.deleteProductUsage(usageId, salonId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting product usage:', error);
      res.status(500).json({ error: 'Failed to delete product usage' });
    }
  });

  app.post('/api/bookings/:bookingId/track-usage', isAuthenticated, async (req: any, res) => {
    try {
      const { bookingId } = req.params;
      await storage.trackProductUsageForBooking(bookingId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking product usage for booking:', error);
      res.status(500).json({ error: 'Failed to track product usage for booking' });
    }
  });

  // Reorder rules routes
  app.get('/api/salons/:salonId/reorder-rules', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const rules = await storage.getReorderRulesBySalonId(salonId);
      res.json(rules);
    } catch (error) {
      console.error('Error fetching reorder rules:', error);
      res.status(500).json({ error: 'Failed to fetch reorder rules' });
    }
  });

  app.get('/api/salons/:salonId/reorder-requirements', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const requirements = await storage.checkReorderRequirements(salonId);
      res.json(requirements);
    } catch (error) {
      console.error('Error checking reorder requirements:', error);
      res.status(500).json({ error: 'Failed to check reorder requirements' });
    }
  });

  app.post('/api/salons/:salonId/reorder-rules', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const ruleData = insertReorderRuleSchema.parse({ ...req.body, salonId });
      const rule = await storage.createReorderRule(ruleData);
      res.status(201).json(rule);
    } catch (error) {
      console.error('Error creating reorder rule:', error);
      res.status(500).json({ error: 'Failed to create reorder rule' });
    }
  });

  app.put('/api/salons/:salonId/reorder-rules/:ruleId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, ruleId } = req.params;
      const updates = insertReorderRuleSchema.partial().parse(req.body);
      await storage.updateReorderRule(ruleId, salonId, updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating reorder rule:', error);
      res.status(500).json({ error: 'Failed to update reorder rule' });
    }
  });

  app.delete('/api/salons/:salonId/reorder-rules/:ruleId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, ruleId } = req.params;
      await storage.deleteReorderRule(ruleId, salonId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting reorder rule:', error);
      res.status(500).json({ error: 'Failed to delete reorder rule' });
    }
  });

  app.post('/api/salons/:salonId/trigger-automatic-reorders', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const ordersCreated = await storage.triggerAutomaticReorders(salonId);
      res.json({ 
        success: true, 
        ordersCreated,
        message: `Created ${ordersCreated} automatic purchase orders`
      });
    } catch (error) {
      console.error('Error triggering automatic reorders:', error);
      res.status(500).json({ error: 'Failed to trigger automatic reorders' });
    }
  });

  // Inventory adjustment routes
  app.get('/api/salons/:salonId/inventory-adjustments', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { type, status, startDate, endDate } = req.query;
      
      const filters: any = {};
      if (type) filters.type = type as string;
      if (status) filters.status = status as string;
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;
      
      const adjustments = await storage.getInventoryAdjustmentsBySalonId(salonId, filters);
      res.json(adjustments);
    } catch (error) {
      console.error('Error fetching inventory adjustments:', error);
      res.status(500).json({ error: 'Failed to fetch inventory adjustments' });
    }
  });

  app.post('/api/salons/:salonId/inventory-adjustments', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const userId = req.user.id;
      
      // Generate adjustment number
      const adjustmentNumber = await storage.generateAdjustmentNumber(salonId);
      
      const adjustmentData = insertInventoryAdjustmentSchema.parse({ 
        ...req.body, 
        salonId,
        adjustmentNumber,
        createdBy: userId
      });
      
      const adjustment = await storage.createInventoryAdjustment(adjustmentData);
      res.status(201).json(adjustment);
    } catch (error) {
      console.error('Error creating inventory adjustment:', error);
      res.status(500).json({ error: 'Failed to create inventory adjustment' });
    }
  });

  app.put('/api/salons/:salonId/inventory-adjustments/:adjustmentId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, adjustmentId } = req.params;
      const updates = insertInventoryAdjustmentSchema.partial().parse(req.body);
      await storage.updateInventoryAdjustment(adjustmentId, salonId, updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating inventory adjustment:', error);
      res.status(500).json({ error: 'Failed to update inventory adjustment' });
    }
  });

  app.post('/api/salons/:salonId/inventory-adjustments/:adjustmentId/submit', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, adjustmentId } = req.params;
      const userId = req.user.id;
      await storage.submitInventoryAdjustment(adjustmentId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error submitting inventory adjustment:', error);
      res.status(500).json({ error: 'Failed to submit inventory adjustment' });
    }
  });

  app.post('/api/salons/:salonId/inventory-adjustments/:adjustmentId/approve', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, adjustmentId } = req.params;
      const userId = req.user.id;
      await storage.approveInventoryAdjustment(adjustmentId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error approving inventory adjustment:', error);
      res.status(500).json({ error: 'Failed to approve inventory adjustment' });
    }
  });

  // Inventory adjustment items routes
  app.get('/api/inventory-adjustments/:adjustmentId/items', isAuthenticated, async (req: any, res) => {
    try {
      const { adjustmentId } = req.params;
      const items = await storage.getInventoryAdjustmentItemsByAdjustmentId(adjustmentId);
      res.json(items);
    } catch (error) {
      console.error('Error fetching inventory adjustment items:', error);
      res.status(500).json({ error: 'Failed to fetch inventory adjustment items' });
    }
  });

  app.post('/api/inventory-adjustments/:adjustmentId/items', isAuthenticated, async (req: any, res) => {
    try {
      const { adjustmentId } = req.params;
      const itemData = insertInventoryAdjustmentItemSchema.parse({ ...req.body, adjustmentId });
      const item = await storage.createInventoryAdjustmentItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error('Error creating inventory adjustment item:', error);
      res.status(500).json({ error: 'Failed to create inventory adjustment item' });
    }
  });

  app.put('/api/inventory-adjustment-items/:itemId', isAuthenticated, async (req: any, res) => {
    try {
      const { itemId } = req.params;
      const updates = insertInventoryAdjustmentItemSchema.partial().parse(req.body);
      await storage.updateInventoryAdjustmentItem(itemId, updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating inventory adjustment item:', error);
      res.status(500).json({ error: 'Failed to update inventory adjustment item' });
    }
  });

  app.delete('/api/inventory-adjustment-items/:itemId', isAuthenticated, async (req: any, res) => {
    try {
      const { itemId } = req.params;
      await storage.deleteInventoryAdjustmentItem(itemId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting inventory adjustment item:', error);
      res.status(500).json({ error: 'Failed to delete inventory adjustment item' });
    }
  });

  // Inventory analytics and dashboard routes
  app.get('/api/salons/:salonId/inventory/dashboard', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const metrics = await storage.getInventoryDashboardMetrics(salonId);
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching inventory dashboard metrics:', error);
      res.status(500).json({ error: 'Failed to fetch inventory dashboard metrics' });
    }
  });

  app.get('/api/salons/:salonId/inventory/analytics', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { period = 'monthly' } = req.query;
      const analytics = await storage.getInventoryAnalytics(salonId, period as string);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching inventory analytics:', error);
      res.status(500).json({ error: 'Failed to fetch inventory analytics' });
    }
  });

  app.get('/api/salons/:salonId/inventory/profitability', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { period = 'monthly' } = req.query;
      const analysis = await storage.getProductProfitabilityAnalysis(salonId, period as string);
      res.json(analysis);
    } catch (error) {
      console.error('Error fetching product profitability analysis:', error);
      res.status(500).json({ error: 'Failed to fetch product profitability analysis' });
    }
  });

  app.get('/api/salons/:salonId/inventory/forecast', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { months = 6 } = req.query;
      const forecast = await storage.getInventoryForecast(salonId, parseInt(months as string));
      res.json(forecast);
    } catch (error) {
      console.error('Error fetching inventory forecast:', error);
      res.status(500).json({ error: 'Failed to fetch inventory forecast' });
    }
  });
  */

  // ===== A/B TESTING SYSTEM ENDPOINTS =====

  // A/B Test Campaign Management
  
  // GET /api/salons/:salonId/ab-test-campaigns - List all A/B test campaigns with optional filters
  app.get('/api/salons/:salonId/ab-test-campaigns', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { status, testType } = req.query;
      
      const filters: { status?: string; testType?: string } = {};
      if (status) filters.status = status;
      if (testType) filters.testType = testType;
      
      const campaigns = await storage.getAbTestCampaignsBySalonId(salonId, filters);
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching A/B test campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch A/B test campaigns' });
    }
  });

  // GET /api/salons/:salonId/ab-test-campaigns/:testId - Get specific A/B test campaign details
  app.get('/api/salons/:salonId/ab-test-campaigns/:testId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { testId } = req.params;
      
      const campaign = await storage.getAbTestCampaign(testId);
      if (!campaign) {
        return res.status(404).json({ error: 'A/B test campaign not found' });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error('Error fetching A/B test campaign:', error);
      res.status(500).json({ error: 'Failed to fetch A/B test campaign' });
    }
  });

  // POST /api/salons/:salonId/ab-test-campaigns - Create new A/B test campaign
  app.post('/api/salons/:salonId/ab-test-campaigns', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      // Validate input using Zod schema
      const validationResult = insertAbTestCampaignSchema.safeParse({
        ...req.body,
        salonId,
        createdBy: req.user.id
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      // Validate that baseTemplateId exists and belongs to salon
      if (validationResult.data.baseTemplateId) {
        const template = await storage.getMessageTemplate(validationResult.data.baseTemplateId);
        if (!template || template.salonId !== salonId) {
          return res.status(400).json({ error: 'Invalid base template ID' });
        }
      }
      
      // Validate that targetSegmentId exists and belongs to salon (if provided)
      if (validationResult.data.targetSegmentId) {
        const segment = await storage.getCustomerSegmentation(validationResult.data.targetSegmentId);
        if (!segment || segment.salonId !== salonId) {
          return res.status(400).json({ error: 'Invalid target segment ID' });
        }
      }
      
      const newCampaign = await storage.createAbTestCampaign(validationResult.data);
      res.status(201).json(newCampaign);
    } catch (error) {
      console.error('Error creating A/B test campaign:', error);
      res.status(500).json({ error: 'Failed to create A/B test campaign' });
    }
  });

  // PUT /api/salons/:salonId/ab-test-campaigns/:testId - Update A/B test campaign
  app.put('/api/salons/:salonId/ab-test-campaigns/:testId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, testId } = req.params;
      
      // Check if campaign exists and belongs to salon
      const existingCampaign = await storage.getAbTestCampaign(testId);
      if (!existingCampaign) {
        return res.status(404).json({ error: 'A/B test campaign not found' });
      }
      if (existingCampaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Access denied to this A/B test campaign' });
      }
      
      // Validate input using partial schema
      const partialSchema = insertAbTestCampaignSchema.partial();
      const validationResult = partialSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      await storage.updateAbTestCampaign(testId, validationResult.data);
      
      // Return updated campaign
      const updatedCampaign = await storage.getAbTestCampaign(testId);
      res.json(updatedCampaign);
    } catch (error) {
      console.error('Error updating A/B test campaign:', error);
      res.status(500).json({ error: 'Failed to update A/B test campaign' });
    }
  });

  // DELETE /api/salons/:salonId/ab-test-campaigns/:testId - Delete A/B test campaign
  app.delete('/api/salons/:salonId/ab-test-campaigns/:testId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, testId } = req.params;
      
      // Check if campaign exists and belongs to salon
      const existingCampaign = await storage.getAbTestCampaign(testId);
      if (!existingCampaign) {
        return res.status(404).json({ error: 'A/B test campaign not found' });
      }
      if (existingCampaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Access denied to this A/B test campaign' });
      }
      
      await storage.deleteAbTestCampaign(testId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting A/B test campaign:', error);
      res.status(500).json({ error: 'Failed to delete A/B test campaign' });
    }
  });

  // Test Variant Management

  // GET /api/salons/:salonId/ab-test-campaigns/:testId/variants - Get all variants for a test
  app.get('/api/salons/:salonId/ab-test-campaigns/:testId/variants', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, testId } = req.params;
      
      // Verify test belongs to salon
      const campaign = await storage.getAbTestCampaign(testId);
      if (!campaign) {
        return res.status(404).json({ error: 'A/B test campaign not found' });
      }
      if (campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Access denied to this A/B test campaign' });
      }
      
      const variants = await storage.getTestVariantsByTestId(testId);
      res.json(variants);
    } catch (error) {
      console.error('Error fetching test variants:', error);
      res.status(500).json({ error: 'Failed to fetch test variants' });
    }
  });

  // GET /api/salons/:salonId/ab-test-campaigns/:testId/variants/:variantId - Get specific variant
  app.get('/api/salons/:salonId/ab-test-campaigns/:testId/variants/:variantId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, testId, variantId } = req.params;
      
      // Verify test belongs to salon
      const campaign = await storage.getAbTestCampaign(testId);
      if (!campaign) {
        return res.status(404).json({ error: 'A/B test campaign not found' });
      }
      if (campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Access denied to this A/B test campaign' });
      }
      
      const variant = await storage.getTestVariant(variantId);
      if (!variant) {
        return res.status(404).json({ error: 'Test variant not found' });
      }
      if (variant.testCampaignId !== testId) {
        return res.status(404).json({ error: 'Test variant not found in this campaign' });
      }
      
      res.json(variant);
    } catch (error) {
      console.error('Error fetching test variant:', error);
      res.status(500).json({ error: 'Failed to fetch test variant' });
    }
  });

  // POST /api/salons/:salonId/ab-test-campaigns/:testId/variants - Create new test variant
  app.post('/api/salons/:salonId/ab-test-campaigns/:testId/variants', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, testId } = req.params;
      
      // Verify test belongs to salon
      const campaign = await storage.getAbTestCampaign(testId);
      if (!campaign) {
        return res.status(404).json({ error: 'A/B test campaign not found' });
      }
      if (campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Access denied to this A/B test campaign' });
      }
      
      // Validate input
      const validationResult = insertTestVariantSchema.safeParse({
        ...req.body,
        testCampaignId: testId
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      // Validate templateOverrides is valid JSON if provided
      if (validationResult.data.templateOverrides) {
        try {
          if (typeof validationResult.data.templateOverrides === 'string') {
            JSON.parse(validationResult.data.templateOverrides);
          }
        } catch (e) {
          return res.status(400).json({ error: 'Invalid template overrides JSON' });
        }
      }
      
      const newVariant = await storage.createTestVariant(validationResult.data);
      res.status(201).json(newVariant);
    } catch (error) {
      console.error('Error creating test variant:', error);
      res.status(500).json({ error: 'Failed to create test variant' });
    }
  });

  // PUT /api/salons/:salonId/ab-test-campaigns/:testId/variants/:variantId - Update test variant
  app.put('/api/salons/:salonId/ab-test-campaigns/:testId/variants/:variantId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, testId, variantId } = req.params;
      
      // Verify test belongs to salon and variant exists
      const campaign = await storage.getAbTestCampaign(testId);
      if (!campaign) {
        return res.status(404).json({ error: 'A/B test campaign not found' });
      }
      if (campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Access denied to this A/B test campaign' });
      }
      
      const existingVariant = await storage.getTestVariant(variantId);
      if (!existingVariant || existingVariant.testCampaignId !== testId) {
        return res.status(404).json({ error: 'Test variant not found' });
      }
      
      // Validate input
      const partialSchema = insertTestVariantSchema.partial();
      const validationResult = partialSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      await storage.updateTestVariant(variantId, validationResult.data);
      
      // Return updated variant
      const updatedVariant = await storage.getTestVariant(variantId);
      res.json(updatedVariant);
    } catch (error) {
      console.error('Error updating test variant:', error);
      res.status(500).json({ error: 'Failed to update test variant' });
    }
  });

  // DELETE /api/salons/:salonId/ab-test-campaigns/:testId/variants/:variantId - Delete test variant
  app.delete('/api/salons/:salonId/ab-test-campaigns/:testId/variants/:variantId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, testId, variantId } = req.params;
      
      // Verify test belongs to salon and variant exists
      const campaign = await storage.getAbTestCampaign(testId);
      if (!campaign) {
        return res.status(404).json({ error: 'A/B test campaign not found' });
      }
      if (campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Access denied to this A/B test campaign' });
      }
      
      const existingVariant = await storage.getTestVariant(variantId);
      if (!existingVariant || existingVariant.testCampaignId !== testId) {
        return res.status(404).json({ error: 'Test variant not found' });
      }
      
      await storage.deleteTestVariant(variantId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting test variant:', error);
      res.status(500).json({ error: 'Failed to delete test variant' });
    }
  });

  // Performance Tracking & Analytics

  // GET /api/salons/:salonId/ab-test-campaigns/:testId/metrics - Get test performance metrics with date range filtering
  app.get('/api/salons/:salonId/ab-test-campaigns/:testId/metrics', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, testId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Verify test belongs to salon
      const campaign = await storage.getAbTestCampaign(testId);
      if (!campaign) {
        return res.status(404).json({ error: 'A/B test campaign not found' });
      }
      if (campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Access denied to this A/B test campaign' });
      }
      
      const dateRange = startDate && endDate ? { start: startDate as string, end: endDate as string } : undefined;
      const metrics = await storage.getTestMetricsByTestId(testId, dateRange);
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching test metrics:', error);
      res.status(500).json({ error: 'Failed to fetch test metrics' });
    }
  });

  // POST /api/salons/:salonId/ab-test-campaigns/:testId/metrics - Record new performance metrics
  app.post('/api/salons/:salonId/ab-test-campaigns/:testId/metrics', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, testId } = req.params;
      
      // Verify test belongs to salon
      const campaign = await storage.getAbTestCampaign(testId);
      if (!campaign) {
        return res.status(404).json({ error: 'A/B test campaign not found' });
      }
      if (campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Access denied to this A/B test campaign' });
      }
      
      // Validate input
      const validationResult = insertTestMetricSchema.safeParse({
        ...req.body,
        testCampaignId: testId
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      // Verify variant belongs to this test
      if (validationResult.data.variantId) {
        const variant = await storage.getTestVariant(validationResult.data.variantId);
        if (!variant || variant.testCampaignId !== testId) {
          return res.status(400).json({ error: 'Invalid variant ID for this test campaign' });
        }
      }
      
      const newMetric = await storage.createTestMetric(validationResult.data);
      res.status(201).json(newMetric);
    } catch (error) {
      console.error('Error creating test metric:', error);
      res.status(500).json({ error: 'Failed to create test metric' });
    }
  });

  // GET /api/salons/:salonId/ab-test-campaigns/:testId/performance-summary - Get performance summary with winner analysis
  app.get('/api/salons/:salonId/ab-test-campaigns/:testId/performance-summary', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, testId } = req.params;
      
      // Verify test belongs to salon
      const campaign = await storage.getAbTestCampaign(testId);
      if (!campaign) {
        return res.status(404).json({ error: 'A/B test campaign not found' });
      }
      if (campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Access denied to this A/B test campaign' });
      }
      
      const summary = await storage.getAbTestPerformanceSummary(testId);
      res.json(summary);
    } catch (error) {
      console.error('Error fetching performance summary:', error);
      res.status(500).json({ error: 'Failed to fetch performance summary' });
    }
  });

  // GET /api/salons/:salonId/ab-test-analytics - Get salon-level A/B testing analytics
  app.get('/api/salons/:salonId/ab-test-analytics', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const { period = 'monthly' } = req.query;
      
      const analytics = await storage.getAbTestCampaignAnalytics(salonId, period as string);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching A/B test analytics:', error);
      res.status(500).json({ error: 'Failed to fetch A/B test analytics' });
    }
  });

  // Test Results & Winner Selection

  // GET /api/salons/:salonId/ab-test-campaigns/:testId/results - Get test results
  app.get('/api/salons/:salonId/ab-test-campaigns/:testId/results', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, testId } = req.params;
      
      // Verify test belongs to salon
      const campaign = await storage.getAbTestCampaign(testId);
      if (!campaign) {
        return res.status(404).json({ error: 'A/B test campaign not found' });
      }
      if (campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Access denied to this A/B test campaign' });
      }
      
      const result = await storage.getTestResultByTestId(testId);
      if (!result) {
        return res.status(404).json({ error: 'Test results not found' });
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching test results:', error);
      res.status(500).json({ error: 'Failed to fetch test results' });
    }
  });

  // POST /api/salons/:salonId/ab-test-campaigns/:testId/results - Create/update test results with winner selection
  app.post('/api/salons/:salonId/ab-test-campaigns/:testId/results', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, testId } = req.params;
      
      // Verify test belongs to salon
      const campaign = await storage.getAbTestCampaign(testId);
      if (!campaign) {
        return res.status(404).json({ error: 'A/B test campaign not found' });
      }
      if (campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Access denied to this A/B test campaign' });
      }
      
      // Validate input
      const validationResult = insertTestResultSchema.safeParse({
        ...req.body,
        testCampaignId: testId,
        completedAt: req.body.completedAt || new Date()
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input',
          details: validationResult.error.issues
        });
      }
      
      // Verify winner variant belongs to this test (if provided)
      if (validationResult.data.winnerVariantId) {
        const variant = await storage.getTestVariant(validationResult.data.winnerVariantId);
        if (!variant || variant.testCampaignId !== testId) {
          return res.status(400).json({ error: 'Invalid winner variant ID for this test campaign' });
        }
      }
      
      // Check if result already exists
      const existingResult = await storage.getTestResultByTestId(testId);
      let result;
      
      if (existingResult) {
        await storage.updateTestResult(existingResult.id, validationResult.data);
        result = await storage.getTestResultByTestId(testId);
      } else {
        result = await storage.createTestResult(validationResult.data);
      }
      
      // Update campaign status to completed
      await storage.updateAbTestCampaign(testId, { 
        status: 'completed'
      });
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating/updating test results:', error);
      res.status(500).json({ error: 'Failed to create/update test results' });
    }
  });

  // POST /api/salons/:salonId/ab-test-campaigns/:testId/select-winner - Manual winner selection endpoint
  app.post('/api/salons/:salonId/ab-test-campaigns/:testId/select-winner', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, testId } = req.params;
      const { winnerVariantId, notes } = req.body;
      
      // Verify test belongs to salon
      const campaign = await storage.getAbTestCampaign(testId);
      if (!campaign) {
        return res.status(404).json({ error: 'A/B test campaign not found' });
      }
      if (campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Access denied to this A/B test campaign' });
      }
      
      if (!winnerVariantId) {
        return res.status(400).json({ error: 'Winner variant ID is required' });
      }
      
      // Verify winner variant belongs to this test
      const variant = await storage.getTestVariant(winnerVariantId);
      if (!variant || variant.testCampaignId !== testId) {
        return res.status(400).json({ error: 'Invalid winner variant ID for this test campaign' });
      }
      
      // Create or update test result
      const existingResult = await storage.getTestResultByTestId(testId);
      const resultData = {
        testCampaignId: testId,
        winnerVariantId,
        completedAt: new Date(),
        actionTaken: 'manual_selection',
        notes: notes || 'Winner manually selected',
        implementedAt: new Date()
      };
      
      let result;
      if (existingResult) {
        await storage.updateTestResult(existingResult.id, resultData);
        result = await storage.getTestResultByTestId(testId);
      } else {
        result = await storage.createTestResult(resultData);
      }
      
      // Update campaign status to completed
      await storage.updateAbTestCampaign(testId, { 
        status: 'completed'
      });
      
      // Update winner variant status
      await storage.updateTestVariant(winnerVariantId, { status: 'winner' });
      
      // Update other variants to 'loser' status
      const allVariants = await storage.getTestVariantsByTestId(testId);
      for (const v of allVariants) {
        if (v.id !== winnerVariantId) {
          await storage.updateTestVariant(v.id, { status: 'loser' });
        }
      }
      
      res.json({ 
        success: true, 
        result,
        message: `Variant "${variant.variantName}" selected as winner`
      });
    } catch (error) {
      console.error('Error selecting winner:', error);
      res.status(500).json({ error: 'Failed to select winner' });
    }
  });

  // Automation & Integration

  // POST /api/salons/:salonId/ab-test-campaigns/:testId/start - Start A/B test campaign
  app.post('/api/salons/:salonId/ab-test-campaigns/:testId/start', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, testId } = req.params;
      
      // Verify test belongs to salon
      const campaign = await storage.getAbTestCampaign(testId);
      if (!campaign) {
        return res.status(404).json({ error: 'A/B test campaign not found' });
      }
      if (campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Access denied to this A/B test campaign' });
      }
      
      // Check if campaign can be started
      if (campaign.status !== 'draft' && campaign.status !== 'paused') {
        return res.status(400).json({ error: `Cannot start campaign with status: ${campaign.status}` });
      }
      
      // Verify campaign has at least one variant
      const variants = await storage.getTestVariantsByTestId(testId);
      if (variants.length === 0) {
        return res.status(400).json({ error: 'Campaign must have at least one test variant before starting' });
      }
      
      // Update campaign status
      await storage.updateAbTestCampaign(testId, { 
        status: 'active'
      });
      
      // Get updated campaign
      const updatedCampaign = await storage.getAbTestCampaign(testId);
      
      res.json({ 
        success: true, 
        campaign: updatedCampaign,
        message: 'A/B test campaign started successfully'
      });
    } catch (error) {
      console.error('Error starting A/B test campaign:', error);
      res.status(500).json({ error: 'Failed to start A/B test campaign' });
    }
  });

  // POST /api/salons/:salonId/ab-test-campaigns/:testId/pause - Pause A/B test campaign
  app.post('/api/salons/:salonId/ab-test-campaigns/:testId/pause', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, testId } = req.params;
      
      // Verify test belongs to salon
      const campaign = await storage.getAbTestCampaign(testId);
      if (!campaign) {
        return res.status(404).json({ error: 'A/B test campaign not found' });
      }
      if (campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Access denied to this A/B test campaign' });
      }
      
      // Check if campaign can be paused
      if (campaign.status !== 'active') {
        return res.status(400).json({ error: `Cannot pause campaign with status: ${campaign.status}` });
      }
      
      // Update campaign status
      await storage.updateAbTestCampaign(testId, { 
        status: 'paused'
      });
      
      // Get updated campaign
      const updatedCampaign = await storage.getAbTestCampaign(testId);
      
      res.json({ 
        success: true, 
        campaign: updatedCampaign,
        message: 'A/B test campaign paused successfully'
      });
    } catch (error) {
      console.error('Error pausing A/B test campaign:', error);
      res.status(500).json({ error: 'Failed to pause A/B test campaign' });
    }
  });

  // POST /api/salons/:salonId/ab-test-campaigns/:testId/complete - Complete A/B test campaign
  app.post('/api/salons/:salonId/ab-test-campaigns/:testId/complete', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, testId } = req.params;
      const { winnerVariantId, notes } = req.body;
      
      // Verify test belongs to salon
      const campaign = await storage.getAbTestCampaign(testId);
      if (!campaign) {
        return res.status(404).json({ error: 'A/B test campaign not found' });
      }
      if (campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Access denied to this A/B test campaign' });
      }
      
      // Check if campaign can be completed
      if (campaign.status === 'completed') {
        return res.status(400).json({ error: 'Campaign is already completed' });
      }
      
      // Update campaign status
      await storage.updateAbTestCampaign(testId, { 
        status: 'completed'
      });
      
      // Create result if winner is specified
      if (winnerVariantId) {
        const variant = await storage.getTestVariant(winnerVariantId);
        if (!variant || variant.testCampaignId !== testId) {
          return res.status(400).json({ error: 'Invalid winner variant ID for this test campaign' });
        }
        
        const existingResult = await storage.getTestResultByTestId(testId);
        const resultData = {
          testCampaignId: testId,
          winnerVariantId,
          completedAt: new Date(),
          actionTaken: 'manual_selection',
          notes: notes || 'Campaign completed with manual winner selection'
        };
        
        if (existingResult) {
          await storage.updateTestResult(existingResult.id, resultData);
        } else {
          await storage.createTestResult(resultData);
        }
        
        // Update variant statuses
        await storage.updateTestVariant(winnerVariantId, { status: 'winner' });
        const allVariants = await storage.getTestVariantsByTestId(testId);
        for (const v of allVariants) {
          if (v.id !== winnerVariantId) {
            await storage.updateTestVariant(v.id, { status: 'loser' });
          }
        }
      }
      
      // Get updated campaign
      const updatedCampaign = await storage.getAbTestCampaign(testId);
      
      res.json({ 
        success: true, 
        campaign: updatedCampaign,
        message: 'A/B test campaign completed successfully'
      });
    } catch (error) {
      console.error('Error completing A/B test campaign:', error);
      res.status(500).json({ error: 'Failed to complete A/B test campaign' });
    }
  });

  // GET /api/salons/:salonId/ab-test-campaigns/:testId/auto-optimize - Check auto-optimization status
  app.get('/api/salons/:salonId/ab-test-campaigns/:testId/auto-optimize', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, testId } = req.params;
      
      // Verify test belongs to salon
      const campaign = await storage.getAbTestCampaign(testId);
      if (!campaign) {
        return res.status(404).json({ error: 'A/B test campaign not found' });
      }
      if (campaign.salonId !== salonId) {
        return res.status(403).json({ error: 'Access denied to this A/B test campaign' });
      }
      
      // Get performance summary for optimization analysis
      const performanceSummary = await storage.getAbTestPerformanceSummary(testId);
      
      // Check if auto-optimization is enabled
      const autoOptimizationEnabled = campaign.autoOptimization === 1;
      
      // Simple optimization logic - can be enhanced
      let optimizationRecommendation = null;
      let shouldOptimize = false;
      
      if (campaign.status === 'active' && performanceSummary.variants.length > 1) {
        // Find best performing variant based on success metric
        const sortedVariants = performanceSummary.variants.sort((a, b) => {
          const metricA = campaign.successMetric === 'open_rate' ? a.openRate :
                          campaign.successMetric === 'click_rate' ? a.clickRate :
                          campaign.successMetric === 'conversion_rate' ? a.conversionRate :
                          a.bookingRate;
          const metricB = campaign.successMetric === 'open_rate' ? b.openRate :
                          campaign.successMetric === 'click_rate' ? b.clickRate :
                          campaign.successMetric === 'conversion_rate' ? b.conversionRate :
                          b.bookingRate;
          return metricB - metricA;
        });
        
        const bestVariant = sortedVariants[0];
        const controlVariant = performanceSummary.variants.find(v => v.variantId === campaign.baseTemplateId);
        
        // Simple criteria: if best variant performs 20% better than control and we have enough data
        if (controlVariant && bestVariant && performanceSummary.totalParticipants > 100) {
          const controlMetric = campaign.successMetric === 'open_rate' ? controlVariant.openRate :
                               campaign.successMetric === 'click_rate' ? controlVariant.clickRate :
                               campaign.successMetric === 'conversion_rate' ? controlVariant.conversionRate :
                               controlVariant.bookingRate;
          const bestMetric = campaign.successMetric === 'open_rate' ? bestVariant.openRate :
                            campaign.successMetric === 'click_rate' ? bestVariant.clickRate :
                            campaign.successMetric === 'conversion_rate' ? bestVariant.conversionRate :
                            bestVariant.bookingRate;
          
          const improvement = controlMetric > 0 ? ((bestMetric - controlMetric) / controlMetric) * 100 : 0;
          
          if (improvement > 20) {
            shouldOptimize = true;
            optimizationRecommendation = {
              recommendedWinner: bestVariant,
              improvement: improvement,
              confidence: 'medium', // Could be enhanced with statistical significance testing
              reason: `Best variant shows ${improvement.toFixed(1)}% improvement over control`
            };
          }
        }
      }
      
      res.json({
        autoOptimizationEnabled,
        shouldOptimize,
        optimizationRecommendation,
        campaign: {
          id: campaign.id,
          status: campaign.status,
          successMetric: campaign.successMetric,
          autoOptimization: campaign.autoOptimization
        },
        performanceSummary
      });
    } catch (error) {
      console.error('Error checking auto-optimization status:', error);
      res.status(500).json({ error: 'Failed to check auto-optimization status' });
    }
  });

  // Customer authentication middleware - ensures user has customer role
  const requireCustomerAuth = async (req: any, res: any, next: any) => {
    await isAuthenticated(req, res, async () => {
      try {
        // Check if user has customer role
        if (!req.user?.roles?.includes('customer')) {
          return res.status(403).json({ message: "Customer access required" });
        }
        next();
      } catch (error) {
        console.error("Customer authorization error:", error);
        return res.status(403).json({ message: "Authorization failed" });
      }
    });
  };

  // Customer Dashboard API Endpoints
  
  // Get customer appointments
  app.get('/api/customer/appointments', requireCustomerAuth, async (req: any, res) => {
    try {
      const customerId = req.user.id;
      const filters = {
        status: req.query.status as "upcoming" | "completed" | "cancelled" | "all" || "all",
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
      };

      // Validate query parameters
      const validStatuses = ["upcoming", "completed", "cancelled", "all"];
      if (!validStatuses.includes(filters.status)) {
        return res.status(400).json({ 
          error: "Invalid status parameter", 
          validValues: validStatuses 
        });
      }

      if (filters.limit > 100) {
        return res.status(400).json({ 
          error: "Limit cannot exceed 100" 
        });
      }

      const appointments = await storage.getCustomerAppointments(customerId, filters);
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching customer appointments:', error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  });

  // Get customer profile with stats
  app.get('/api/customer/profile', requireCustomerAuth, async (req: any, res) => {
    try {
      const customerId = req.user.id;
      const profile = await storage.getCustomerProfileWithStats(customerId);
      res.json(profile);
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      res.status(500).json({ error: 'Failed to fetch customer profile' });
    }
  });

  // Get customer payment history
  app.get('/api/customer/payments', requireCustomerAuth, async (req: any, res) => {
    try {
      const customerId = req.user.id;
      const payments = await storage.getCustomerPaymentHistory(customerId);
      res.json(payments);
    } catch (error) {
      console.error('Error fetching customer payment history:', error);
      res.status(500).json({ error: 'Failed to fetch payment history' });
    }
  });

  // Update customer profile
  app.patch('/api/customer/profile', requireCustomerAuth, async (req: any, res) => {
    try {
      const customerId = req.user.id;
      
      // Validate request body using zod schema
      const validation = updateCustomerProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      const { firstName, lastName, phone, preferences } = validation.data;
      
      // Update user profile fields
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (phone !== undefined) updateData.phone = phone;
      
      // Update user record
      if (Object.keys(updateData).length > 0) {
        await storage.updateUser(customerId, updateData);
      }
      
      // Update user preferences if provided
      if (preferences !== undefined) {
        await storage.updateUserPreferences(customerId, preferences);
      }
      
      res.json({ 
        success: true, 
        message: 'Profile updated successfully' 
      });
    } catch (error: any) {
      console.error('Error updating customer profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Update customer appointment status (cancel, confirm, etc.)
  app.patch('/api/customer/appointments/:id', requireCustomerAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Validate status parameter
      if (!['cancelled', 'confirmed', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be one of: cancelled, confirmed, pending' });
      }
      
      // Update appointment status with customer email validation
      await storage.updateBookingStatusWithCustomerValidation(id, req.user.email, status);
      
      res.json({ 
        success: true, 
        message: `Appointment ${status} successfully` 
      });
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      if (error.message === 'Booking not found or access denied') {
        res.status(404).json({ error: 'Appointment not found or access denied' });
      } else {
        res.status(500).json({ error: 'Failed to update appointment' });
      }
    }
  });

  // ===============================================
  // DATA MIGRATION ENDPOINTS (Admin only)
  // ===============================================
  
  // Geocoding migration endpoint - re-geocode all salon addresses to ensure coordinate accuracy
  app.post('/api/admin/migrate/geocode-salons', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user has admin role (basic authorization check)
      const userRoles = req.user?.roles || [];
      if (!userRoles.includes('admin') && !userRoles.includes('owner')) {
        return res.status(403).json({ error: 'Unauthorized - Admin access required' });
      }

      console.log('Starting salon geocoding migration...');
      
      // Initialize migration results tracking
      const migrationResults = {
        startTime: new Date().toISOString(),
        totalSalons: 0,
        successfulGeocode: 0,
        failedGeocode: 0,
        alreadyAccurate: 0,
        updated: 0,
        errors: [] as string[],
        details: [] as Array<{
          id: string;
          name: string;
          originalAddress: string;
          originalLat: number | null;
          originalLng: number | null;
          newLat: number | null;
          newLng: number | null;
          status: string;
          error: string | null;
        }>,
        endTime: ''
      };

      // Get all active salons
      const salons = await storage.getAllSalons();
      const activeSalons = salons.filter(salon => salon.isActive);
      migrationResults.totalSalons = activeSalons.length;

      console.log(`Found ${activeSalons.length} active salons to process`);

      // Process each salon
      for (const salon of activeSalons) {
        const salonDetail = {
          id: salon.id,
          name: salon.name,
          originalAddress: `${salon.address}, ${salon.city}, ${salon.state}`,
          originalLat: salon.latitude ? parseFloat(salon.latitude as string) : null,
          originalLng: salon.longitude ? parseFloat(salon.longitude as string) : null,
          newLat: null as number | null,
          newLng: null as number | null,
          status: 'pending' as string,
          error: null as string | null
        };

        try {
          // Build full address for geocoding
          const fullAddress = `${salon.address}, ${salon.city}, ${salon.state}`;
          
          console.log(`Geocoding salon "${salon.name}" at address: ${fullAddress}`);

          // Make internal request to geocoding endpoint
          const geocodeUrl = `http://localhost:5000/api/places/geocode?address=${encodeURIComponent(fullAddress)}`;
          const geocodeResponse = await fetch(geocodeUrl);

          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            
            if (geocodeData.lat && geocodeData.lng) {
              const newLat = parseFloat(geocodeData.lat);
              const newLng = parseFloat(geocodeData.lng);
              
              // Validate coordinate ranges
              if (newLat >= -90 && newLat <= 90 && newLng >= -180 && newLng <= 180) {
                salonDetail.newLat = newLat;
                salonDetail.newLng = newLng;
                
                // Check if coordinates changed significantly (more than ~100 meters difference)
                const coordsChanged = !salon.latitude || !salon.longitude ||
                  Math.abs(newLat - parseFloat(salon.latitude as string)) > 0.001 ||
                  Math.abs(newLng - parseFloat(salon.longitude as string)) > 0.001;

                if (coordsChanged) {
                  // Update salon coordinates using transaction for safety
                  await storage.updateSalon(salon.id, {
                    latitude: newLat.toString(),
                    longitude: newLng.toString()
                  });
                  
                  salonDetail.status = 'updated';
                  migrationResults.updated++;
                  console.log(`✅ Updated coordinates for "${salon.name}": ${newLat}, ${newLng}`);
                } else {
                  salonDetail.status = 'already_accurate';
                  migrationResults.alreadyAccurate++;
                  console.log(`✓ Coordinates already accurate for "${salon.name}"`);
                }
                
                migrationResults.successfulGeocode++;
              } else {
                salonDetail.status = 'invalid_coordinates';
                salonDetail.error = `Invalid coordinate ranges: lat=${newLat}, lng=${newLng}`;
                migrationResults.failedGeocode++;
                migrationResults.errors.push(`${salon.name}: Invalid coordinate ranges`);
                console.warn(`⚠️ Invalid coordinates for "${salon.name}": ${newLat}, ${newLng}`);
              }
            } else {
              salonDetail.status = 'geocode_no_result';
              salonDetail.error = 'Geocoding returned no coordinates';
              migrationResults.failedGeocode++;
              migrationResults.errors.push(`${salon.name}: No coordinates returned`);
              console.warn(`⚠️ No coordinates returned for "${salon.name}"`);
            }
          } else {
            const errorData = await geocodeResponse.text();
            salonDetail.status = 'geocode_failed';
            salonDetail.error = `Geocoding API error: ${geocodeResponse.status}`;
            migrationResults.failedGeocode++;
            migrationResults.errors.push(`${salon.name}: Geocoding API error`);
            console.error(`❌ Geocoding failed for "${salon.name}": ${errorData}`);
          }
        } catch (error) {
          salonDetail.status = 'exception';
          salonDetail.error = error instanceof Error ? error.message : 'Unknown error';
          migrationResults.failedGeocode++;
          migrationResults.errors.push(`${salon.name}: ${salonDetail.error}`);
          console.error(`❌ Exception geocoding "${salon.name}":`, error);
        }
        
        migrationResults.details.push(salonDetail);
        
        // Small delay to avoid overwhelming the geocoding service
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      migrationResults.endTime = new Date().toISOString();
      
      console.log('Salon geocoding migration completed:');
      console.log(`- Total salons: ${migrationResults.totalSalons}`);
      console.log(`- Successfully geocoded: ${migrationResults.successfulGeocode}`);
      console.log(`- Updated coordinates: ${migrationResults.updated}`);
      console.log(`- Already accurate: ${migrationResults.alreadyAccurate}`);
      console.log(`- Failed geocoding: ${migrationResults.failedGeocode}`);

      // Return comprehensive results
      res.json({
        success: true,
        message: 'Salon geocoding migration completed',
        results: migrationResults
      });
      
    } catch (error: any) {
      console.error('Migration error:', error);
      res.status(500).json({ 
        error: 'Migration failed', 
        message: error.message,
        details: 'Check server logs for more information'
      });
    }
  });

  // ==================== SUPER ADMIN ROUTES ====================
  
  // Platform analytics dashboard
  app.get('/api/admin/platform-stats', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { period } = req.query;
      const stats = await storage.getPlatformStats(period as string);
      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching platform stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Business management - get all salons with filters
  app.get('/api/admin/salons', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { status, approvalStatus, city, search } = req.query;
      const salons = await storage.getAllSalonsForAdmin({
        status: status as string,
        approvalStatus: approvalStatus as string,
        city: city as string,
        search: search as string
      });
      res.json(salons);
    } catch (error: any) {
      console.error('Error fetching salons for admin:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Approve salon
  app.post('/api/admin/salons/:salonId/approve', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { salonId } = req.params;
      await storage.approveSalon(salonId, req.user!.id);
      res.json({ success: true, message: 'Salon approved successfully' });
    } catch (error: any) {
      console.error('Error approving salon:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Reject salon
  app.post('/api/admin/salons/:salonId/reject', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { salonId } = req.params;
      const { reason } = req.body;
      await storage.rejectSalon(salonId, reason, req.user!.id);
      res.json({ success: true, message: 'Salon rejected successfully' });
    } catch (error: any) {
      console.error('Error rejecting salon:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // User management - get all users with filters
  app.get('/api/admin/users', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { role, isActive, search } = req.query;
      const users = await storage.getAllUsersForAdmin({
        role: role as string,
        isActive: isActive ? parseInt(isActive as string) : undefined,
        search: search as string
      });
      res.json(users);
    } catch (error: any) {
      console.error('Error fetching users for admin:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Toggle user active status
  app.patch('/api/admin/users/:userId/toggle-active', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      await storage.toggleUserActive(userId, isActive);
      res.json({ success: true, message: 'User status updated successfully' });
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Booking analytics - get all bookings with filters
  app.get('/api/admin/bookings', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { status, salonId, startDate, endDate } = req.query;
      const bookings = await storage.getAllBookingsForAdmin({
        status: status as string,
        salonId: salonId as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      res.json(bookings);
    } catch (error: any) {
      console.error('Error fetching bookings for admin:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get salon booking stats
  app.get('/api/admin/salons/:salonId/stats', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { salonId } = req.params;
      const stats = await storage.getSalonBookingStats(salonId);
      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching salon stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Platform configuration
  app.get('/api/admin/config/:key', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { key } = req.params;
      const value = await storage.getPlatformConfig(key);
      res.json({ key, value });
    } catch (error: any) {
      console.error('Error fetching platform config:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/config', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { key, value } = req.body;
      await storage.setPlatformConfig(key, value, req.user!.id);
      res.json({ success: true, message: 'Platform config updated successfully' });
    } catch (error: any) {
      console.error('Error updating platform config:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Platform settings (consolidated endpoint for settings UI)
  app.get('/api/admin/settings', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const offerApprovalSettings = await storage.getPlatformConfig('offerApprovalSettings') || { autoApproveSalonOffers: true };
      
      res.json({
        offerApprovalSettings
      });
    } catch (error: any) {
      console.error('Error fetching platform settings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/admin/settings', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { offerApprovalSettings } = req.body;
      
      if (offerApprovalSettings !== undefined) {
        // Validate settings structure
        const settingsSchema = z.object({
          autoApproveSalonOffers: z.boolean()
        });
        const validatedSettings = settingsSchema.parse(offerApprovalSettings);
        
        // Track settings change for analytics/audit
        console.log(`[ADMIN_ANALYTICS] Settings updated by ${req.user!.id}:`, {
          setting: 'offerApprovalSettings',
          oldValue: await storage.getPlatformConfig('offerApprovalSettings'),
          newValue: validatedSettings,
          timestamp: new Date().toISOString()
        });
        
        await storage.setPlatformConfig('offerApprovalSettings', validatedSettings, req.user!.id);
        
        res.json({ 
          success: true, 
          message: 'Platform settings updated successfully',
          settings: {
            offerApprovalSettings: validatedSettings
          }
        });
      } else {
        res.json({ 
          success: true, 
          message: 'No settings to update',
          settings: {
            offerApprovalSettings: await storage.getPlatformConfig('offerApprovalSettings')
          }
        });
      }
    } catch (error: any) {
      console.error('Error updating platform settings:', error);
      const status = error.name === 'ZodError' ? 400 : 500;
      res.status(status).json({ error: error.message });
    }
  });

  // Commission & Payouts
  app.get('/api/admin/salons/:salonId/earnings', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { salonId } = req.params;
      const earnings = await storage.getSalonEarnings(salonId);
      res.json(earnings);
    } catch (error: any) {
      console.error('Error fetching salon earnings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/payouts', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { salonId, amount } = req.body;
      const payout = await storage.createPayout(salonId, amount);
      res.json(payout);
    } catch (error: any) {
      console.error('Error creating payout:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/payouts/:payoutId/approve', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { payoutId } = req.params;
      await storage.approvePayout(payoutId, req.user!.id);
      res.json({ success: true, message: 'Payout approved successfully' });
    } catch (error: any) {
      console.error('Error approving payout:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/payouts/:payoutId/reject', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { payoutId } = req.params;
      const { reason } = req.body;
      await storage.rejectPayout(payoutId, reason, req.user!.id);
      res.json({ success: true, message: 'Payout rejected successfully' });
    } catch (error: any) {
      console.error('Error rejecting payout:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/admin/payouts', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { status, salonId } = req.query;
      const payouts = await storage.getAllPayouts({
        status: status as string,
        salonId: salonId as string
      });
      res.json(payouts);
    } catch (error: any) {
      console.error('Error fetching payouts:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== SALON OWNER OFFER ROUTES ====================
  
  // Get salon's own offers
  app.get('/api/salons/:salonId/offers', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const offers = await storage.getSalonOffers(salonId);
      res.json(offers);
    } catch (error: any) {
      console.error('Error fetching salon offers:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create salon offer (with auto-approve logic)
  app.post('/api/salons/:salonId/offers', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const validatedData = createOfferSchema.parse(req.body);
      const offer = await storage.createSalonOffer(salonId, validatedData, req.user!.id);
      
      // Return offer with approval metadata for UI
      res.json({
        ...offer,
        _meta: {
          autoApproved: offer.autoApproved === 1,
          needsApproval: offer.approvalStatus === 'pending'
        }
      });
    } catch (error: any) {
      console.error('Error creating salon offer:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Update salon offer (with re-approval logic)
  app.patch('/api/salons/:salonId/offers/:offerId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, offerId } = req.params;
      const validatedData = updateOfferSchema.parse(req.body);
      
      // Get offer before update to check if it exists and track approval transitions
      const offerBefore = await storage.getOfferById(offerId);
      if (!offerBefore) {
        return res.status(404).json({ error: 'Offer not found' });
      }
      
      // Update offer (storage layer handles ownership validation and approval logic)
      await storage.updateSalonOffer(offerId, salonId, validatedData, req.user!.id);
      
      // Get updated offer for metadata
      const offerAfter = await storage.getOfferById(offerId);
      if (!offerAfter) {
        return res.status(500).json({ error: 'Failed to retrieve updated offer' });
      }
      
      // Inform UI if edit triggered re-approval and include full approval metadata
      res.json({ 
        success: true, 
        message: 'Offer updated successfully',
        offer: offerAfter,
        _meta: {
          requiresReapproval: offerBefore.approvalStatus === 'approved' && offerAfter.approvalStatus === 'pending',
          approvalStatus: offerAfter.approvalStatus,
          autoApproved: offerAfter.autoApproved === 1
        }
      });
    } catch (error: any) {
      console.error('Error updating salon offer:', error);
      const status = error.message.includes('Unauthorized') ? 403 : 400;
      res.status(status).json({ error: error.message });
    }
  });

  // Toggle salon offer status
  app.post('/api/salons/:salonId/offers/:offerId/toggle', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, offerId } = req.params;
      const validatedData = toggleOfferStatusSchema.parse(req.body);
      await storage.toggleSalonOfferStatus(offerId, salonId, validatedData.isActive);
      res.json({ success: true, message: 'Offer status updated successfully' });
    } catch (error: any) {
      console.error('Error toggling salon offer status:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Delete salon offer
  app.delete('/api/salons/:salonId/offers/:offerId', isAuthenticated, requireSalonAccess(), async (req: any, res) => {
    try {
      const { salonId, offerId } = req.params;
      await storage.deleteSalonOffer(offerId, salonId);
      res.json({ success: true, message: 'Offer deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting salon offer:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // ===============================================
  // GOOGLE PLACES API ENDPOINTS (Authenticated)
  // ===============================================

  // Rate limiter for Google Places (10 requests per minute per user)
  const googlePlacesRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Too many requests to Google Places API. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Search for nearby businesses using Google Places API
  app.post('/api/google-places/search', isAuthenticated, googlePlacesRateLimiter, async (req: any, res) => {
    try {
      const schema = z.object({
        latitude: z.number(),
        longitude: z.number(),
        businessName: z.string().min(1),
        radius: z.number().optional().default(50),
      });

      const validatedData = schema.parse(req.body);
      
      const googlePlacesService = getGooglePlacesService();
      const results = await googlePlacesService.searchNearby(validatedData);
      
      res.json({ results });
    } catch (error: any) {
      console.error('Google Places search error:', error);
      res.status(500).json({ error: error.message || 'Failed to search nearby businesses' });
    }
  });

  // Import Google reviews for a salon
  app.post('/api/salons/:salonId/google-places/import', isAuthenticated, requireSalonAccess(), googlePlacesRateLimiter, async (req: any, res) => {
    try {
      const { salonId } = req.params;
      
      const schema = z.object({
        placeId: z.string().min(1),
      });

      const validatedData = schema.parse(req.body);
      
      const googlePlacesService = getGooglePlacesService();
      const result = await googlePlacesService.importReviews({
        placeId: validatedData.placeId,
        salonId,
      });
      
      res.json(result);
    } catch (error: any) {
      console.error('Google reviews import error:', error);
      res.status(500).json({ error: error.message || 'Failed to import Google reviews' });
    }
  });

  // ===============================================
  // REVIEW API ENDPOINTS
  // ===============================================

  // Get reviews for a salon (with optional source filtering)
  app.get('/api/salons/:salonId/reviews', async (req, res) => {
    try {
      const { salonId } = req.params;
      const { source } = req.query;
      
      const sourceFilter = source === 'google' || source === 'salonhub' ? source : undefined;
      const reviews = await storage.getReviewsBySalonId(salonId, sourceFilter);
      
      res.json({ reviews });
    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({ error: 'Failed to get reviews' });
    }
  });

  // Create a new review (verified bookings only)
  app.post('/api/salons/:salonId/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const userId = req.user.id;
      
      const schema = z.object({
        bookingId: z.string().uuid(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      });

      const validatedData = schema.parse(req.body);
      
      // Verify booking belongs to user and is completed
      const booking = await storage.getBooking(validatedData.bookingId);
      
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      if (booking.customerEmail !== req.user.email) {
        return res.status(403).json({ error: 'You can only review your own bookings' });
      }
      
      if (booking.status !== 'completed') {
        return res.status(400).json({ error: 'You can only review completed bookings' });
      }
      
      // Create review
      const review = await storage.createReview({
        salonId,
        customerId: userId,
        bookingId: validatedData.bookingId,
        rating: validatedData.rating,
        comment: validatedData.comment || null,
        source: 'salonhub',
        isVerified: 1,
        googleAuthorName: null,
        googleAuthorPhoto: null,
        googleReviewId: null,
        googlePublishedAt: null,
      });
      
      // Update salon rating
      await storage.updateSalonRating(salonId);
      
      res.json({ review });
    } catch (error: any) {
      console.error('Create review error:', error);
      res.status(500).json({ error: error.message || 'Failed to create review' });
    }
  });

  // ==================== ADMIN OFFER ROUTES ====================
  
  // Get all offers with filters (includes approval source metadata)
  app.get('/api/admin/offers', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { status, approvalStatus, isPlatformWide, salonId, ownedBySalonId, autoApproved } = req.query;
      const offers = await storage.getAllOffers({
        status: status as string,
        approvalStatus: approvalStatus as string,
        isPlatformWide: isPlatformWide ? parseInt(isPlatformWide as string) : undefined,
        salonId: salonId as string,
        ownedBySalonId: ownedBySalonId as string
      });
      
      // Filter by auto-approved if requested
      let filteredOffers = offers;
      if (autoApproved !== undefined) {
        const isAutoApproved = autoApproved === '1' || autoApproved === 'true';
        filteredOffers = offers.filter(o => (o.autoApproved === 1) === isAutoApproved);
      }
      
      // Enrich with metadata for admin UI
      const enrichedOffers = filteredOffers.map(offer => ({
        ...offer,
        _meta: {
          approvalSource: offer.autoApproved === 1 ? 'auto' : 'manual',
          isSalonOwned: offer.ownedBySalonId !== null,
          isPlatformOffer: offer.ownedBySalonId === null
        }
      }));
      
      res.json(enrichedOffers);
    } catch (error: any) {
      console.error('Error fetching offers:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create new offer (Super Admin - Platform-wide only)
  app.post('/api/admin/offers', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = createOfferSchema.parse(req.body);
      
      // Super admin can ONLY create platform-wide offers (not for specific salons)
      const offerData = { 
        ...validatedData,
        isPlatformWide: 1, // Force platform-wide
        salonId: null, // No specific salon
        ownedBySalonId: null, // Created by super admin
        approvalStatus: 'approved', // Super admin offers are auto-approved
        createdBy: req.user!.id,
        validFrom: new Date(validatedData.validFrom),
        validUntil: new Date(validatedData.validUntil),
        imageUrl: validatedData.imageUrl, // Promotional image for offer card
      };
      const offer = await storage.createOffer(offerData);
      res.json(offer);
    } catch (error: any) {
      console.error('Error creating offer:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Update offer
  app.patch('/api/admin/offers/:offerId', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { offerId } = req.params;
      const validatedData = updateOfferSchema.parse(req.body);
      await storage.updateOffer(offerId, validatedData);
      res.json({ success: true, message: 'Offer updated successfully' });
    } catch (error: any) {
      console.error('Error updating offer:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Approve offer
  app.post('/api/admin/offers/:offerId/approve', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { offerId } = req.params;
      await storage.approveOffer(offerId, req.user!.id);
      res.json({ success: true, message: 'Offer approved successfully' });
    } catch (error: any) {
      console.error('Error approving offer:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Reject offer
  app.post('/api/admin/offers/:offerId/reject', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { offerId } = req.params;
      const { reason } = approveRejectOfferSchema.parse(req.body);
      if (!reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }
      await storage.rejectOffer(offerId, reason, req.user!.id);
      res.json({ success: true, message: 'Offer rejected successfully' });
    } catch (error: any) {
      console.error('Error rejecting offer:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Toggle offer status
  app.post('/api/admin/offers/:offerId/toggle', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { offerId } = req.params;
      const { isActive } = toggleOfferStatusSchema.parse(req.body);
      await storage.toggleOfferStatus(offerId, isActive);
      res.json({ success: true, message: 'Offer status updated successfully' });
    } catch (error: any) {
      console.error('Error toggling offer status:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Delete offer
  app.delete('/api/admin/offers/:offerId', populateUserFromSession, requireSuperAdmin(), async (req: AuthenticatedRequest, res) => {
    try {
      const { offerId } = req.params;
      await storage.deleteOffer(offerId);
      res.json({ success: true, message: 'Offer deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting offer:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ CUSTOMER-FACING OFFERS & WALLET API ============

  // Get customer wallet
  app.get('/api/wallet', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      let wallet = await storage.getUserWallet(req.user!.id);
      if (!wallet) {
        wallet = await storage.createUserWallet(req.user!.id);
      }
      res.json(wallet);
    } catch (error: any) {
      console.error('Error getting wallet:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get wallet transactions
  app.get('/api/wallet/transactions', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const transactions = await storage.getWalletTransactions(req.user!.id);
      res.json(transactions);
    } catch (error: any) {
      console.error('Error getting wallet transactions:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get available offers for customer
  app.get('/api/offers', async (req: AuthenticatedRequest, res) => {
    try {
      const { salonId } = req.query;
      const userId = req.user?.id || 'guest';
      const offers = await storage.getCustomerOffers(userId, salonId as string);
      res.json(offers);
    } catch (error: any) {
      console.error('Error getting customer offers:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Calculate best applicable offer for booking (Smart Auto-Apply)
  app.post('/api/offers/calculate', async (req: AuthenticatedRequest, res) => {
    try {
      const { salonId, totalAmountPaisa, promoCode } = req.body;

      if (!salonId || totalAmountPaisa === undefined) {
        return res.status(400).json({ 
          error: 'Missing required fields: salonId and totalAmountPaisa' 
        });
      }

      // Fetch all applicable offers for this salon
      const userId = req.user?.id || 'guest';
      const offers = await storage.getCustomerOffers(userId, salonId);

      // Filter only active and approved offers
      const activeOffers = offers.filter((offer: any) => 
        offer.isActive === 1 && 
        offer.approvalStatus === 'approved'
      );

      // Calculate all offers with discount amounts
      const calculatedOffers = OfferCalculator.calculateAllOffers(
        activeOffers,
        totalAmountPaisa,
        salonId
      );

      // Get the best offer (highest discount or promo code match)
      const bestOffer = OfferCalculator.getBestOffer(
        activeOffers,
        totalAmountPaisa,
        salonId,
        promoCode
      );

      // Get price breakdown
      const priceBreakdown = OfferCalculator.getPriceBreakdown(
        totalAmountPaisa,
        bestOffer
      );

      res.json({
        bestOffer,
        allOffers: calculatedOffers,
        priceBreakdown,
        hasApplicableOffers: bestOffer !== null,
      });
    } catch (error: any) {
      console.error('Error calculating offers:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Validate promo code
  app.post('/api/offers/validate-promo', async (req: AuthenticatedRequest, res) => {
    try {
      const { salonId, promoCode, totalAmountPaisa } = req.body;

      if (!salonId || !promoCode || totalAmountPaisa === undefined) {
        return res.status(400).json({ 
          error: 'Missing required fields: salonId, promoCode, and totalAmountPaisa' 
        });
      }

      // Fetch all applicable offers
      const userId = req.user?.id || 'guest';
      const offers = await storage.getCustomerOffers(userId, salonId);

      // Validate promo code
      const matchedOffer = OfferCalculator.validatePromoCode(promoCode, offers);

      if (!matchedOffer) {
        return res.json({ 
          valid: false, 
          message: 'Invalid promo code' 
        });
      }

      // Check if offer is still valid
      if (!OfferCalculator.isOfferValid(matchedOffer)) {
        return res.json({ 
          valid: false, 
          message: 'This promo code has expired' 
        });
      }

      // Check usage limit
      if (!OfferCalculator.hasUsageRemaining(matchedOffer)) {
        return res.json({ 
          valid: false, 
          message: 'This promo code has reached its usage limit' 
        });
      }

      // Calculate discount
      const discountAmount = OfferCalculator.calculateDiscount(
        matchedOffer,
        totalAmountPaisa
      );

      if (discountAmount === 0) {
        return res.json({ 
          valid: false, 
          message: `Minimum purchase of ₹${matchedOffer.minimumPurchase! / 100} required` 
        });
      }

      res.json({ 
        valid: true, 
        offer: matchedOffer,
        discountAmount,
        finalAmount: totalAmountPaisa - discountAmount,
        message: 'Promo code applied successfully!' 
      });
    } catch (error: any) {
      console.error('Error validating promo code:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Check offer eligibility
  app.get('/api/offers/:offerId/eligibility', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const { offerId } = req.params;
      const eligibility = await storage.getUserOfferEligibility(req.user!.id, offerId);
      res.json(eligibility);
    } catch (error: any) {
      console.error('Error checking offer eligibility:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get customer-facing offers for a salon (platform-wide + salon-specific)
  // Public endpoint - no authentication required for viewing offers
  app.get('/api/offers/customer', async (req, res) => {
    try {
      const { salonId } = req.query;
      const userId = 'guest'; // Default to guest for public viewing
      
      const offers = await storage.getCustomerOffers(userId, salonId as string);
      res.json(offers);
    } catch (error: any) {
      console.error('Error fetching customer offers:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get active launch offers (First 3 Bookings, etc.)
  app.get('/api/launch-offers', async (req, res) => {
    try {
      const offers = await storage.getActiveLaunchOffers();
      res.json(offers);
    } catch (error: any) {
      console.error('Error getting launch offers:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all active offers with salon information (for all-offers page)
  app.get('/api/offers/all-with-salons', async (req, res) => {
    try {
      const offers = await storage.getAllOffersWithSalons();
      res.json(offers);
    } catch (error: any) {
      console.error('Error fetching all offers with salons:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ===== Beauty Products Catalog API =====
  
  // Get all beauty products with filters (for product catalog)
  app.get('/api/beauty-products', async (req, res) => {
    try {
      const { 
        brand, 
        category, 
        search, 
        skinTone, 
        gender,
        limit = '100',
        offset = '0' 
      } = req.query;

      // Build filter conditions
      const conditions = [];
      
      if (brand) {
        const brands = (brand as string).split(',').map(b => b.trim());
        conditions.push(inArray(schema.beautyProducts.brand, brands));
      }
      
      if (category) {
        conditions.push(eq(schema.beautyProducts.category, category as string));
      }
      
      if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(
          or(
            sql`${schema.beautyProducts.name} ILIKE ${searchTerm}`,
            sql`${schema.beautyProducts.brand} ILIKE ${searchTerm}`,
            sql`${schema.beautyProducts.productLine} ILIKE ${searchTerm}`
          )
        );
      }
      
      if (skinTone) {
        const skinTonePattern = `%${skinTone}%`;
        conditions.push(sql`${schema.beautyProducts.skinToneCompatibility} ILIKE ${skinTonePattern}`);
      }
      
      if (gender) {
        conditions.push(
          or(
            eq(schema.beautyProducts.gender, gender as string),
            eq(schema.beautyProducts.gender, 'unisex')
          )
        );
      }

      // Build base query
      let query = db.select().from(schema.beautyProducts);
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Add pagination
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);
      query = query.limit(limitNum).offset(offsetNum);

      const products = await query;
      
      // Get total count for pagination (reuse same where clause)
      const totalCountResult = await db
        .select({ count: sql`count(*)::int` })
        .from(schema.beautyProducts)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      const totalCount = totalCountResult[0]?.count || 0;

      // Inject fallback image for products with missing images
      const DEFAULT_PLACEHOLDER_IMAGE = 'https://placehold.co/400x400/f3f4f6/94a3b8?text=No+Image';
      const productsWithImages = products.map(product => ({
        ...product,
        image_url: product.image_url || DEFAULT_PLACEHOLDER_IMAGE
      }));

      res.json({
        products: productsWithImages,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: totalCount,
          hasMore: offsetNum + products.length < totalCount
        }
      });
    } catch (error: any) {
      console.error('Error fetching beauty products:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get salon's beauty product inventory (products they stock)
  app.get('/api/salons/:salonId/inventory', isAuthenticated, requireSalonAccess(), async (req: AuthenticatedRequest, res) => {
    try {
      const { salonId } = req.params;

      const inventory = await db
        .select({
          inventoryId: schema.salonInventory.id,
          productId: schema.salonInventory.productId,
          quantity: schema.salonInventory.quantity,
          lowStockThreshold: schema.salonInventory.lowStockThreshold,
          lastRestockedAt: schema.salonInventory.lastRestockedAt,
          createdAt: schema.salonInventory.createdAt,
          product: {
            id: schema.beautyProducts.id,
            brand: schema.beautyProducts.brand,
            productLine: schema.beautyProducts.productLine,
            name: schema.beautyProducts.name,
            category: schema.beautyProducts.category,
            shade: schema.beautyProducts.shade,
            sku: schema.beautyProducts.sku,
            finishType: schema.beautyProducts.finishType,
            price: schema.beautyProducts.price,
            imageUrl: schema.beautyProducts.imageUrl,
            description: schema.beautyProducts.description,
          }
        })
        .from(schema.salonInventory)
        .innerJoin(
          schema.beautyProducts,
          eq(schema.salonInventory.productId, schema.beautyProducts.id)
        )
        .where(eq(schema.salonInventory.salonId, salonId))
        .orderBy(schema.beautyProducts.category, schema.beautyProducts.brand);

      res.json(inventory);
    } catch (error: any) {
      console.error('Error fetching salon inventory:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add product to salon inventory
  app.post('/api/salons/:salonId/inventory', isAuthenticated, requireSalonAccess(), async (req: AuthenticatedRequest, res) => {
    try {
      const { salonId } = req.params;
      const { productId, quantity, lowStockThreshold = 5 } = req.body;

      if (!productId) {
        return res.status(400).json({ error: 'productId is required' });
      }

      if (quantity === undefined || quantity < 0) {
        return res.status(400).json({ error: 'Valid quantity is required' });
      }

      // Check if product exists
      const product = await db
        .select()
        .from(schema.beautyProducts)
        .where(eq(schema.beautyProducts.id, productId))
        .limit(1);

      if (product.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check if product already in inventory
      const existing = await db
        .select()
        .from(schema.salonInventory)
        .where(
          and(
            eq(schema.salonInventory.salonId, salonId),
            eq(schema.salonInventory.productId, productId)
          )
        )
        .limit(1);

      let result;

      if (existing.length > 0) {
        // Update existing inventory
        result = await db
          .update(schema.salonInventory)
          .set({
            quantity,
            lowStockThreshold,
            lastRestockedAt: sql`CURRENT_TIMESTAMP`
          })
          .where(
            and(
              eq(schema.salonInventory.salonId, salonId),
              eq(schema.salonInventory.productId, productId)
            )
          )
          .returning();
      } else {
        // Insert new inventory item
        result = await db
          .insert(schema.salonInventory)
          .values({
            salonId,
            productId,
            quantity,
            lowStockThreshold,
            lastRestockedAt: sql`CURRENT_TIMESTAMP`
          })
          .returning();
      }

      res.json({
        success: true,
        inventory: result[0],
        message: existing.length > 0 ? 'Inventory updated successfully' : 'Product added to inventory successfully'
      });
    } catch (error: any) {
      console.error('Error adding product to inventory:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Remove product from salon inventory
  app.delete('/api/salons/:salonId/inventory/:productId', isAuthenticated, requireSalonAccess(), async (req: AuthenticatedRequest, res) => {
    try {
      const { salonId, productId } = req.params;

      await db
        .delete(schema.salonInventory)
        .where(
          and(
            eq(schema.salonInventory.salonId, salonId),
            eq(schema.salonInventory.productId, productId)
          )
        );

      res.json({ success: true, message: 'Product removed from inventory' });
    } catch (error: any) {
      console.error('Error removing product from inventory:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ===============================================
  // PUBLIC TEMP IMAGES ENDPOINT (No Auth Required)
  // Used by LightX API to fetch uploaded images
  // ===============================================
  app.get('/api/temp-images/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const image = tempImageStorage.getImage(id);

      if (!image) {
        return res.status(404).json({ message: 'Image not found or expired' });
      }

      // Set content type and send the image buffer
      res.setHeader('Content-Type', image.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(image.buffer);
    } catch (error: any) {
      console.error('[TempImages] Error serving image:', error);
      res.status(500).json({ message: 'Failed to serve image' });
    }
  });

  // AI Personal Look Advisor routes (Premium feature)
  app.use('/api/premium/ai-look', isAuthenticated, aiLookRoutes);

  const httpServer = createServer(app);

  return httpServer;
}
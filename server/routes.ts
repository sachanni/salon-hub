import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, initializeServices } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { requireSalonAccess, requireStaffAccess, type AuthenticatedRequest } from "./middleware/auth";
import Razorpay from "razorpay";
import crypto from "crypto";
import express from "express";
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
} from "@shared/schema";
import { sendVerificationEmail } from "./emailService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database services
  await initializeServices();
  
  
  // Setup session-based authentication
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
        profileImageUrl: user.profileImageUrl,
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
      const { email, password, firstName, lastName, phone, userType } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      // Hash password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash(password, 10);

      // Create user
      const userData = {
        email,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || null,
        emailVerified: 0,
        phoneVerified: 0,
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

      // Create verification token and send email
      const verificationToken = await storage.createVerificationToken(newUser.email || '', newUser.id);
      const emailSent = await sendVerificationEmail(newUser.email || '', newUser.firstName || 'User', verificationToken);

      // Establish session after successful registration
      req.session.userId = newUser.id;

      console.log("Session established successfully after registration for user:", newUser.id);

      // Success with session established
      const { password: _, ...userResponse } = newUser;
      res.status(200).json({
        success: true,
        user: userResponse,
        message: "Account created successfully! Please check your email to verify your account.",
        emailSent: emailSent,
        requiresVerification: true,
        authenticated: true,
        redirect: '/'  // Frontend will handle this redirect
      });

    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to create account. Please try again." });
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

  // Manual login endpoint (email/password)
  app.post('/api/auth/login', async (req: any, res) => {
    try {
      const { email, password } = req.body;

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

      // Email verification is now optional - users can login without verification
      // We'll show a banner in the dashboard encouraging verification for enhanced security

      // Establish session after successful login
      req.session.userId = user.id;

      // Check user role for redirect
      const roles = await storage.getUserRoles(user.id);
      const isOwner = roles.some(role => role.name === 'owner');
      
      let redirectUrl = '/';
      if (isOwner) {
        // Always redirect business owners to dashboard - dashboard handles setup within tabs
        redirectUrl = '/business/dashboard';
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

  // PUBLIC: Get salon information for customer viewing (no auth required)
  app.get('/api/salons/:salonId', async (req: any, res) => {
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

      // Update booking status to confirmed
      await storage.updateBookingStatus(paymentRecord.bookingId, 'confirmed');

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

  // Get available salons with search functionality
  app.get('/api/salons', async (req, res) => {
    try {
      const { 
        service, 
        location, 
        categories, 
        minPrice, 
        maxPrice, 
        minRating 
      } = req.query;

      const salons = await storage.getAllSalons();
      
      // Format salons for frontend with proper structure including images
      let formattedSalons = await Promise.all(salons.map(async salon => {
        // Get the first media asset as the primary image
        const mediaAssets = await storage.getMediaAssetsBySalonId(salon.id);
        const primaryImage = mediaAssets.find(asset => asset.isPrimary) || mediaAssets[0];
        
        return {
          id: salon.id,
          name: salon.name,
          rating: parseFloat(salon.rating?.toString() || '0'),
          reviewCount: salon.reviewCount,
          location: `${salon.address}, ${salon.city}`,
          category: salon.category,
          priceRange: salon.priceRange,
          openTime: salon.closeTime, // Show when it closes
          image: primaryImage?.url || '' // Include primary image URL
        };
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
      const orgMemberships = req.user.orgMemberships || [];
      
      const allSalons = await storage.getAllSalons();
      
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

  // Salon-specific services endpoints
  // Get services for a specific salon
  // PUBLIC: Get salon services for customer viewing (no auth required)
  app.get('/api/salons/:salonId/services', async (req: any, res) => {
    try {
      const { salonId } = req.params;
      const services = await storage.getServicesBySalonId(salonId);
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
      
      const service = await storage.createService(serviceData);
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

  // Create payment order endpoint - SERVER-SIDE PRICE CALCULATION
  app.post('/api/create-payment-order', async (req, res) => {
    try {
      if (!razorpay) {
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

      // Create booking record BEFORE payment - ensures we have a record
      const booking = await storage.createBooking({
        salonId: input.salonId,
        serviceId: input.serviceId,
        customerName: input.booking.customer.name || '', // Empty string for guest bookings
        customerEmail: input.booking.customer.email,
        customerPhone: input.booking.customer.phone || '', // Empty string for guest bookings
        bookingDate: input.booking.date,
        bookingTime: input.booking.time,
        status: 'pending',
        totalAmountPaisa: service.priceInPaisa, // SERVER-CONTROLLED AMOUNT
        currency: service.currency,
        notes: input.booking.notes,
        guestSessionId: input.booking.guestSessionId // Store guest session ID if provided
      });

      // Create payment record
      const payment = await storage.createPayment({
        bookingId: booking.id,
        amountPaisa: service.priceInPaisa, // SERVER-CONTROLLED AMOUNT
        currency: service.currency,
        status: 'pending',
        razorpayOrderId: null,
        razorpayPaymentId: null,
        razorpaySignature: null
      });

      // Create Razorpay order
      const razorpayOrderOptions = {
        amount: service.priceInPaisa, // Amount in paisa - SERVER CONTROLLED
        currency: service.currency,
        receipt: `bk_${Date.now()}`, // Use timestamp to fit 40 char limit
        notes: {
          booking_id: booking.id,
          payment_id: payment.id,
          service_name: service.name,
          customer_email: input.booking.customer.email
        }
      };

      const order = await razorpay.orders.create(razorpayOrderOptions);
      
      // Update payment with Razorpay order ID
      await storage.updatePaymentOrderId(payment.id, order.id);

      res.json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        booking_id: booking.id,
        payment_id: payment.id
      });
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
      res.json(completion);
    } catch (error) {
      console.error('Error fetching dashboard completion:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard completion status' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
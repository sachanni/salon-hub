import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { storage } from '../storage';
import { analyzeBeautyImageWithFallback, generateApplicationInstructions, type BeautyAnalysisInput } from '../services/gemini.service';
import { matchProductsForLook, resolvePresetsToEffects, decrementInventory, getProductsBySalon } from '../services/product-matcher.service';
import { db } from '../db';
import { aiLookSessions, aiLookOptions, aiLookProducts, salonInventory, beautyProducts } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth';
import { tempImageStorage } from '../services/tempImageStorage';
import multer from 'multer';

const router = Router();

// Rate limiting for expensive AI operations
// Limit: 10 requests per user per 15 minutes
const aiAnalysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each user to 10 requests per window
  message: 'Too many AI analysis requests. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    // Use user ID if authenticated, otherwise fallback to 'anonymous'
    // Don't use IP to avoid IPv6 complexity
    return req.user?.id || 'anonymous';
  },
});

const MAX_IMAGE_SIZE_MB = 10; // 10MB limit
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const analyzeImageSchema = z.object({
  imageBase64: z.string().min(100).max(MAX_IMAGE_SIZE_BYTES, `Image too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB`),
  customerName: z.string().min(1).max(200),
  gender: z.enum(['male', 'female', 'prefer_not']).optional(),
  eventType: z.string().optional(),
  weather: z.string().optional(),
  location: z.string().optional(),
  skinTone: z.string().optional(),
  hairType: z.string().optional(),
  salonId: z.string().uuid(),
  preferredBrands: z.array(z.string()).optional(),
});

const saveSessionSchema = z.object({
  salonId: z.string().uuid(),
  customerName: z.string().min(1),
  gender: z.enum(['male', 'female', 'prefer_not']).optional(),
  customerPhotoUrl: z.string().optional(),
  eventType: z.string().optional(),
  weather: z.string().optional(),
  location: z.string().optional(),
  skinTone: z.string().optional(),
  hairType: z.string().optional(),
  selectedLookIndex: z.number().int().min(0),
  looks: z.array(z.object({
    lookName: z.string(),
    description: z.string(),
    confidenceScore: z.number(),
    presetIds: z.array(z.string()),
    products: z.array(z.object({
      productId: z.string(),
      applicationArea: z.string().optional(),
      quantityNeeded: z.string().optional(),
      isInStock: z.boolean(),
      substituteProductId: z.string().optional(),
    })),
  })),
});

const markProductsUsedSchema = z.object({
  sessionId: z.string().uuid(),
  products: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).default(1),
  })),
});

router.post('/analyze', aiAnalysisLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = analyzeImageSchema.parse(req.body);
    
    // Authorization: Verify user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const salon = await storage.getSalonById(validatedData.salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }
    
    // Verify user has access to this salon (owner, manager, or staff)
    const allowedRoles = ['owner', 'manager', 'staff'];
    const hasAccess = req.user.orgMemberships?.some(
      membership => 
        membership.orgId === salon.orgId && 
        allowedRoles.includes(membership.orgRole)
    );
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to use AI Look for this salon' });
    }

    const analysisInput: BeautyAnalysisInput = {
      imageBase64: validatedData.imageBase64,
      customerName: validatedData.customerName,
      salonId: validatedData.salonId,
      gender: validatedData.gender || 'prefer_not',
      eventType: validatedData.eventType,
      weather: validatedData.weather,
      location: validatedData.location,
      skinTone: validatedData.skinTone,
      hairType: validatedData.hairType,
      preferredBrands: validatedData.preferredBrands,
    };

    console.log(`[AI Look] Starting analysis for ${validatedData.customerName} at salon ${salon.name}`);
    const aiResponse = await analyzeBeautyImageWithFallback(analysisInput);
    console.log(`[AI Look] AI provider (${aiResponse.provider}) returned ${aiResponse.looks.length} looks`);

    const matchedLooks = [];
    for (const look of aiResponse.looks) {
      console.log(`[AI Look] Processing look: "${look.lookName}" with presetCategories:`, look.presetCategories);
      const presetIds = await resolvePresetsToEffects(look.presetCategories);
      console.log(`[AI Look] Resolved presetIds for "${look.lookName}":`, presetIds);
      
      const matchedProductsWithContext = await matchProductsForLook(
        validatedData.salonId,
        look.products,
        validatedData.gender || 'prefer_not'
      );

      const productsWithDetails = matchedProductsWithContext.map(({ product, recommendation }) => ({
        product,
        applicationArea: recommendation.category || '',
        reason: recommendation.reason || '',
        quantityNeeded: '1 unit',
      }));

      matchedLooks.push({
        lookName: look.lookName,
        description: look.description,
        confidenceScore: look.confidenceScore,
        presetIds,
        products: productsWithDetails,
      });
    }

    return res.json({
      success: true,
      customerAnalysis: aiResponse.customerAnalysis,
      looks: matchedLooks,
      provider: aiResponse.provider,
    });
  } catch (error: any) {
    console.error('[AI Look] Analysis error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Invalid request data', 
        errors: error.errors 
      });
    }

    return res.status(500).json({ 
      message: 'AI analysis failed',
      error: error.message 
    });
  }
});

router.post('/save-session', async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = saveSessionSchema.parse(req.body);

    // Authorization: Verify user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const salon = await storage.getSalonById(validatedData.salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    // Verify user has access to this salon (owner, manager, or staff)
    const allowedRoles = ['owner', 'manager', 'staff'];
    const hasAccess = req.user.orgMemberships?.some(
      membership => 
        membership.orgId === salon.orgId && 
        allowedRoles.includes(membership.orgRole)
    );
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to save sessions for this salon' });
    }

    // Server-side validation: Verify all product IDs exist in beauty_products table
    const allProductIds = validatedData.looks.flatMap(look => 
      look.products.map(p => p.productId)
    );
    
    if (allProductIds.length > 0) {
      const existingProducts = await db
        .select({ id: beautyProducts.id })
        .from(beautyProducts)
        .where(
          sql`${beautyProducts.id} = ANY(${allProductIds}::text[])`
        );
      
      const existingProductIds = new Set(existingProducts.map(p => p.id));
      const invalidProductIds = allProductIds.filter(id => !existingProductIds.has(id));
      
      if (invalidProductIds.length > 0) {
        return res.status(400).json({ 
          message: 'Invalid product IDs detected', 
          invalidIds: invalidProductIds.slice(0, 5) // Show first 5 for debugging
        });
      }
    }

    // Use database transaction for data consistency
    const result = await db.transaction(async (tx) => {
      const sessionResult = await tx.insert(aiLookSessions).values({
      salonId: validatedData.salonId,
      customerName: validatedData.customerName,
      gender: validatedData.gender || 'prefer_not',
      customerPhotoUrl: validatedData.customerPhotoUrl,
      eventType: validatedData.eventType,
      weather: validatedData.weather,
      location: validatedData.location,
      skinTone: validatedData.skinTone,
      hairType: validatedData.hairType,
      staffUserId: req.user?.id,
    }).returning();

    const session = sessionResult[0];

    for (let i = 0; i < validatedData.looks.length; i++) {
      const look = validatedData.looks[i];
      const isSelected = i === validatedData.selectedLookIndex;

      const lookOptionResult = await tx.insert(aiLookOptions).values({
        sessionId: session.id,
        lookName: look.lookName,
        description: look.description,
        presetIds: JSON.stringify(look.presetIds),
        aiConfidenceScore: look.confidenceScore.toString(),
        isSelected: isSelected ? 1 : 0,
      }).returning();

      const lookOption = lookOptionResult[0];

      for (const product of look.products) {
        await tx.insert(aiLookProducts).values({
          lookOptionId: lookOption.id,
          productId: product.productId,
          applicationArea: product.applicationArea,
          quantityNeeded: product.quantityNeeded,
          isInStock: product.isInStock ? 1 : 0,
          substituteProductId: product.substituteProductId,
        });
      }

      if (isSelected) {
        const productDetails = await tx
          .select({
            productId: aiLookProducts.productId,
            productName: beautyProducts.name,
            brand: beautyProducts.brand,
            category: aiLookProducts.applicationArea,
          })
          .from(aiLookProducts)
          .innerJoin(beautyProducts, eq(beautyProducts.id, aiLookProducts.productId))
          .where(eq(aiLookProducts.lookOptionId, lookOption.id));

        const instructions = await generateApplicationInstructions(
          look.description,
          productDetails.map(p => ({
            category: p.category || '',
            productName: p.productName,
            brand: p.brand,
            attributes: {},
          }))
        );

        await tx.update(aiLookOptions)
          .set({ description: `${look.description}\n\n**Application Instructions:**\n${instructions}` })
          .where(eq(aiLookOptions.id, lookOption.id));
      }
    }

      return { sessionId: session.id };
    });

    return res.json({
      success: true,
      sessionId: result.sessionId,
      message: 'Session saved successfully',
    });
  } catch (error: any) {
    console.error('[AI Look] Save session error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Invalid request data', 
        errors: error.errors 
      });
    }

    return res.status(500).json({ 
      message: 'Failed to save session',
      error: error.message 
    });
  }
});

router.get('/sessions/:salonId', async (req: AuthenticatedRequest, res) => {
  try {
    const { salonId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const sessions = await db
      .select()
      .from(aiLookSessions)
      .where(eq(aiLookSessions.salonId, salonId))
      .orderBy(desc(aiLookSessions.createdAt))
      .limit(limit)
      .offset(offset);

    const sessionsWithLooks = await Promise.all(
      sessions.map(async (session) => {
        const looks = await db
          .select()
          .from(aiLookOptions)
          .where(eq(aiLookOptions.sessionId, session.id));

        const selectedLook = looks.find(l => l.isSelected === 1);

        return {
          ...session,
          selectedLookName: selectedLook?.lookName || null,
          totalLooks: looks.length,
        };
      })
    );

    return res.json({
      success: true,
      sessions: sessionsWithLooks,
      pagination: {
        page,
        limit,
        hasMore: sessions.length === limit,
      },
    });
  } catch (error: any) {
    console.error('[AI Look] Get sessions error:', error);
    return res.status(500).json({ 
      message: 'Failed to retrieve sessions',
      error: error.message 
    });
  }
});

router.get('/session/:sessionId', async (req: AuthenticatedRequest, res) => {
  try {
    const { sessionId } = req.params;

    const sessionData = await db
      .select()
      .from(aiLookSessions)
      .where(eq(aiLookSessions.id, sessionId))
      .limit(1);

    if (sessionData.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const session = sessionData[0];

    const looks = await db
      .select()
      .from(aiLookOptions)
      .where(eq(aiLookOptions.sessionId, sessionId));

    const looksWithProducts = await Promise.all(
      looks.map(async (look) => {
        const products = await db
          .select({
            id: aiLookProducts.id,
            applicationArea: aiLookProducts.applicationArea,
            applicationInstructions: aiLookProducts.applicationInstructions,
            quantityNeeded: aiLookProducts.quantityNeeded,
            isInStock: aiLookProducts.isInStock,
            product: beautyProducts,
          })
          .from(aiLookProducts)
          .innerJoin(beautyProducts, eq(beautyProducts.id, aiLookProducts.productId))
          .where(eq(aiLookProducts.lookOptionId, look.id));

        return {
          ...look,
          presetIds: look.presetIds ? JSON.parse(look.presetIds) : [],
          products,
        };
      })
    );

    return res.json({
      success: true,
      session: {
        ...session,
        looks: looksWithProducts,
      },
    });
  } catch (error: any) {
    console.error('[AI Look] Get session detail error:', error);
    return res.status(500).json({ 
      message: 'Failed to retrieve session details',
      error: error.message 
    });
  }
});

router.post('/mark-products-used', async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = markProductsUsedSchema.parse(req.body);

    const session = await db
      .select()
      .from(aiLookSessions)
      .where(eq(aiLookSessions.id, validatedData.sessionId))
      .limit(1);

    if (session.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const salonId = session[0].salonId;

    for (const item of validatedData.products) {
      try {
        await decrementInventory(salonId, item.productId, item.quantity);
      } catch (error: any) {
        console.warn(`Could not decrement inventory for product ${item.productId}:`, error.message);
      }
    }

    return res.json({
      success: true,
      message: 'Inventory updated successfully',
    });
  } catch (error: any) {
    console.error('[AI Look] Mark products used error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Invalid request data', 
        errors: error.errors 
      });
    }

    return res.status(500).json({ 
      message: 'Failed to update inventory',
      error: error.message 
    });
  }
});

router.get('/inventory/:salonId', async (req: AuthenticatedRequest, res) => {
  try {
    const { salonId } = req.params;

    const products = await getProductsBySalon(salonId);

    return res.json({
      success: true,
      products,
    });
  } catch (error: any) {
    console.error('[AI Look] Get inventory error:', error);
    return res.status(500).json({ 
      message: 'Failed to retrieve inventory',
      error: error.message 
    });
  }
});

// Configure multer for in-memory file storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// Upload endpoint: Receives image file, stores temporarily, returns public URL
router.post('/uploads', aiAnalysisLimiter, upload.single('image'), async (req: AuthenticatedRequest, res) => {
  try {
    // Authentication required
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required to upload images.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Build public URL from request headers (works in production and dev)
    const protocol = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const { publicUrl, imageId, expiresAt } = tempImageStorage.uploadImage(
      req.file.buffer,
      req.file.mimetype,
      baseUrl
    );

    console.log('[Upload] Image uploaded successfully:', imageId, 'by user:', req.user.id, 'public URL:', publicUrl);

    return res.status(201).json({
      success: true,
      publicUrl,
      imageId,
      expiresAt,
    });
  } catch (error: any) {
    console.error('[Upload] Error:', error);
    return res.status(500).json({ 
      message: 'Image upload failed',
      error: error.message 
    });
  }
});

// Note: The public temp-images endpoint has been moved to server/routes.ts
// as a top-level route (/api/temp-images/:id) without authentication
// so that LightX API can access uploaded images.

// ===============================================
// LIGHTX ASYNC POLLING UTILITY
// ===============================================

interface LightXJobResult {
  success: true;
  output_url: string;
  orderId: string;
}

interface LightXJobError {
  success: false;
  message: string;
  orderId?: string;
  statusCode: number;
}

type LightXJobResponse = LightXJobResult | LightXJobError;

/**
 * Helper function to wait/delay for specified milliseconds
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Runs a LightX transformation job with automatic polling
 * @param apiUrl - The LightX API endpoint URL (v1 or v2)
 * @param apiKey - LightX API key
 * @param payload - Request payload (imageUrl, textPrompt)
 * @param jobType - Job type for logging ("Hair Color" or "Hairstyle")
 * @returns Promise with output_url or error details
 */
async function runLightXJob(
  apiUrl: string,
  apiKey: string,
  payload: { imageUrl: string; textPrompt: string },
  jobType: string
): Promise<LightXJobResponse> {
  const POLL_INTERVAL_MS = 5000; // 5 seconds
  const MAX_RETRIES = 12; // 12 retries × 5s = 60 seconds max wait
  const REQUEST_TIMEOUT_MS = 15000; // 15 second timeout per request

  try {
    // Step 1: Submit the transformation job
    console.log(`[${jobType}] Submitting job with prompt:`, payload.textPrompt);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const submitResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error(`[${jobType}] LightX API submission error:`, submitResponse.status, errorText);
      return {
        success: false,
        message: `${jobType} transformation failed: ${errorText}`,
        statusCode: submitResponse.status,
      };
    }

    const submitResult = await submitResponse.json();
    
    console.log(`[${jobType}] Raw API response:`, JSON.stringify(submitResult));
    
    // Check if result is available immediately (synchronous response)
    const immediateOutputUrl = submitResult.body?.output_url || submitResult.output_url;
    if (immediateOutputUrl) {
      console.log(`[${jobType}] Job completed synchronously, output_url:`, immediateOutputUrl);
      return {
        success: true,
        output_url: immediateOutputUrl,
        orderId: submitResult.body?.orderId || submitResult.orderId || 'sync-response',
      };
    }
    
    // Extract orderId for async polling
    const orderId = submitResult.body?.orderId || submitResult.orderId;
    if (!orderId) {
      console.error(`[${jobType}] No orderId in response:`, JSON.stringify(submitResult));
      return {
        success: false,
        message: `${jobType} transformation failed: No order ID received`,
        statusCode: 502,
      };
    }

    console.log(`[${jobType}] Job submitted async, orderId: ${orderId}, polling for completion...`);

    // Step 2: Poll for completion using /orders/ endpoint
    const statusUrl = apiUrl.includes('/v2/') 
      ? `https://api.lightxeditor.com/external/api/v2/orders/${orderId}`
      : `https://api.lightxeditor.com/external/api/v1/orders/${orderId}`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      await delay(POLL_INTERVAL_MS);

      console.log(`[${jobType}] Polling attempt ${attempt}/${MAX_RETRIES} for orderId: ${orderId}`);

      const statusController = new AbortController();
      const statusTimeoutId = setTimeout(() => statusController.abort(), REQUEST_TIMEOUT_MS);

      try {
        const statusResponse = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
          },
          signal: statusController.signal,
        });

        clearTimeout(statusTimeoutId);

        if (!statusResponse.ok) {
          console.error(`[${jobType}] Status check failed:`, statusResponse.status);
          continue; // Retry on error
        }

        const statusResult = await statusResponse.json();
        const status = statusResult.body?.status || statusResult.status;
        const outputUrl = statusResult.body?.output_url || statusResult.output_url;

        console.log(`[${jobType}] Status check result:`, { status, hasOutputUrl: !!outputUrl });

        // Check if job completed successfully
        if (status === 'completed' && outputUrl) {
          console.log(`[${jobType}] Job completed successfully after ${attempt} attempts`);
          return {
            success: true,
            output_url: outputUrl,
            orderId,
          };
        }

        // Check if job failed
        if (status === 'failed') {
          console.error(`[${jobType}] Job failed, orderId: ${orderId}`);
          return {
            success: false,
            message: `${jobType} transformation failed: Processing error`,
            orderId,
            statusCode: 502,
          };
        }

        // Job still processing, continue polling
        console.log(`[${jobType}] Job still processing (status: ${status}), will retry...`);

      } catch (pollError: any) {
        clearTimeout(statusTimeoutId);
        console.error(`[${jobType}] Polling error on attempt ${attempt}:`, pollError.message);
        // Continue to next retry on network errors
      }
    }

    // Max retries exceeded - timeout
    console.error(`[${jobType}] Timeout: Job did not complete within ${(MAX_RETRIES * POLL_INTERVAL_MS) / 1000}s`);
    return {
      success: false,
      message: `${jobType} transformation timed out. Please try again with a different image or simpler prompt.`,
      orderId,
      statusCode: 504,
    };

  } catch (error: any) {
    console.error(`[${jobType}] Unexpected error:`, error);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: `${jobType} transformation request timed out`,
        statusCode: 504,
      };
    }

    return {
      success: false,
      message: `${jobType} transformation failed: ${error.message}`,
      statusCode: 500,
    };
  }
}

const hairColorSchema = z.object({
  imageUrl: z.string().url(),
  textPrompt: z.string().min(1).max(200),
});

const hairstyleSchema = z.object({
  imageUrl: z.string().url(),
  textPrompt: z.string().min(1).max(200),
});

router.post('/hair-color', aiAnalysisLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = hairColorSchema.parse(req.body);
    
    // Authentication required: allow both business users and customers
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required. Please login to use hair transformations.' });
    }
    
    const apiKey = process.env.LIGHTX_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'LightX API key not configured' });
    }

    // Run the LightX job with automatic polling
    const result = await runLightXJob(
      'https://api.lightxeditor.com/external/api/v2/haircolor/',
      apiKey,
      {
        imageUrl: validatedData.imageUrl,
        textPrompt: validatedData.textPrompt,
      },
      'Hair Color'
    );

    if (!result.success) {
      return res.status(result.statusCode).json({ 
        message: result.message,
        orderId: result.orderId,
      });
    }

    return res.json({
      success: true,
      output_url: result.output_url,
      orderId: result.orderId,
    });
  } catch (error: any) {
    console.error('[Hair Color] Error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Invalid request data', 
        errors: error.errors 
      });
    }

    return res.status(500).json({ 
      message: 'Hair color transformation failed',
      error: error.message 
    });
  }
});

router.post('/hairstyle', aiAnalysisLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = hairstyleSchema.parse(req.body);
    
    // Authentication required: allow both business users and customers
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required. Please login to use hairstyle transformations.' });
    }
    
    const apiKey = process.env.LIGHTX_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'LightX API key not configured' });
    }

    // Run the LightX job with automatic polling
    const result = await runLightXJob(
      'https://api.lightxeditor.com/external/api/v1/hairstyle/',
      apiKey,
      {
        imageUrl: validatedData.imageUrl,
        textPrompt: validatedData.textPrompt,
      },
      'Hairstyle'
    );

    if (!result.success) {
      return res.status(result.statusCode).json({ 
        message: result.message,
        orderId: result.orderId,
      });
    }

    return res.json({
      success: true,
      output_url: result.output_url,
      orderId: result.orderId,
    });
  } catch (error: any) {
    console.error('[Hairstyle] Error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Invalid request data', 
        errors: error.errors 
      });
    }

    return res.status(500).json({ 
      message: 'Hairstyle transformation failed',
      error: error.message 
    });
  }
});

export default router;

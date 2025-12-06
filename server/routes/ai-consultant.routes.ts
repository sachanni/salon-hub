import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import {
  getBeautyConsultantResponse,
  getQuickActionChips,
  validateGeminiApiKey,
  type BeautyConsultantInput,
} from '../services/beauty-consultant.service';
import { authenticateMobileUser } from '../middleware/authMobile';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

const router = Router();

let geminiAvailable = false;

export async function initializeAIConsultantRoutes(): Promise<boolean> {
  geminiAvailable = await validateGeminiApiKey();
  if (!geminiAvailable) {
    console.warn('⚠️  AI Beauty Consultant routes will return service unavailable - GEMINI_API_KEY not configured or invalid');
  }
  return geminiAvailable;
}

const aiConsultantRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests. Please wait a moment before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false, trustProxy: false },
});

const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  intent: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(10).optional(),
});

function checkGeminiAvailable(req: Request, res: Response, next: NextFunction) {
  if (!geminiAvailable) {
    res.status(503).json({ error: 'AI Beauty Consultant is currently unavailable. Please try again later.' });
    return;
  }
  next();
}

async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  if (req.headers.authorization) {
    return authenticateMobileUser(req, res, next);
  }
  
  if (req.session?.userId) {
    (req as any).user = { id: req.session.userId };
    return next();
  }
  
  res.status(401).json({ error: 'Authentication required. Please log in to use the AI Beauty Consultant.' });
}

async function optionalAuthenticateUser(req: Request, res: Response, next: NextFunction) {
  if (req.headers.authorization) {
    return authenticateMobileUser(req, res, next);
  }
  
  if (req.session?.userId) {
    (req as any).user = { id: req.session.userId };
    (req as any).isGuest = false;
    return next();
  }
  
  (req as any).user = null;
  (req as any).isGuest = true;
  next();
}

router.get('/chips', optionalAuthenticateUser, (req: Request, res: Response) => {
  try {
    const chips = getQuickActionChips();
    const isGuest = (req as any).isGuest;
    res.json({ chips, isGuest });
  } catch (error) {
    console.error('[AI Consultant] Error fetching chips:', error);
    res.status(500).json({ error: 'Failed to fetch quick action chips' });
  }
});

router.post('/chat', optionalAuthenticateUser, checkGeminiAvailable, aiConsultantRateLimit, async (req: Request, res: Response) => {
  try {
    const validationResult = chatRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({ 
        error: 'Invalid request',
        details: validationResult.error.errors 
      });
      return;
    }

    const { message, intent, location, conversationHistory } = validationResult.data;
    const userId = (req as any).user?.id;
    const isGuest = (req as any).isGuest;

    const input: BeautyConsultantInput = {
      message,
      intent,
      userId: userId || undefined,
      location,
      conversationHistory,
      isGuest,
    };

    const response = await getBeautyConsultantResponse(input);
    res.json({ ...response, isGuest });
  } catch (error: any) {
    console.error('[AI Consultant] Chat error:', error);
    
    if (error.message?.includes('busy') || error.message?.includes('quota')) {
      res.status(503).json({ error: error.message });
      return;
    }
    
    if (error.message?.includes('API key') || error.message?.includes('authentication')) {
      res.status(503).json({ error: 'AI service is temporarily unavailable. Please try again later.' });
      return;
    }
    
    res.status(500).json({ error: 'Failed to process your request. Please try again.' });
  }
});

router.post('/quick-query', optionalAuthenticateUser, checkGeminiAvailable, aiConsultantRateLimit, async (req: Request, res: Response) => {
  try {
    const { intent, location } = req.body;

    if (!intent || typeof intent !== 'string') {
      res.status(400).json({ error: 'Intent is required' });
      return;
    }

    const userId = (req as any).user?.id;
    const isGuest = (req as any).isGuest;

    const intentPrompts: Record<string, string> = {
      recommend_hairstyle: "What hairstyles would look good on me? I'm looking for something trendy and easy to maintain.",
      skincare_routine: "Can you suggest a basic skincare routine for everyday use?",
      makeup_tips: "What are some essential makeup tips for beginners?",
      find_salon: "Can you help me find the best rated salons near me?",
      trending_looks: "What beauty trends are popular right now?",
      hair_care: "How can I take better care of my hair?",
      nail_art: "What are some popular nail art designs right now?",
      bridal_beauty: "What should I know about bridal makeup and beauty preparation?",
      men_grooming: "What grooming tips would you recommend for men?",
    };

    const message = intentPrompts[intent] || `Tell me about ${intent.replace(/_/g, ' ')}`;

    const input: BeautyConsultantInput = {
      message,
      intent,
      userId: userId || undefined,
      location,
      isGuest,
    };

    const response = await getBeautyConsultantResponse(input);
    res.json({ ...response, isGuest });
  } catch (error: any) {
    console.error('[AI Consultant] Quick query error:', error);
    
    if (error.message?.includes('busy') || error.message?.includes('quota')) {
      res.status(503).json({ error: error.message });
      return;
    }
    
    res.status(500).json({ error: 'Failed to process your request. Please try again.' });
  }
});

export default router;

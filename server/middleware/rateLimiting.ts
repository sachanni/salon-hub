import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request, Response } from 'express';

// Rate limiting configurations for different endpoint types
export const communicationRateLimits = {
  // Send individual messages - stricter limit
  sendMessage: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: {
      error: 'Too many message send requests. Please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Rate limit by user ID if authenticated, otherwise by IPv6-safe IP
      const userId = (req as any).user?.id;
      return userId || ipKeyGenerator(req.ip || 'unknown-ip');
    }
  }),
  
  // Campaign sending - even stricter limit
  sendCampaign: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit to 10 campaign sends per hour
    message: {
      error: 'Too many campaign send requests. Please try again later.',
      retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.id;
      return `campaign:${userId || ipKeyGenerator(req.ip || 'unknown-ip')}`;
    }
  }),
  
  // Template and configuration operations - moderate limit
  templateOperations: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: {
      error: 'Too many template operation requests. Please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.id;
      return `templates:${userId || ipKeyGenerator(req.ip || 'unknown-ip')}`;
    }
  }),
  
  // Analytics and read operations - generous limit
  analytics: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per 15 minutes
    message: {
      error: 'Too many analytics requests. Please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.id;
      return `analytics:${userId || ipKeyGenerator(req.ip || 'unknown-ip')}`;
    }
  }),

  // Places API operations - moderate limit to prevent abuse
  placesApi: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // 150 requests per 15 minutes (10 per minute average)
    message: {
      error: 'Too many places API requests. Please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.id;
      return `places:${userId || ipKeyGenerator(req.ip || 'unknown-ip')}`;
    }
  }),

  // User existence checks - strict limit to prevent enumeration attacks
  strict: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: {
      error: 'Too many requests. Please try again later.',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return ipKeyGenerator(req.ip || 'unknown-ip'); // Rate limit by IP only for security
    }
  })
};

// Sliding window rate limiter for high-frequency operations
export const slidingWindowLimiter = (config: {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}) => {
  const requests = new Map<string, number[]>();
  
  return (req: Request, res: Response, next: Function) => {
    const userId = (req as any).user?.id;
    const key = `${config.keyPrefix || 'default'}:${userId || ipKeyGenerator(req.ip || 'unknown-ip')}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Get existing requests for this key
    let userRequests = requests.get(key) || [];
    
    // Remove requests outside the window
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if we're over the limit
    if (userRequests.length >= config.maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((userRequests[0] + config.windowMs - now) / 1000)
      });
    }
    
    // Add current request
    userRequests.push(now);
    requests.set(key, userRequests);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      for (const [k, timestamps] of Array.from(requests.entries())) {
        const filtered = timestamps.filter((t: number) => t > windowStart);
        if (filtered.length === 0) {
          requests.delete(k);
        } else {
          requests.set(k, filtered);
        }
      }
    }
    
    next();
  };
};

// Business tier rate limiting
export const businessTierLimits = {
  // Free tier - very restrictive
  free: {
    messagesPerMonth: 100,
    campaignsPerMonth: 2,
    templatesMax: 5
  },
  
  // Basic tier - moderate limits
  basic: {
    messagesPerMonth: 1000,
    campaignsPerMonth: 10,
    templatesMax: 20
  },
  
  // Premium tier - generous limits
  premium: {
    messagesPerMonth: 10000,
    campaignsPerMonth: 50,
    templatesMax: 100
  },
  
  // Enterprise tier - unlimited
  enterprise: {
    messagesPerMonth: Infinity,
    campaignsPerMonth: Infinity,
    templatesMax: Infinity
  }
};

// Check business tier limits
export const checkBusinessLimits = async (req: Request, res: Response, next: Function) => {
  try {
    const userId = (req as any).user?.id;
    const salonId = req.params.salonId;
    
    if (!userId || !salonId) {
      return next();
    }
    
    // In a real implementation, you'd get the business tier from the database
    // For now, assume basic tier
    const tier = 'basic';
    const limits = businessTierLimits[tier];
    
    // Check monthly message limit for send operations
    if (req.method === 'POST' && req.path.includes('/send')) {
      // This would check actual usage from the database
      // For now, just proceed
    }
    
    next();
  } catch (error) {
    console.error('Error checking business limits:', error);
    next();
  }
};

// Webhook rate limiting (for provider callbacks)
export const webhookRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1000, // Allow many webhook calls
  message: 'Too many webhook requests',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Rate limit by provider IP or user agent
    return req.get('User-Agent') || ipKeyGenerator(req.ip || 'unknown-ip');
  }
});

// Spike protection - very short window, high limit
export const spikeProtection = rateLimit({
  windowMs: 1000, // 1 second
  max: 10, // 10 requests per second
  message: 'Request rate too high. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false
});
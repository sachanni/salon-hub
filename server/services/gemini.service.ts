import { GoogleGenAI } from '@google/genai';
import { buildInventoryContextForAI, type InventoryContext } from './inventory-context.service';
import { analyzeBeautyImageWithOpenAI } from './openai.service';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface BeautyAnalysisInput {
  imageBase64: string;
  customerName: string;
  salonId: string;
  gender?: string;
  eventType?: string;
  weather?: string;
  location?: string;
  skinTone?: string;
  hairType?: string;
  preferredBrands?: string[];
}

export interface ProductRecommendation {
  category: string;
  productId: string;
  reason: string;
  attributes?: {
    finish?: string;
    shade?: string;
    type?: string;
  };
}

export interface LookOption {
  lookName: string;
  description: string;
  confidenceScore: number;
  presetCategories: string[];
  products: ProductRecommendation[];
}

export interface BeautyAnalysisResponse {
  customerAnalysis: {
    skinTone: string;
    facialFeatures: string;
    recommendations: string;
  };
  looks: LookOption[];
}

async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 2000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Normalize error fields (Google SDK uses different structures)
      const status = error.status || error.error?.code || error.code;
      const message = error.message || error.error?.message || '';
      const errorCode = typeof error.code === 'string' ? error.code : '';
      
      // Don't retry on quota/permission errors - fail fast for OpenAI fallback
      // Check status codes, error codes, and message strings
      const isQuotaOrPermissionError = 
        status === 429 || status === 403 || status === 'RESOURCE_EXHAUSTED' || status === 'PERMISSION_DENIED' ||
        errorCode === 'RESOURCE_EXHAUSTED' || errorCode === 'PERMISSION_DENIED' ||
        message.includes('quota') || message.includes('RESOURCE_EXHAUSTED') || 
        message.includes('PERMISSION_DENIED') || message.includes('exceeded your current quota');
      
      if (isQuotaOrPermissionError) {
        console.log(`[No Retry] Quota/permission error detected. Failing fast for OpenAI fallback.`);
        throw error;
      }

      // Retry on transient errors (temporary failures that might succeed on retry)
      const isRetryableError = 
        // HTTP transient status codes
        status === 408 || status === 500 || status === 502 || 
        status === 503 || status === 504 || status === 509 ||
        // Google SDK status strings
        status === 'UNAVAILABLE' || status === 'ABORTED' || 
        status === 'DEADLINE_EXCEEDED' || status === 'INTERNAL' ||
        // Error code strings
        errorCode === 'UNAVAILABLE' || errorCode === 'ABORTED' || 
        errorCode === 'DEADLINE_EXCEEDED' || errorCode === 'INTERNAL' ||
        // Network errors
        errorCode === 'ECONNRESET' || errorCode === 'ETIMEDOUT' || 
        errorCode === 'ENOTFOUND' || errorCode === 'ECONNREFUSED' ||
        // Message-based detection (fallback)
        message.includes('UNAVAILABLE') || message.includes('ABORTED') ||
        message.includes('DEADLINE_EXCEEDED') || message.includes('INTERNAL');
      
      if (isRetryableError && attempt < maxRetries - 1) {
        const jitter = Math.random() * 500;
        const delay = (Math.pow(2, attempt) * baseDelay) + jitter;
        
        console.log(`[Retry ${attempt + 1}/${maxRetries - 1}] Transient error (status: ${status}, code: ${errorCode}). Waiting ${Math.round(delay / 1000)}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // For non-retryable errors or max retries reached, fail immediately
      console.log(`[No Retry] Non-retryable error or max retries reached (status: ${status}, code: ${errorCode})`);
      throw error;
    }
  }

  throw lastError;
}

export async function analyzeBeautyImage(input: BeautyAnalysisInput): Promise<BeautyAnalysisResponse> {
  const model = 'gemini-2.5-flash'; // Latest stable model (replaces retired 1.5-flash)

  // Fetch salon's actual product inventory (filtered by preferred brands if specified)
  // Reduced to 5 products per category to save tokens for response
  const inventoryContext = await buildInventoryContextForAI(input.salonId, 5, input.preferredBrands);
  const brandContext = input.preferredBrands && input.preferredBrands.length > 0 
    ? ` (filtered to: ${input.preferredBrands.join(', ')})` 
    : '';
  console.log(`[AI Look] Loaded ${inventoryContext.totalProducts} products across ${inventoryContext.categoriesAvailable.length} categories for salon ${input.salonId}${brandContext}`);

  // Handle empty inventory case
  if (inventoryContext.totalProducts === 0) {
    const errorMessage = input.preferredBrands && input.preferredBrands.length > 0
      ? `This salon does not stock any products from the selected brands (${input.preferredBrands.join(', ')}). Please try selecting different brands or contact the salon to stock these products.`
      : 'This salon has no products in inventory. Please add products to the salon inventory before using AI Look Advisor.';
    
    throw new Error(errorMessage);
  }

  const systemPrompt = `You are an expert beauty consultant and makeup artist with deep knowledge of cosmetic products, skin tones, face shapes, and beauty trends. Your role is to analyze customer photos and provide personalized makeup and hairstyle recommendations for salon staff.

IMPORTANT CONTEXT:
- You are helping salon staff recommend looks for their customers
- **CRITICAL**: You MUST ONLY recommend products from the INVENTORY CONTEXT provided below. Each product has an [ID: xxx] - you MUST include this ID in your response
- Consider the customer's skin tone, facial features, event type, weather, and location
- Each look should include specific product recommendations with product IDs from the inventory
- Preset categories map to AR effects: makeup_natural, makeup_glamorous, makeup_bridal, makeup_party, makeup_smokey, hair_brown, hair_blonde, hair_red, hair_black, hair_highlights, hair_ombre, beard_full, beard_stubble, beard_goatee

GENDER-SPECIFIC RECOMMENDATIONS:
- Customer gender: ${input.gender}
${input.gender === 'male' ? '- Focus on MALE grooming: haircare, skincare, beard care (if applicable), and subtle enhancement (foundation, concealer, eyebrow grooming). Emphasize natural, professional looks suitable for men.' : ''}
${input.gender === 'female' ? '- Focus on FEMALE makeup: Provide full makeup looks including foundation, concealer, eyeshadow, lipstick, blush, highlighter. Focus on cosmetics and beauty enhancement for women.' : ''}
${input.gender === 'prefer_not' || !input.gender ? '- Provide gender-neutral recommendations emphasizing unisex skincare and subtle enhancement products suitable for all genders.' : ''}

ANALYSIS STEPS:
1. Analyze the customer's photo for:
   - Skin tone (fair, light, medium, olive, tan, dark, deep)
   - Face shape (oval, round, square, heart, diamond, oblong)
   - Eye color and shape
   - Lip shape
   - Facial features (high cheekbones, prominent jaw, etc.)
   - Hair color and texture (if visible)

2. Consider the context:
   - Event type: ${input.eventType || 'casual'} (adjust intensity and style)
   - Weather: ${input.weather || 'normal'} (waterproof/long-lasting for humid)
   - Location: ${input.location || 'indoor'} (lighting considerations)
   - Skin tone preference: ${input.skinTone || 'auto-detect'}
   - Hair type: ${input.hairType || 'auto-detect'}

3. Generate EXACTLY 2 distinct look options:
   - Each look should have a creative name and compelling description
   - Include confidence score (0-100) based on how well it suits the customer
   - List preset categories needed for AR preview (makeup + optional hair/beard)
   - Recommend specific product types with attributes (shade, finish, etc.)
   - Keep it concise: 6-8 products per look (focus on essentials)

PRODUCT CATEGORIES (use these exactly):
- foundation (attributes: shade, finish: matte/dewy/natural)
- concealer (attributes: shade)
- powder (attributes: shade, finish: translucent/pressed)
- blush (attributes: shade, finish: powder/cream)
- bronzer (attributes: shade)
- highlighter (attributes: shade, finish: powder/liquid)
- eyeshadow (attributes: shade, finish: matte/shimmer/metallic)
- eyeliner (attributes: type: pencil/liquid/gel, shade)
- mascara (attributes: type: volumizing/lengthening, shade)
- eyebrow_pencil (attributes: shade)
- lipstick (attributes: shade, finish: matte/cream/glossy)
- lip_liner (attributes: shade)
- lip_gloss (attributes: shade)
- setting_spray (attributes: type: matte/dewy)
- primer (attributes: type: pore-minimizing/hydrating/mattifying)
- hair_color (attributes: shade, type: permanent/semi-permanent)

SHADE NAMING CONVENTIONS:
- Foundation: Fair Ivory, Light Beige, Medium Tan, Golden Beige, Caramel, Mocha, Deep Espresso
- Lipstick: Nude Rose, Mauve Pink, Coral Red, Berry Wine, Classic Red, Plum, etc.
- Eyeshadow: Champagne Gold, Bronze, Copper, Soft Pink, Mauve, Charcoal, etc.

RESPONSE FORMAT (JSON) - **IMPORTANT: You MUST include productId from the INVENTORY CONTEXT**:
{
  "customerAnalysis": {
    "skinTone": "detected skin tone category",
    "facialFeatures": "brief description of key features",
    "recommendations": "general beauty recommendations for this customer"
  },
  "looks": [
    {
      "lookName": "creative look name",
      "description": "compelling 2-3 sentence description",
      "confidenceScore": 85,
      "presetCategories": ["makeup_natural", "hair_brown"],
      "products": [
        {
          "category": "foundation",
          "productId": "exact-product-id-from-inventory-context",
          "reason": "Evens skin tone while maintaining natural glow",
          "attributes": {
            "shade": "Medium Tan",
            "finish": "dewy"
          }
        },
        {
          "category": "lipstick",
          "productId": "exact-product-id-from-inventory-context",
          "reason": "Complements skin tone for understated elegance",
          "attributes": {
            "shade": "Nude Rose",
            "finish": "matte"
          }
        }
      ]
    }
  ]
}

**Remember**: Every product MUST have a valid productId from the INVENTORY CONTEXT below. The attributes field is optional but helpful for staff understanding.

QUALITY GUIDELINES:
- Be specific and actionable (not "natural lipstick" but "Nude Rose matte lipstick")
- Ensure each look is distinctly different (natural vs. glamorous)
- Confidence scores should reflect genuine suitability (don't give everything 95+)
- Include 6-8 essential products per look (foundation, concealer, eyes, lips, cheeks)
- Provide clear reasons for each product choice
- Consider color theory (complementary shades, undertones)
- **IMPORTANT**: Keep responses concise to avoid truncation`;

  try {
    const imagePart = {
      inlineData: {
        data: input.imageBase64.replace(/^data:image\/\w+;base64,/, ''),
        mimeType: input.imageBase64.match(/^data:image\/(\w+);base64,/)?.[1] === 'png' 
          ? 'image/png' 
          : 'image/jpeg',
      },
    };

    // Build the inventory context section
    const inventoryPrompt = `

## INVENTORY CONTEXT
${input.preferredBrands && input.preferredBrands.length > 0 
  ? `**Customer prefers these brands: ${input.preferredBrands.join(', ')}** - Recommend ONLY from these brands.\n\n` 
  : ''}Available products for this salon (total: ${inventoryContext.totalProducts} across ${inventoryContext.categoriesAvailable.length} categories):

${inventoryContext.productsByCategoryFormatted}

**CRITICAL**: You MUST use the [ID: xxx] values from above in your productId field. Do not make up product IDs.`;

    const result = await retryWithExponentialBackoff(
      () => genAI.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemPrompt },
              imagePart,
              { text: `Analyze this photo of ${input.customerName} and provide personalized beauty recommendations.` },
              { text: inventoryPrompt },
            ],
          },
        ],
        config: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      })
      // Using default params: maxRetries=3, baseDelay=2000 (defined in function signature)
    );

    const text = result.text || '';
    
    if (!text) {
      console.error('[Gemini] Empty response - may be due to safety filters or MAX_TOKENS limit');
      throw new Error('Gemini returned empty response. This may be due to safety filters or content blocks.');
    }
    
    let analysis: BeautyAnalysisResponse;
    try {
      analysis = JSON.parse(text);
      
      if (!analysis || typeof analysis !== 'object') {
        throw new Error('Invalid response structure');
      }
      
      if (!analysis.looks || !Array.isArray(analysis.looks) || analysis.looks.length === 0) {
        throw new Error('No looks generated by AI');
      }

      if (!analysis.customerAnalysis || typeof analysis.customerAnalysis !== 'object') {
        analysis.customerAnalysis = {
          skinTone: 'auto-detected',
          facialFeatures: '',
          recommendations: 'Unable to generate detailed analysis.',
        };
      }
    } catch (parseError: any) {
      console.error('Failed to parse Gemini response:', text);
      throw new Error(`AI response parsing failed: ${parseError.message}. Raw response may be malformed.`);
    }

    return analysis;
  } catch (error: any) {
    console.error('Gemini AI analysis error:', error);
    
    if (error.status === 429) {
      throw new Error('⏳ Our AI service is experiencing high demand right now. Please wait 30-60 seconds before trying again. Tip: Avoid clicking "Analyze" multiple times in quick succession to prevent rate limiting.');
    }
    
    if (error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('⏳ AI quota temporarily exhausted. Please wait 1-2 minutes before trying again. The service will automatically recover.');
    }
    
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

export interface BeautyAnalysisResponseWithProvider extends BeautyAnalysisResponse {
  provider: 'gemini' | 'openai';
}

export async function analyzeBeautyImageWithFallback(
  input: BeautyAnalysisInput
): Promise<BeautyAnalysisResponseWithProvider> {
  console.log(`[AI Look] Starting analysis for ${input.customerName} at salon ${input.salonId}`);

  try {
    console.log('[AI Look] Attempting primary provider: Gemini');
    const geminiResult = await analyzeBeautyImage(input);
    console.log('[AI Look] ✓ Gemini analysis successful');
    return {
      ...geminiResult,
      provider: 'gemini'
    };
  } catch (geminiError: any) {
    console.log(`[AI Look] ✗ Gemini failed: ${geminiError.message}`);
    
    const isOpenAIConfigured = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0;
    
    // Don't fallback if it's an inventory/business logic error (not an AI provider error)
    const isInventoryError = geminiError.message?.includes('no products in inventory') || 
                             geminiError.message?.includes('does not stock any products');
    
    if (isInventoryError) {
      console.log('[AI Look] Inventory error detected, not attempting fallback');
      throw geminiError;
    }
    
    // Attempt OpenAI fallback for any Gemini failure (quota, malformed response, etc.)
    if (isOpenAIConfigured) {
      const errorType = geminiError.status === 429 || geminiError.message?.includes('quota') || geminiError.message?.includes('RESOURCE_EXHAUSTED')
        ? 'quota/rate limit'
        : 'provider error';
      
      console.log(`[AI Look] Gemini ${errorType} detected. Attempting fallback to OpenAI...`);
      
      try {
        const openaiResult = await analyzeBeautyImageWithOpenAI(input);
        console.log('[AI Look] ✓ OpenAI fallback successful');
        return {
          ...openaiResult,
          provider: 'openai'
        };
      } catch (openaiError: any) {
        console.error('[AI Look] ✗ OpenAI fallback also failed:', openaiError.message);
        
        // Return a more helpful error message
        const errorMessage = geminiError.status === 429 || geminiError.message?.includes('quota')
          ? 'Both AI providers are currently unavailable. Gemini quota exhausted and OpenAI also failed. Please try again in a few minutes.'
          : `AI analysis failed with both providers. Gemini: ${geminiError.message}. OpenAI: ${openaiError.message}`;
        
        throw new Error(errorMessage);
      }
    } else {
      // OpenAI not configured, provide helpful message based on error type
      if (geminiError.status === 429 || geminiError.message?.includes('quota') || geminiError.message?.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Gemini quota exhausted and OpenAI backup is not configured. Please add OPENAI_API_KEY to your secrets or wait for Gemini quota to reset.');
      }
      
      // For other errors, just rethrow the original Gemini error
      throw geminiError;
    }
  }
}

export async function generateApplicationInstructions(
  lookDescription: string,
  products: Array<{ category: string; attributes: any; productName: string; brand: string }>
): Promise<string> {
  const model = 'gemini-1.5-flash'; // Using same stable model for consistency

  const prompt = `You are a professional makeup artist providing step-by-step application instructions.

LOOK DESCRIPTION: ${lookDescription}

PRODUCTS TO USE:
${products.map(p => `- ${p.brand} ${p.productName} (${p.category})`).join('\n')}

Generate detailed, professional application instructions in the following format:

**STEP 1: PREP**
[Prep instructions]

**STEP 2: BASE**
[Foundation, concealer, powder instructions]

**STEP 3: EYES**
[Eye makeup instructions]

**STEP 4: CHEEKS**
[Blush, bronzer, highlighter instructions]

**STEP 5: LIPS**
[Lip product instructions]

**STEP 6: FINISHING TOUCHES**
[Setting spray, final touches]

GUIDELINES:
- Be specific about application techniques (stippling, blending, tapping, etc.)
- Include tool recommendations (beauty blender, brush types)
- Mention wait times if needed (let primer dry, etc.)
- Add pro tips for longevity and best results
- Use conversational but professional tone
- Maximum 2-3 sentences per product
`;

  try {
    const result = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 2048,
      },
    });
    return result.text || 'Application instructions could not be generated. Please follow standard makeup application techniques.';
  } catch (error: any) {
    console.error('Error generating application instructions:', error);
    return 'Application instructions could not be generated. Please follow standard makeup application techniques.';
  }
}

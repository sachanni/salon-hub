import { GoogleGenAI } from '@google/genai';
import { buildInventoryContextForAI, type InventoryContext } from './inventory-context.service';

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
  maxRetries = 5,
  baseDelay = 3000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (error.status === 429 && attempt < maxRetries - 1) {
        const jitter = Math.random() * 1000;
        const delay = (Math.pow(2, attempt) * baseDelay) + jitter;
        
        console.log(`[Retry ${attempt + 1}/${maxRetries - 1}] Rate limit hit (429). Waiting ${Math.round(delay / 1000)}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

export async function analyzeBeautyImage(input: BeautyAnalysisInput): Promise<BeautyAnalysisResponse> {
  const model = 'gemini-2.0-flash-exp';

  // Fetch salon's actual product inventory (filtered by preferred brands if specified)
  const inventoryContext = await buildInventoryContextForAI(input.salonId, 10, input.preferredBrands);
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

3. Generate 3-5 distinct look options:
   - Each look should have a creative name and compelling description
   - Include confidence score (0-100) based on how well it suits the customer
   - List preset categories needed for AR preview (makeup + optional hair/beard)
   - Recommend specific product types with attributes (shade, finish, etc.)

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
- Ensure each look is distinctly different (natural vs. glamorous vs. bold)
- Confidence scores should reflect genuine suitability (don't give everything 95+)
- Include 8-12 products per look (complete face)
- Provide clear reasons for each product choice
- Consider color theory (complementary shades, undertones)`;

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
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
      5,
      3000
    );

    const text = result.text;
    
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

export async function generateApplicationInstructions(
  lookDescription: string,
  products: Array<{ category: string; attributes: any; productName: string; brand: string }>
): Promise<string> {
  const model = 'gemini-2.0-flash-exp';

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
    return result.text;
  } catch (error: any) {
    console.error('Error generating application instructions:', error);
    return 'Application instructions could not be generated. Please follow standard makeup application techniques.';
  }
}

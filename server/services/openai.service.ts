import OpenAI from 'openai';
import { buildInventoryContextForAI, type InventoryContext } from './inventory-context.service';
import type { BeautyAnalysisInput, BeautyAnalysisResponse } from './gemini.service';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

export async function analyzeBeautyImageWithOpenAI(input: BeautyAnalysisInput): Promise<BeautyAnalysisResponse> {
  const model = 'gpt-5'; // GPT-5 with advanced vision capabilities

  // Fetch salon's actual product inventory (filtered by preferred brands if specified)
  const inventoryContext = await buildInventoryContextForAI(input.salonId, 10, input.preferredBrands);
  const brandContext = input.preferredBrands && input.preferredBrands.length > 0 
    ? ` (filtered to: ${input.preferredBrands.join(', ')})` 
    : '';
  console.log(`[AI Look - OpenAI] Loaded ${inventoryContext.totalProducts} products across ${inventoryContext.categoriesAvailable.length} categories for salon ${input.salonId}${brandContext}`);

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

3. Generate 2-4 distinct looks from available inventory products:
   - Each look must use ONLY products from the inventory below
   - Include the product ID [ID: xxx] for every product
   - Provide a confidence score (0-100) for how well each look suits this customer
   - Assign appropriate preset categories for AR preview
   - Explain WHY each product was chosen (e.g., "complements your warm undertones")

INVENTORY CONTEXT:
${JSON.stringify(inventoryContext, null, 2)}

RESPONSE FORMAT (STRICT JSON):
{
  "customerAnalysis": {
    "skinTone": "detected skin tone",
    "facialFeatures": "description of key facial features",
    "recommendations": "overall beauty recommendations"
  },
  "looks": [
    {
      "lookName": "Look name (e.g., Natural Day Look, Glamorous Evening)",
      "description": "Detailed description of this look and why it suits the customer",
      "confidenceScore": 85,
      "presetCategories": ["makeup_natural", "hair_brown"],
      "products": [
        {
          "category": "Foundation",
          "productId": "product-uuid-from-inventory",
          "reason": "Why this product was chosen for this customer",
          "attributes": {
            "finish": "matte",
            "shade": "medium beige",
            "type": "liquid"
          }
        }
      ]
    }
  ]
}

CRITICAL VALIDATION:
- Every productId MUST match an [ID: xxx] from the inventory context above
- If inventory is limited, work creatively with what's available
- Prioritize products that match customer's skin tone and event type
- If certain categories are missing (e.g., no foundation), skip them gracefully`;

  try {
    console.log(`[AI Look - OpenAI] Calling GPT-4o vision API for customer: ${input.customerName}`);
    
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please analyze this photo of ${input.customerName} and provide personalized beauty recommendations using the products from the salon's inventory.`
            },
            {
              type: 'image_url',
              image_url: {
                url: input.imageBase64.startsWith('data:') 
                  ? input.imageBase64 
                  : `data:image/jpeg;base64,${input.imageBase64}`
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4000,
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    console.log(`[AI Look - OpenAI] Successfully received response`);
    
    // Parse and validate response
    const analysisResult = JSON.parse(content) as BeautyAnalysisResponse;

    // Validate that all product IDs exist in inventory
    for (const look of analysisResult.looks) {
      for (const product of look.products) {
        if (!inventoryContext.productIdMap.has(product.productId)) {
          console.warn(`[AI Look - OpenAI] Product ID ${product.productId} not found in inventory, removing from recommendations`);
          look.products = look.products.filter(p => p.productId !== product.productId);
        }
      }
    }

    // Filter out looks with no valid products
    analysisResult.looks = analysisResult.looks.filter(look => look.products.length > 0);

    if (analysisResult.looks.length === 0) {
      throw new Error('OpenAI could not generate valid product recommendations from available inventory');
    }

    return analysisResult;

  } catch (error: any) {
    console.error('OpenAI beauty analysis error:', error);
    
    if (error?.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY configuration.');
    }
    
    if (error?.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again in a few moments.');
    }

    if (error?.status === 400 && error?.message?.includes('image')) {
      throw new Error('Invalid image format. Please upload a clear photo of your face.');
    }

    throw new Error(`OpenAI analysis failed: ${error.message || 'Unknown error occurred'}`);
  }
}

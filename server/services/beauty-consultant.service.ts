import { GoogleGenAI } from '@google/genai';
import { db } from '../db';
import { eq, sql, and, gte, lte, ilike, or } from 'drizzle-orm';
import * as schema from '@shared/schema';

let genAI: GoogleGenAI | null = null;

// Intent detection with weighted keywords (higher weight = stronger indicator)
const PRODUCT_KEYWORDS: Array<{ word: string; weight: number }> = [
  // Strong product indicators (weight 3)
  { word: 'product', weight: 3 }, { word: 'buy product', weight: 3 }, { word: 'recommend product', weight: 3 },
  { word: 'skincare product', weight: 3 }, { word: 'haircare product', weight: 3 },
  // Medium product indicators (weight 2)
  { word: 'cream', weight: 2 }, { word: 'moisturizer', weight: 2 }, { word: 'serum', weight: 2 },
  { word: 'lotion', weight: 2 }, { word: 'shampoo', weight: 2 }, { word: 'conditioner', weight: 2 },
  { word: 'sunscreen', weight: 2 }, { word: 'spf', weight: 2 }, { word: 'cleanser', weight: 2 },
  { word: 'toner', weight: 2 }, { word: 'face mask', weight: 2 }, { word: 'foundation', weight: 2 },
  { word: 'lipstick', weight: 2 }, { word: 'mascara', weight: 2 }, { word: 'concealer', weight: 2 },
  { word: 'primer', weight: 2 }, { word: 'powder', weight: 2 }, { word: 'blush', weight: 2 },
  { word: 'bronzer', weight: 2 }, { word: 'eyeshadow', weight: 2 }, { word: 'eyeliner', weight: 2 },
  // Weak product indicators (weight 1)
  { word: 'buy', weight: 1 }, { word: 'purchase', weight: 1 }, { word: 'shop', weight: 1 },
  { word: 'apply', weight: 1 }, { word: 'use on', weight: 1 }, { word: 'oil', weight: 1 },
  { word: 'best for oily', weight: 2 }, { word: 'best for dry', weight: 2 },
  { word: 'oily skin', weight: 1 }, { word: 'dry skin', weight: 1 }, { word: 'acne', weight: 1 },
  { word: 'pimple', weight: 1 }, { word: 'anti-aging', weight: 1 }, { word: 'wrinkle', weight: 1 },
  { word: 'dark spot', weight: 1 }, { word: 'pigmentation', weight: 1 },
];

const SALON_KEYWORDS: Array<{ word: string; weight: number }> = [
  // Strong salon indicators (weight 3)
  { word: 'salon', weight: 3 }, { word: 'parlor', weight: 3 }, { word: 'parlour', weight: 3 },
  { word: 'find salon', weight: 3 }, { word: 'best salon', weight: 3 }, { word: 'salon near', weight: 3 },
  { word: 'salons near', weight: 3 }, { word: 'nearby salon', weight: 3 },
  // Medium salon indicators (weight 2)  
  { word: 'near me', weight: 2 }, { word: 'near by', weight: 2 }, { word: 'nearby', weight: 2 },
  { word: 'around me', weight: 2 }, { word: 'close to me', weight: 2 }, { word: 'in my area', weight: 2 },
  { word: 'barber', weight: 2 }, { word: 'spa', weight: 2 }, { word: 'beauty center', weight: 2 },
  { word: 'stylist', weight: 2 }, { word: 'hair stylist', weight: 2 },
  // Weak salon indicators (weight 1)
  { word: 'location', weight: 1 }, { word: 'appointment', weight: 1 }, { word: 'book', weight: 1 },
  { word: 'wellness', weight: 1 }, { word: 'visit', weight: 1 }, { word: 'go to', weight: 1 },
  { word: 'locate', weight: 1 }, { word: 'where can i find', weight: 1 }, { word: 'show me', weight: 1 },
];

const SERVICE_KEYWORDS: Array<{ word: string; weight: number }> = [
  // Strong service indicators (weight 3)
  { word: 'service', weight: 3 }, { word: 'treatment', weight: 3 }, { word: 'procedure', weight: 3 },
  // Medium service indicators (weight 2)
  { word: 'haircut', weight: 2 }, { word: 'hair cut', weight: 2 }, { word: 'trim', weight: 2 },
  { word: 'hair color', weight: 2 }, { word: 'hair dye', weight: 2 }, { word: 'highlight', weight: 2 },
  { word: 'balayage', weight: 2 }, { word: 'keratin', weight: 2 }, { word: 'straightening', weight: 2 },
  { word: 'perm', weight: 2 }, { word: 'facial', weight: 2 }, { word: 'manicure', weight: 2 },
  { word: 'pedicure', weight: 2 }, { word: 'massage', weight: 2 }, { word: 'waxing', weight: 2 },
  { word: 'threading', weight: 2 }, { word: 'bridal makeup', weight: 2 }, { word: 'makeover', weight: 2 },
  { word: 'hair spa', weight: 2 }, { word: 'head massage', weight: 2 }, { word: 'body massage', weight: 2 },
  // Weak service indicators (weight 1)
  { word: 'bridal', weight: 1 }, { word: 'wedding', weight: 1 }, { word: 'how much', weight: 1 },
  { word: 'price', weight: 1 }, { word: 'cost', weight: 1 }, { word: 'color', weight: 1 },
  { word: 'dye', weight: 1 }, { word: 'bleach', weight: 1 },
];

// Location names that strongly indicate salon search
const LOCATION_PATTERNS = [
  'noida', 'greater noida', 'delhi', 'gurgaon', 'gurugram', 'faridabad', 'ghaziabad',
  'mumbai', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'pune', 'kolkata',
  'sector', 'nirala', 'supertech', 'gaur', 'amrapali', 'techzone', 'alpha', 'beta', 'gamma',
];

type QueryIntent = 'product' | 'salon' | 'service' | 'general';

function detectQueryIntent(message: string, intent?: string): QueryIntent {
  const messageLower = message.toLowerCase().trim();
  
  // Check explicit intent first
  if (intent === 'find_salon') return 'salon';
  if (intent === 'skincare_routine' || intent === 'recommend_product') return 'product';
  
  // Calculate weighted scores
  let productScore = 0;
  let salonScore = 0;
  let serviceScore = 0;
  
  for (const { word, weight } of PRODUCT_KEYWORDS) {
    if (messageLower.includes(word)) productScore += weight;
  }
  
  for (const { word, weight } of SALON_KEYWORDS) {
    if (messageLower.includes(word)) salonScore += weight;
  }
  
  for (const { word, weight } of SERVICE_KEYWORDS) {
    if (messageLower.includes(word)) serviceScore += weight;
  }
  
  // Boost salon score if location name is mentioned
  for (const location of LOCATION_PATTERNS) {
    if (messageLower.includes(location)) {
      salonScore += 2;
      break;
    }
  }
  
  // Handle common patterns
  if (messageLower.match(/salon.*(near|nearby|around|close|in\s)/i)) salonScore += 3;
  if (messageLower.match(/(find|show|list|recommend).*(salon|parlor|parlour)/i)) salonScore += 3;
  if (messageLower.match(/(near|nearby|around).*(me|my|here)/i) && !messageLower.includes('product')) salonScore += 2;
  
  // Return highest scoring intent (minimum threshold of 2)
  const maxScore = Math.max(productScore, salonScore, serviceScore);
  
  if (maxScore < 2) return 'general';
  
  if (salonScore === maxScore && salonScore >= productScore && salonScore >= serviceScore) return 'salon';
  if (productScore === maxScore && productScore > salonScore && productScore >= serviceScore) return 'product';
  if (serviceScore === maxScore && serviceScore > productScore && serviceScore > salonScore) return 'service';
  
  // Tie-breaking: prefer salon if location mentioned, otherwise prefer service
  if (salonScore === productScore || salonScore === serviceScore) {
    for (const location of LOCATION_PATTERNS) {
      if (messageLower.includes(location)) return 'salon';
    }
  }
  
  return 'general';
}

export async function validateGeminiApiKey(): Promise<boolean> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    console.warn('[BeautyConsultant] GEMINI_API_KEY is not configured');
    return false;
  }
  
  try {
    genAI = new GoogleGenAI({ apiKey });
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
      config: { maxOutputTokens: 10 },
    });
    console.log('✅ Gemini API key validated successfully');
    return true;
  } catch (error: any) {
    console.error('[BeautyConsultant] Gemini API key validation failed:', error.message);
    genAI = null;
    return false;
  }
}

export interface BeautyConsultantInput {
  message: string;
  intent?: string;
  userId?: string;
  location?: { lat: number; lng: number };
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  isGuest?: boolean;
}

export interface RichMediaCard {
  type: 'salon' | 'service' | 'product' | 'look';
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  imageUrls?: string[];
  rating?: number;
  reviewCount?: number;
  price?: string;
  distance?: string;
  duration?: string;
  ctaLabel?: string;
  ctaAction?: string;
}

export interface BeautyConsultantResponse {
  reply: string;
  suggestions?: string[];
  followUps?: string[];
  richMedia?: RichMediaCard[];
  relatedServices?: Array<{
    id: string;
    name: string;
    category: string;
    priceRange: string;
    imageUrl?: string;
    duration?: string;
  }>;
  relatedSalons?: Array<{
    id: string;
    name: string;
    rating: number;
    distance?: string;
    imageUrl?: string;
    reviewCount?: number;
    address?: string;
  }>;
}

async function fetchSalonContext(location?: { lat: number; lng: number }, limit: number = 5) {
  try {
    let salons;
    if (location) {
      const result = await db.execute(sql`
        SELECT id, name, address, rating, review_count, image_url, image_urls,
               ( 6371 * acos( cos( radians(${location.lat}) ) 
               * cos( radians( CAST(latitude AS FLOAT) ) )
               * cos( radians( CAST(longitude AS FLOAT) ) - radians(${location.lng}) ) 
               + sin( radians(${location.lat}) ) 
               * sin( radians( CAST(latitude AS FLOAT) ) ) ) ) AS distance
        FROM salons
        WHERE approval_status = 'approved' AND is_active = 1 AND latitude IS NOT NULL AND longitude IS NOT NULL
        ORDER BY distance ASC
        LIMIT ${limit}
      `);
      salons = result.rows;
    } else {
      salons = await db
        .select({
          id: schema.salons.id,
          name: schema.salons.name,
          address: schema.salons.address,
          rating: schema.salons.rating,
          reviewCount: schema.salons.reviewCount,
          imageUrl: schema.salons.imageUrl,
          imageUrls: schema.salons.imageUrls,
        })
        .from(schema.salons)
        .where(and(eq(schema.salons.approvalStatus, 'approved'), eq(schema.salons.isActive, 1)))
        .orderBy(sql`rating DESC NULLS LAST`)
        .limit(limit);
    }
    return salons;
  } catch (error) {
    console.error('[BeautyConsultant] Error fetching salons:', error);
    return [];
  }
}

async function fetchServicesContext(limit: number = 15) {
  try {
    const services = await db
      .select({
        id: schema.services.id,
        name: schema.services.name,
        category: schema.services.category,
        priceInPaisa: schema.services.priceInPaisa,
        durationMinutes: schema.services.durationMinutes,
        description: schema.services.description,
        imageUrl: schema.services.imageUrl,
      })
      .from(schema.services)
      .where(eq(schema.services.isActive, 1))
      .orderBy(sql`RANDOM()`)
      .limit(limit);
    return services;
  } catch (error) {
    console.error('[BeautyConsultant] Error fetching services:', error);
    return [];
  }
}

async function fetchProductsContext(searchTerms?: string[], limit: number = 10) {
  try {
    let products;
    
    if (searchTerms && searchTerms.length > 0) {
      // Build search conditions for relevant products
      const searchConditions = searchTerms.map(term => 
        or(
          ilike(schema.beautyProducts.name, `%${term}%`),
          ilike(schema.beautyProducts.category, `%${term}%`),
          ilike(schema.beautyProducts.description, `%${term}%`),
          ilike(schema.beautyProducts.brand, `%${term}%`)
        )
      );
      
      products = await db
        .select({
          id: schema.beautyProducts.id,
          name: schema.beautyProducts.name,
          brand: schema.beautyProducts.brand,
          category: schema.beautyProducts.category,
          price: schema.beautyProducts.price,
          imageUrl: schema.beautyProducts.imageUrl,
          description: schema.beautyProducts.description,
          finishType: schema.beautyProducts.finishType,
          skinToneCompatibility: schema.beautyProducts.skinToneCompatibility,
        })
        .from(schema.beautyProducts)
        .where(or(...searchConditions))
        .orderBy(sql`CASE WHEN image_url IS NOT NULL THEN 0 ELSE 1 END`)
        .limit(limit);
    }
    
    // If no search terms or no results, get popular products
    if (!products || products.length === 0) {
      products = await db
        .select({
          id: schema.beautyProducts.id,
          name: schema.beautyProducts.name,
          brand: schema.beautyProducts.brand,
          category: schema.beautyProducts.category,
          price: schema.beautyProducts.price,
          imageUrl: schema.beautyProducts.imageUrl,
          description: schema.beautyProducts.description,
          finishType: schema.beautyProducts.finishType,
          skinToneCompatibility: schema.beautyProducts.skinToneCompatibility,
        })
        .from(schema.beautyProducts)
        .orderBy(sql`RANDOM()`)
        .limit(limit);
    }
    
    return products;
  } catch (error) {
    console.error('[BeautyConsultant] Error fetching products:', error);
    return [];
  }
}

function extractSearchTerms(message: string): string[] {
  const messageLower = message.toLowerCase();
  const terms: string[] = [];
  
  // Skin type related
  if (messageLower.includes('oily')) terms.push('oily', 'matte', 'oil-free', 'gel');
  if (messageLower.includes('dry')) terms.push('dry', 'hydrating', 'moisturizing', 'cream');
  if (messageLower.includes('combination')) terms.push('combination', 'balancing');
  if (messageLower.includes('sensitive')) terms.push('sensitive', 'gentle', 'soothing');
  
  // Product type related
  if (messageLower.includes('cream') || messageLower.includes('moisturizer')) terms.push('cream', 'moisturizer');
  if (messageLower.includes('serum')) terms.push('serum');
  if (messageLower.includes('cleanser')) terms.push('cleanser', 'wash');
  if (messageLower.includes('sunscreen') || messageLower.includes('spf')) terms.push('sunscreen', 'spf');
  if (messageLower.includes('foundation')) terms.push('foundation');
  if (messageLower.includes('lipstick') || messageLower.includes('lip')) terms.push('lipstick', 'lip');
  if (messageLower.includes('mascara')) terms.push('mascara');
  if (messageLower.includes('eyeshadow')) terms.push('eyeshadow');
  
  // Concern related
  if (messageLower.includes('acne') || messageLower.includes('pimple')) terms.push('acne', 'blemish', 'salicylic');
  if (messageLower.includes('anti-aging') || messageLower.includes('wrinkle')) terms.push('anti-aging', 'retinol');
  if (messageLower.includes('dark spot') || messageLower.includes('pigmentation')) terms.push('brightening', 'vitamin c');
  
  return terms;
}

async function fetchActiveOffers(limit: number = 5) {
  try {
    const now = new Date();
    const offers = await db
      .select({
        id: schema.platformOffers.id,
        title: schema.platformOffers.title,
        description: schema.platformOffers.description,
        discountType: schema.platformOffers.discountType,
        discountValue: schema.platformOffers.discountValue,
      })
      .from(schema.platformOffers)
      .where(
        and(
          eq(schema.platformOffers.isActive, 1),
          eq(schema.platformOffers.approvalStatus, 'approved'),
          lte(schema.platformOffers.validFrom, now),
          gte(schema.platformOffers.validUntil, now)
        )
      )
      .limit(limit);
    return offers;
  } catch (error) {
    console.error('[BeautyConsultant] Error fetching offers:', error);
    return [];
  }
}

async function fetchUserBookingHistory(userId: string, limit: number = 5) {
  try {
    const bookings = await db
      .select({
        id: schema.bookings.id,
        serviceName: schema.services.name,
        serviceCategory: schema.services.category,
        salonName: schema.salons.name,
        bookingDate: schema.bookings.bookingDate,
      })
      .from(schema.bookings)
      .leftJoin(schema.services, eq(schema.bookings.serviceId, schema.services.id))
      .leftJoin(schema.salons, eq(schema.bookings.salonId, schema.salons.id))
      .where(eq(schema.bookings.userId, userId))
      .orderBy(sql`booking_date DESC`)
      .limit(limit);
    return bookings;
  } catch (error) {
    console.error('[BeautyConsultant] Error fetching booking history:', error);
    return [];
  }
}

function buildSystemPrompt(
  salons: any[],
  services: any[],
  offers: any[],
  userHistory: any[],
  isGuest: boolean = false,
  products: any[] = []
) {
  const salonContext = salons.length > 0
    ? `\n\nNEARBY/TOP SALONS:\n${salons.map((s: any) => 
        `- ${s.name} (Rating: ${s.rating || 'N/A'}${s.distance ? `, Distance: ${Number(s.distance).toFixed(1)}km` : ''})`
      ).join('\n')}`
    : '';

  const serviceContext = services.length > 0
    ? `\n\nAVAILABLE SERVICES:\n${services.map(s => 
        `- ${s.name} (${s.category}): ₹${Math.round(s.priceInPaisa / 100)} - ${s.durationMinutes}min`
      ).join('\n')}`
    : '';

  const productContext = products.length > 0
    ? `\n\nAVAILABLE PRODUCTS IN SHOP:\n${products.map(p => 
        `- ${p.brand} ${p.name} (${p.category}): ₹${Math.round(p.price / 100)}${p.finishType ? ` - ${p.finishType}` : ''}`
      ).join('\n')}`
    : '';

  const offerContext = offers.length > 0
    ? `\n\nCURRENT OFFERS:\n${offers.map(o => 
        `- ${o.title}: ${o.discountType === 'percentage' ? o.discountValue + '%' : '₹' + Math.round(o.discountValue / 100)} off`
      ).join('\n')}`
    : '';

  const historyContext = !isGuest && userHistory.length > 0
    ? `\n\nUSER'S RECENT BOOKINGS:\n${userHistory.map(b => 
        `- ${b.serviceName} at ${b.salonName} (${b.bookingDate})`
      ).join('\n')}`
    : '';

  const guestNote = isGuest
    ? `\n\nNOTE: This user is browsing as a guest. Provide helpful general beauty advice. Gently encourage them to sign up or log in for personalized recommendations based on their preferences and booking history.`
    : '';

  const personalizedNote = !isGuest && userHistory.length > 0
    ? `\n\nNOTE: This is a logged-in user with booking history. Use their past bookings to provide personalized recommendations.`
    : '';

  return `You are an AI Beauty Consultant for SalonHub, a platform connecting customers with beauty salons and services. Your role is to:

1. Provide ${isGuest ? 'general' : 'personalized'} beauty advice and recommendations
2. Help users discover services and salons
3. Answer questions about beauty trends, hair care, skincare, makeup, and grooming
4. Suggest services based on ${isGuest ? 'general trends' : 'user preferences and history'}
5. Help with booking decisions

PLATFORM CAPABILITIES:
- Book appointments at salons (at-salon services)
- Book at-home beauty services (home visits)
- Browse and purchase beauty products in the Shop
- Discover and attend beauty events
- Apply promotional offers and discounts

RESPONSE GUIDELINES:
- Be friendly, helpful, and conversational
- Keep responses concise but informative (2-4 sentences for simple queries)
- Use emojis sparingly for a friendly tone
- When recommending services, mention price ranges if available
- When recommending salons, mention ratings and location
- When recommending products, mention the brand, product name, and price
- If user asks about products/skincare/makeup items they can buy, recommend specific products from our Shop
- Suggest follow-up actions the user can take
- If user asks something outside beauty/salon domain, politely redirect${isGuest ? '\n- Occasionally mention that logging in provides personalized recommendations' : ''}

CONTEXT FROM SALONHUB:${salonContext}${serviceContext}${productContext}${offerContext}${historyContext}${guestNote}${personalizedNote}

Remember: You're helping users discover beauty services and make informed decisions. Always be supportive and encouraging about their beauty journey!`;
}

export async function getBeautyConsultantResponse(
  input: BeautyConsultantInput
): Promise<BeautyConsultantResponse> {
  const model = 'gemini-2.5-flash';
  const isGuest = input.isGuest ?? !input.userId;

  // Detect query intent to show appropriate content
  const queryIntent = detectQueryIntent(input.message, input.intent);
  const searchTerms = extractSearchTerms(input.message);

  const [salons, services, offers, userHistory, products] = await Promise.all([
    fetchSalonContext(input.location, 5),
    fetchServicesContext(15),
    fetchActiveOffers(5),
    input.userId && !isGuest ? fetchUserBookingHistory(input.userId, 5) : Promise.resolve([]),
    queryIntent === 'product' || queryIntent === 'general' ? fetchProductsContext(searchTerms, 10) : Promise.resolve([]),
  ]);

  const systemPrompt = buildSystemPrompt(salons, services, offers, userHistory, isGuest, products);

  const conversationMessages = input.conversationHistory?.map(msg => ({
    role: msg.role as 'user' | 'model',
    parts: [{ text: msg.content }],
  })) || [];

  const userMessage = input.intent 
    ? `[Intent: ${input.intent}] ${input.message}`
    : input.message;

  if (!genAI) {
    throw new Error('AI service is not available. Please try again later.');
  }

  try {
    const result = await genAI.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        ...conversationMessages.map(msg => ({
          role: msg.role === 'user' ? 'user' as const : 'model' as const,
          parts: msg.parts,
        })),
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ],
      config: {
        temperature: 0.8,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const reply = result.text || "I'm sorry, I couldn't generate a response. Please try again.";

    const suggestions = generateSuggestions(input.message, input.intent);
    const followUps = generateFollowUps(input.message);

    const relatedServices = services.slice(0, 3).map(s => ({
      id: String(s.id),
      name: s.name,
      category: s.category || 'General',
      priceRange: `₹${Math.round(s.priceInPaisa / 100)}`,
      imageUrl: s.imageUrl || undefined,
      duration: s.durationMinutes ? `${s.durationMinutes} min` : undefined,
    }));

    const relatedSalons = salons.slice(0, 3).map((s: any) => ({
      id: String(s.id),
      name: s.name,
      rating: Number(s.rating) || 0,
      distance: s.distance ? `${Number(s.distance).toFixed(1)}km` : undefined,
      imageUrl: s.imageUrl || s.image_url || undefined,
      reviewCount: Number(s.reviewCount || s.review_count) || 0,
      address: s.address || undefined,
    }));

    const richMedia: RichMediaCard[] = [];

    // Add rich media based on detected query intent
    if (queryIntent === 'product') {
      // Show products when user is asking about products
      products.slice(0, 5).forEach((p: any) => {
        if (p.imageUrl) {
          richMedia.push({
            type: 'product',
            id: String(p.id),
            title: p.name,
            subtitle: p.brand || p.category || 'Beauty Product',
            imageUrl: p.imageUrl,
            price: `₹${Math.round(p.price / 100)}`,
            ctaLabel: 'View Product',
            ctaAction: `/shop/product/${p.id}`,
          });
        }
      });
    } else if (queryIntent === 'salon') {
      // Show salons when user is asking about salons (show even without images)
      salons.slice(0, 5).forEach((s: any) => {
        const imageUrl = s.imageUrl || s.image_url;
        richMedia.push({
          type: 'salon',
          id: String(s.id),
          title: s.name,
          subtitle: s.address || 'Beauty Salon',
          imageUrl: imageUrl || undefined,
          imageUrls: s.imageUrls || s.image_urls || undefined,
          rating: Number(s.rating) || undefined,
          reviewCount: Number(s.reviewCount || s.review_count) || undefined,
          distance: s.distance ? `${Number(s.distance).toFixed(1)}km` : undefined,
          ctaLabel: 'Book Now',
          ctaAction: `/salon/${s.id}`,
        });
      });
    } else if (queryIntent === 'service') {
      // Show services when user is asking about services
      services.slice(0, 5).forEach(s => {
        if (s.imageUrl) {
          richMedia.push({
            type: 'service',
            id: String(s.id),
            title: s.name,
            subtitle: s.category || 'Beauty Service',
            imageUrl: s.imageUrl,
            price: `₹${Math.round(s.priceInPaisa / 100)}`,
            duration: s.durationMinutes ? `${s.durationMinutes} min` : undefined,
            ctaLabel: 'Book Now',
            ctaAction: `/booking?service=${s.id}`,
          });
        }
      });
    } else {
      // General queries - show a mix of products, salons, and services
      // Prioritize products if any were fetched
      products.slice(0, 2).forEach((p: any) => {
        if (p.imageUrl) {
          richMedia.push({
            type: 'product',
            id: String(p.id),
            title: p.name,
            subtitle: p.brand || p.category || 'Beauty Product',
            imageUrl: p.imageUrl,
            price: `₹${Math.round(p.price / 100)}`,
            ctaLabel: 'View Product',
            ctaAction: `/shop/product/${p.id}`,
          });
        }
      });
      
      salons.slice(0, 2).forEach((s: any) => {
        const imageUrl = s.imageUrl || s.image_url;
        if (imageUrl) {
          richMedia.push({
            type: 'salon',
            id: String(s.id),
            title: s.name,
            subtitle: s.address || undefined,
            imageUrl: imageUrl,
            imageUrls: s.imageUrls || s.image_urls || undefined,
            rating: Number(s.rating) || undefined,
            reviewCount: Number(s.reviewCount || s.review_count) || undefined,
            distance: s.distance ? `${Number(s.distance).toFixed(1)}km` : undefined,
            ctaLabel: 'View Salon',
            ctaAction: `/salon/${s.id}`,
          });
        }
      });
      
      services.slice(0, 2).forEach(s => {
        if (s.imageUrl) {
          richMedia.push({
            type: 'service',
            id: String(s.id),
            title: s.name,
            subtitle: s.category || 'Beauty Service',
            imageUrl: s.imageUrl,
            price: `₹${Math.round(s.priceInPaisa / 100)}`,
            duration: s.durationMinutes ? `${s.durationMinutes} min` : undefined,
            ctaLabel: 'Book Now',
            ctaAction: `/booking?service=${s.id}`,
          });
        }
      });
    }

    return {
      reply,
      suggestions,
      followUps,
      richMedia: richMedia.length > 0 ? richMedia : undefined,
      relatedServices: relatedServices.length > 0 ? relatedServices : undefined,
      relatedSalons: relatedSalons.length > 0 ? relatedSalons : undefined,
    };
  } catch (error: any) {
    console.error('[BeautyConsultant] AI generation error:', error);

    if (error.status === 429 || error.message?.includes('quota')) {
      throw new Error('Our AI service is busy right now. Please try again in a moment.');
    }

    throw new Error('Unable to process your request. Please try again.');
  }
}

function generateSuggestions(message: string, intent?: string): string[] {
  const suggestions: string[] = [];
  const messageLower = message.toLowerCase();

  if (messageLower.includes('hair') || intent === 'recommend_hairstyle') {
    suggestions.push('What hairstyles suit round faces?', 'Best hair color for my skin tone', 'How to fix damaged hair?');
  } else if (messageLower.includes('skin') || intent === 'skincare_routine') {
    suggestions.push('Morning skincare routine', 'Best products for oily skin', 'How to reduce dark circles?');
  } else if (messageLower.includes('makeup') || intent === 'makeup_tips') {
    suggestions.push('Natural everyday makeup', 'Best foundation for beginners', 'Bridal makeup tips');
  } else if (messageLower.includes('salon') || intent === 'find_salon') {
    suggestions.push('Best rated salons near me', 'Salons with bridal packages', 'Budget-friendly salons');
  } else {
    suggestions.push('Recommend a hairstyle for me', 'Skincare routine for my skin type', 'Find salons near me');
  }

  return suggestions.slice(0, 3);
}

function generateFollowUps(message: string): string[] {
  return [
    'Would you like to book an appointment?',
    'Want me to find salons offering this service?',
    'Should I show you related offers?',
  ];
}

export function getQuickActionChips() {
  return [
    { id: 'recommend_hairstyle', label: 'Hairstyle Ideas', icon: 'scissors' },
    { id: 'skincare_routine', label: 'Skincare Tips', icon: 'sparkles' },
    { id: 'makeup_tips', label: 'Makeup Guide', icon: 'palette' },
    { id: 'find_salon', label: 'Find Salons', icon: 'map-pin' },
    { id: 'trending_looks', label: 'Trending Now', icon: 'trending-up' },
    { id: 'bridal_beauty', label: 'Bridal Beauty', icon: 'heart' },
    { id: 'men_grooming', label: 'Men\'s Grooming', icon: 'user' },
    { id: 'nail_art', label: 'Nail Art', icon: 'brush' },
  ];
}

import { db } from '../db';
import { beautyProducts, salonInventory, effectPresets } from '@shared/schema';
import { eq, and, sql, or } from 'drizzle-orm';
import { ProductRecommendation } from './gemini.service';

export interface MatchedProduct {
  id: string;
  brand: string;
  productLine: string | null;
  name: string;
  category: string;
  shade: string | null;
  sku: string;
  finishType: string | null;
  price: number;
  imageUrl: string | null;
  description: string | null;
  isInStock: boolean;
  quantity: number;
  substituteProduct: MatchedProduct | null;
}

export interface MatchedLook {
  lookName: string;
  description: string;
  confidenceScore: number;
  presetIds: string[];
  products: Array<{
    product: MatchedProduct;
    applicationArea: string;
    reason: string;
    quantityNeeded: string;
  }>;
}

export interface MatchedProductWithContext {
  product: MatchedProduct;
  recommendation: ProductRecommendation;
}

export async function matchProductsForLook(
  salonId: string,
  productRecommendations: ProductRecommendation[],
  customerGender?: string | null
): Promise<MatchedProductWithContext[]> {
  const matchedProducts: MatchedProductWithContext[] = [];

  for (const recommendation of productRecommendations) {
    const { category, productId } = recommendation;
    const attributes = recommendation.attributes || {}; // Handle optional attributes

    let matchingProducts;

    // NEW: If AI provided a productId, fetch it directly
    if (productId) {
      console.log(`[Product Matcher] Using direct productId: ${productId} for category: ${category}`);
      
      matchingProducts = await db
        .select({
          id: beautyProducts.id,
          brand: beautyProducts.brand,
          productLine: beautyProducts.productLine,
          name: beautyProducts.name,
          category: beautyProducts.category,
          shade: beautyProducts.shade,
          sku: beautyProducts.sku,
          finishType: beautyProducts.finishType,
          price: beautyProducts.price,
          imageUrl: beautyProducts.imageUrl,
          description: beautyProducts.description,
          gender: beautyProducts.gender,
          inventoryQuantity: sql<number>`COALESCE(${salonInventory.quantity}, 0)`,
        })
        .from(beautyProducts)
        .leftJoin(
          salonInventory,
          and(
            eq(salonInventory.productId, beautyProducts.id),
            eq(salonInventory.salonId, salonId)
          )
        )
        .where(eq(beautyProducts.id, productId))
        .limit(1);

      if (matchingProducts.length === 0) {
        console.warn(`[Product Matcher] Invalid productId ${productId} - falling back to attribute matching`);
      }
    }

    // FALLBACK: If no productId or direct match failed, use attribute-based matching
    if (!matchingProducts || matchingProducts.length === 0) {
      console.log(`[Product Matcher] Using attribute matching for category: ${category}`);
      
      matchingProducts = await db
        .select({
          id: beautyProducts.id,
          brand: beautyProducts.brand,
          productLine: beautyProducts.productLine,
          name: beautyProducts.name,
          category: beautyProducts.category,
          shade: beautyProducts.shade,
          sku: beautyProducts.sku,
          finishType: beautyProducts.finishType,
          price: beautyProducts.price,
          imageUrl: beautyProducts.imageUrl,
          description: beautyProducts.description,
          gender: beautyProducts.gender,
          inventoryQuantity: sql<number>`COALESCE(${salonInventory.quantity}, 0)`,
        })
        .from(beautyProducts)
        .leftJoin(
          salonInventory,
          and(
            eq(salonInventory.productId, beautyProducts.id),
            eq(salonInventory.salonId, salonId)
          )
        )
        .where(buildProductMatchQuery(category, attributes, customerGender))
        .limit(5);
    }

    if (matchingProducts.length === 0) {
      console.warn(`[Product Matcher] No product match found for category: ${category}, productId: ${productId}, attributes:`, attributes);
      continue;
    }

    const inStockProducts = matchingProducts.filter(p => (p.inventoryQuantity || 0) > 0);
    const selectedProduct = inStockProducts.length > 0 ? inStockProducts[0] : matchingProducts[0];

    let substituteProduct = null;
    if (inStockProducts.length === 0 && matchingProducts.length > 1) {
      const alternativeInStock = matchingProducts.find(p => (p.inventoryQuantity || 0) > 0);
      if (alternativeInStock) {
        substituteProduct = {
          id: alternativeInStock.id,
          brand: alternativeInStock.brand,
          productLine: alternativeInStock.productLine,
          name: alternativeInStock.name,
          category: alternativeInStock.category,
          shade: alternativeInStock.shade,
          sku: alternativeInStock.sku,
          finishType: alternativeInStock.finishType,
          price: alternativeInStock.price,
          imageUrl: alternativeInStock.imageUrl,
          description: alternativeInStock.description,
          isInStock: true,
          quantity: alternativeInStock.inventoryQuantity || 0,
          substituteProduct: null,
        };
      }
    }

    matchedProducts.push({
      product: {
        id: selectedProduct.id,
        brand: selectedProduct.brand,
        productLine: selectedProduct.productLine,
        name: selectedProduct.name,
        category: selectedProduct.category,
        shade: selectedProduct.shade,
        sku: selectedProduct.sku,
        finishType: selectedProduct.finishType,
        price: selectedProduct.price,
        imageUrl: selectedProduct.imageUrl,
        description: selectedProduct.description,
        isInStock: (selectedProduct.inventoryQuantity || 0) > 0,
        quantity: selectedProduct.inventoryQuantity || 0,
        substituteProduct,
      },
      recommendation,
    });
  }

  return matchedProducts;
}

function buildProductMatchQuery(category: string, attributes: any = {}, customerGender?: string | null): any {
  const conditions = [eq(beautyProducts.category, category)];

  if (customerGender === 'male') {
    conditions.push(
      or(
        eq(beautyProducts.gender, 'male'),
        eq(beautyProducts.gender, 'unisex')
      )!
    );
  } else if (customerGender === 'female') {
    conditions.push(
      or(
        eq(beautyProducts.gender, 'female'),
        eq(beautyProducts.gender, 'unisex')
      )!
    );
  }
  // For 'prefer_not' or no gender specified, allow ALL genders (no filter)

  if (attributes?.shade) {
    conditions.push(
      or(
        sql`LOWER(${beautyProducts.shade}) LIKE LOWER('%' || ${attributes.shade} || '%')`,
        sql`LOWER(${beautyProducts.name}) LIKE LOWER('%' || ${attributes.shade} || '%')`
      )!
    );
  }

  if (attributes?.finish) {
    conditions.push(
      or(
        sql`LOWER(${beautyProducts.finishType}) LIKE LOWER('%' || ${attributes.finish} || '%')`,
        sql`LOWER(${beautyProducts.name}) LIKE LOWER('%' || ${attributes.finish} || '%')`
      )!
    );
  }

  if (attributes?.type) {
    conditions.push(
      sql`LOWER(${beautyProducts.name}) LIKE LOWER('%' || ${attributes.type} || '%')`
    );
  }

  return and(...conditions);
}

export async function resolvePresetsToEffects(presetCategories: string[]): Promise<string[]> {
  if (presetCategories.length === 0) {
    console.log('[resolvePresetsToEffects] No preset categories provided, returning empty array');
    return [];
  }

  console.log('[resolvePresetsToEffects] Looking up preset slugs:', presetCategories);
  
  // Query by slug (exact match to Gemini's presetCategories)
  const presets = await db
    .select()
    .from(effectPresets)
    .where(
      or(...presetCategories.map(slug => eq(effectPresets.slug, slug)))
    )
    .limit(10);

  console.log('[resolvePresetsToEffects] Found presets:', presets.map(p => ({ id: p.id, slug: p.slug, name: p.name })));
  
  // Fallback: if no exact slug match, warn and return first generic preset per category
  if (presets.length === 0) {
    console.warn('[resolvePresetsToEffects] No exact slug matches found for:', presetCategories);
    console.warn('[resolvePresetsToEffects] Falling back to generic presets');
    
    // Extract unique categories from slugs (e.g., makeup_natural → makeup)
    const categorySet = new Set<string>();
    presetCategories.forEach(slug => categorySet.add(slug.split('_')[0]));
    const categories = Array.from(categorySet);
    
    const fallbackPresets = await db
      .select()
      .from(effectPresets)
      .where(
        or(...categories.map(cat => eq(effectPresets.category, cat)))
      )
      .limit(categories.length);
    
    console.log('[resolvePresetsToEffects] Fallback presets:', fallbackPresets.map(p => ({ id: p.id, slug: p.slug })));
    return fallbackPresets.map(p => p.id);
  }
  
  const presetIds = presets.map(p => p.id);
  console.log('[resolvePresetsToEffects] Returning preset IDs:', presetIds);
  
  return presetIds;
}

export async function decrementInventory(
  salonId: string,
  productId: string,
  quantity: number = 1
): Promise<void> {
  const inventory = await db
    .select()
    .from(salonInventory)
    .where(
      and(
        eq(salonInventory.salonId, salonId),
        eq(salonInventory.productId, productId)
      )
    )
    .limit(1);

  if (inventory.length === 0) {
    throw new Error('Product not in salon inventory');
  }

  const currentQty = inventory[0].quantity || 0;
  if (currentQty < quantity) {
    throw new Error('Insufficient inventory');
  }

  await db
    .update(salonInventory)
    .set({ 
      quantity: currentQty - quantity,
    })
    .where(
      and(
        eq(salonInventory.salonId, salonId),
        eq(salonInventory.productId, productId)
      )
    );
}

export async function getProductsBySalon(salonId: string): Promise<MatchedProduct[]> {
  const products = await db
    .select({
      id: beautyProducts.id,
      brand: beautyProducts.brand,
      productLine: beautyProducts.productLine,
      name: beautyProducts.name,
      category: beautyProducts.category,
      shade: beautyProducts.shade,
      sku: beautyProducts.sku,
      finishType: beautyProducts.finishType,
      price: beautyProducts.price,
      imageUrl: beautyProducts.imageUrl,
      description: beautyProducts.description,
      quantity: salonInventory.quantity,
    })
    .from(beautyProducts)
    .innerJoin(
      salonInventory,
      and(
        eq(salonInventory.productId, beautyProducts.id),
        eq(salonInventory.salonId, salonId)
      )
    )
    .orderBy(beautyProducts.brand, beautyProducts.name);

  return products.map(p => ({
    id: p.id,
    brand: p.brand,
    productLine: p.productLine,
    name: p.name,
    category: p.category,
    shade: p.shade,
    sku: p.sku,
    finishType: p.finishType,
    price: p.price,
    imageUrl: p.imageUrl,
    description: p.description,
    isInStock: (p.quantity || 0) > 0,
    quantity: p.quantity || 0,
    substituteProduct: null,
  }));
}

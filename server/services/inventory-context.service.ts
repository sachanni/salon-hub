import { db } from '../db';
import { beautyProducts, salonInventory } from '@shared/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';

export interface ProductForAI {
  id: string;
  category: string;
  brand: string;
  name: string;
  shade: string | null;
  finishType: string | null;
  price: number;
  inStock: boolean;
  quantity: number;
}

export interface InventoryContext {
  totalProducts: number;
  categoriesAvailable: string[];
  productsByCategoryFormatted: string;
  productIdMap: Map<string, ProductForAI>;
}

/**
 * Builds a condensed, category-grouped inventory context for Gemini AI
 * Limits products per category to keep context size manageable
 * Optionally filters by preferred brands
 */
export async function buildInventoryContextForAI(
  salonId: string,
  maxPerCategory: number = 10,
  preferredBrands?: string[]
): Promise<InventoryContext> {
  
  // Fetch ONLY products that this salon has in inventory
  let productsWithInventory = await db
    .select({
      id: beautyProducts.id,
      category: beautyProducts.category,
      brand: beautyProducts.brand,
      name: beautyProducts.name,
      shade: beautyProducts.shade,
      finishType: beautyProducts.finishType,
      price: beautyProducts.price,
      gender: beautyProducts.gender,
      quantity: salonInventory.quantity,
    })
    .from(salonInventory)
    .innerJoin(
      beautyProducts,
      eq(beautyProducts.id, salonInventory.productId)
    )
    .where(
      and(
        eq(salonInventory.salonId, salonId),
        sql`${salonInventory.quantity} > 0` // Only in-stock products
      )
    )
    .orderBy(sql`${salonInventory.quantity} DESC`);

  // Filter by preferred brands if specified
  if (preferredBrands && preferredBrands.length > 0) {
    const brandsLower = preferredBrands.map(b => b.toLowerCase());
    productsWithInventory = productsWithInventory.filter(p => 
      brandsLower.includes(p.brand.toLowerCase())
    );
    console.log(`[Inventory] Filtered to ${preferredBrands.join(', ')} brands: ${productsWithInventory.length} products`);
  }

  // Group products by category
  const productsByCategory = productsWithInventory.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push({
      id: product.id,
      category: product.category,
      brand: product.brand,
      name: product.name,
      shade: product.shade,
      finishType: product.finishType,
      price: product.price,
      inStock: (product.quantity || 0) > 0,
      quantity: product.quantity || 0,
    });
    return acc;
  }, {} as Record<string, ProductForAI[]>);

  // Limit products per category and prioritize in-stock items
  const limitedProducts: Record<string, ProductForAI[]> = {};
  const productIdMap = new Map<string, ProductForAI>();
  
  for (const [category, products] of Object.entries(productsByCategory)) {
    // Sort: in-stock first, then by quantity descending
    const sorted = products.sort((a, b) => {
      if (a.inStock && !b.inStock) return -1;
      if (!a.inStock && b.inStock) return 1;
      return b.quantity - a.quantity;
    });

    // Take top N products
    limitedProducts[category] = sorted.slice(0, maxPerCategory);
    
    // Build ID map for quick lookup
    limitedProducts[category].forEach(product => {
      productIdMap.set(product.id, product);
    });
  }

  // Format as structured text for AI prompt
  const formattedInventory = Object.entries(limitedProducts)
    .map(([category, products]) => {
      const productList = products
        .map((p, idx) => {
          const stockStatus = p.inStock ? `✓ In stock (${p.quantity})` : '✗ Out of stock';
          const shadeInfo = p.shade ? ` - Shade: ${p.shade}` : '';
          const finishInfo = p.finishType ? ` - Finish: ${p.finishType}` : '';
          return `  ${idx + 1}. [ID: ${p.id}] ${p.brand} ${p.name}${shadeInfo}${finishInfo} (${stockStatus})`;
        })
        .join('\n');
      
      return `**${category.toUpperCase()}** (${products.length} products):\n${productList}`;
    })
    .join('\n\n');

  const categoriesAvailable = Object.keys(limitedProducts);
  const totalProducts = Array.from(productIdMap.values()).length;

  // Warn if inventory is empty
  if (totalProducts === 0) {
    console.warn(`[Inventory Context] WARNING: Salon ${salonId} has no products in inventory${preferredBrands ? ` for brands: ${preferredBrands.join(', ')}` : ''}`);
  }

  return {
    totalProducts,
    categoriesAvailable,
    productsByCategoryFormatted: formattedInventory,
    productIdMap,
  };
}

/**
 * Validates that AI-recommended product IDs exist in the provided inventory
 */
export function validateProductIDs(
  productIds: string[],
  inventoryContext: InventoryContext
): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const id of productIds) {
    if (inventoryContext.productIdMap.has(id)) {
      valid.push(id);
    } else {
      invalid.push(id);
    }
  }

  return { valid, invalid };
}

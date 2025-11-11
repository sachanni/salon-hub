/**
 * Get product color based on category and shade
 */
export function getProductColor(category: string, shade?: string): string {
  // Default colors based on product category
  const categoryDefaults: Record<string, string> = {
    lipstick: '#c83264',
    'lip gloss': '#ff6b9d',
    blush: '#ff9eb3',
    eyeliner: '#2c1810',
    eyeshadow: '#8b6f47',
    mascara: '#000000',
    bronzer: '#cd9575',
    foundation: '#f5d5c2',
    concealer: '#f0e4d7',
    primer: '#ffe8dc',
    highlighter: '#ffd8a8',
    'hair color': '#8b4513',
  };
  
  const categoryKey = category.toLowerCase();
  return categoryDefaults[categoryKey] || '#c83264';
}

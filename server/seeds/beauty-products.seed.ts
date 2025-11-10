import { db } from '../db';
import { beautyProducts, effectPresets } from '@shared/schema';

const products = [
  // LAKME FOUNDATIONS
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Perfect Radiance Foundation', category: 'foundation', shade: 'Fair Ivory', sku: 'LAK-FND-001', finishType: 'dewy', skinToneCompatibility: 'fair,light', price: 115000, description: 'Radiant finish foundation with SPF 20' },
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Perfect Radiance Foundation', category: 'foundation', shade: 'Light Beige', sku: 'LAK-FND-002', finishType: 'dewy', skinToneCompatibility: 'light,medium', price: 115000, description: 'Radiant finish foundation with SPF 20' },
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Perfect Radiance Foundation', category: 'foundation', shade: 'Medium Tan', sku: 'LAK-FND-003', finishType: 'dewy', skinToneCompatibility: 'medium,olive', price: 115000, description: 'Radiant finish foundation with SPF 20' },
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Perfect Radiance Foundation', category: 'foundation', shade: 'Golden Beige', sku: 'LAK-FND-004', finishType: 'dewy', skinToneCompatibility: 'medium,tan', price: 115000, description: 'Radiant finish foundation with SPF 20' },
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Mattreal Skin Foundation', category: 'foundation', shade: 'Caramel', sku: 'LAK-FND-005', finishType: 'matte', skinToneCompatibility: 'tan,dark', price: 115000, description: 'Oil-free matte foundation' },
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Mattreal Skin Foundation', category: 'foundation', shade: 'Deep Espresso', sku: 'LAK-FND-006', finishType: 'matte', skinToneCompatibility: 'dark,deep', price: 115000, description: 'Oil-free matte foundation' },
  
  // L'OREAL PARIS FOUNDATIONS
  { brand: "L'Oreal Paris", productLine: 'Infallible', name: 'Infallible Total Cover Foundation', category: 'foundation', shade: 'Porcelain', sku: 'LOR-FND-001', finishType: 'natural', skinToneCompatibility: 'fair,light', price: 135000, description: 'Full coverage long-wear foundation' },
  { brand: "L'Oreal Paris", productLine: 'Infallible', name: 'Infallible Total Cover Foundation', category: 'foundation', shade: 'Vanilla', sku: 'LOR-FND-002', finishType: 'natural', skinToneCompatibility: 'light,medium', price: 135000, description: 'Full coverage long-wear foundation' },
  { brand: "L'Oreal Paris", productLine: 'Infallible', name: 'Infallible Total Cover Foundation', category: 'foundation', shade: 'Sand Beige', sku: 'LOR-FND-003', finishType: 'natural', skinToneCompatibility: 'medium,tan', price: 135000, description: 'Full coverage long-wear foundation' },
  { brand: "L'Oreal Paris", productLine: 'True Match', name: 'True Match Super Blendable Foundation', category: 'foundation', shade: 'Natural Buff', sku: 'LOR-FND-004', finishType: 'natural', skinToneCompatibility: 'medium,olive', price: 119900, description: 'Matches skin tone perfectly' },
  
  // MAYBELLINE FOUNDATIONS
  { brand: 'Maybelline', productLine: 'Fit Me', name: 'Fit Me Matte + Poreless Foundation', category: 'foundation', shade: 'Ivory', sku: 'MAY-FND-001', finishType: 'matte', skinToneCompatibility: 'fair,light', price: 59900, description: 'Mattifies and refines pores' },
  { brand: 'Maybelline', productLine: 'Fit Me', name: 'Fit Me Matte + Poreless Foundation', category: 'foundation', shade: 'Natural Beige', sku: 'MAY-FND-002', finishType: 'matte', skinToneCompatibility: 'medium,tan', price: 59900, description: 'Mattifies and refines pores' },
  { brand: 'Maybelline', productLine: 'Fit Me', name: 'Fit Me Dewy + Smooth Foundation', category: 'foundation', shade: 'Nude Beige', sku: 'MAY-FND-003', finishType: 'dewy', skinToneCompatibility: 'light,medium', price: 59900, description: 'Hydrates for smooth skin' },
  
  // MAC FOUNDATIONS
  { brand: 'MAC', productLine: 'Studio Fix', name: 'Studio Fix Fluid SPF 15', category: 'foundation', shade: 'NC15', sku: 'MAC-FND-001', finishType: 'natural', skinToneCompatibility: 'fair,light', price: 285000, description: 'Medium to full buildable coverage' },
  { brand: 'MAC', productLine: 'Studio Fix', name: 'Studio Fix Fluid SPF 15', category: 'foundation', shade: 'NC25', sku: 'MAC-FND-002', finishType: 'natural', skinToneCompatibility: 'light,medium', price: 285000, description: 'Medium to full buildable coverage' },
  { brand: 'MAC', productLine: 'Studio Fix', name: 'Studio Fix Fluid SPF 15', category: 'foundation', shade: 'NC35', sku: 'MAC-FND-003', finishType: 'natural', skinToneCompatibility: 'medium,tan', price: 285000, description: 'Medium to full buildable coverage' },
  { brand: 'MAC', productLine: 'Studio Fix', name: 'Studio Fix Fluid SPF 15', category: 'foundation', shade: 'NC42', sku: 'MAC-FND-004', finishType: 'natural', skinToneCompatibility: 'tan,dark', price: 285000, description: 'Medium to full buildable coverage' },
  
  // CONCEALERS
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute White Intense Concealer', category: 'concealer', shade: 'Fair', sku: 'LAK-CON-001', finishType: 'natural', skinToneCompatibility: 'fair,light', price: 32500, description: 'Brightening concealer' },
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute White Intense Concealer', category: 'concealer', shade: 'Medium', sku: 'LAK-CON-002', finishType: 'natural', skinToneCompatibility: 'medium,tan', price: 32500, description: 'Brightening concealer' },
  { brand: 'Maybelline', productLine: 'Fit Me', name: 'Fit Me Concealer', category: 'concealer', shade: 'Light', sku: 'MAY-CON-001', finishType: 'natural', skinToneCompatibility: 'light,medium', price: 39900, description: 'Matches skin tone and texture' },
  { brand: 'NYX', productLine: 'HD', name: 'HD Studio Photogenic Concealer', category: 'concealer', shade: 'Natural Beige', sku: 'NYX-CON-001', finishType: 'matte', skinToneCompatibility: 'medium,tan', price: 60000, description: 'HD quality concealer' },
  
  // LIPSTICKS
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Argan Oil Lip Color', category: 'lipstick', shade: 'Nude Rose', sku: 'LAK-LIP-001', finishType: 'cream', skinToneCompatibility: 'all', price: 67500, description: 'Nourishing lip color with argan oil' },
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Argan Oil Lip Color', category: 'lipstick', shade: 'Coral Red', sku: 'LAK-LIP-002', finishType: 'cream', skinToneCompatibility: 'all', price: 67500, description: 'Nourishing lip color with argan oil' },
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Matte Lipstick', category: 'lipstick', shade: 'Mauve Pink', sku: 'LAK-LIP-003', finishType: 'matte', skinToneCompatibility: 'all', price: 67500, description: 'Long-lasting matte finish' },
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Matte Lipstick', category: 'lipstick', shade: 'Berry Wine', sku: 'LAK-LIP-004', finishType: 'matte', skinToneCompatibility: 'all', price: 67500, description: 'Long-lasting matte finish' },
  { brand: "L'Oreal Paris", productLine: 'Color Riche', name: 'Color Riche Matte Lipstick', category: 'lipstick', shade: 'Classic Red', sku: 'LOR-LIP-001', finishType: 'matte', skinToneCompatibility: 'all', price: 85000, description: 'Luxurious matte formula' },
  { brand: "L'Oreal Paris", productLine: 'Color Riche', name: 'Color Riche Matte Lipstick', category: 'lipstick', shade: 'Plum', sku: 'LOR-LIP-002', finishType: 'matte', skinToneCompatibility: 'all', price: 85000, description: 'Luxurious matte formula' },
  { brand: 'Maybelline', productLine: 'Superstay', name: 'Superstay Matte Ink', category: 'lipstick', shade: 'Pioneer', sku: 'MAY-LIP-001', finishType: 'matte', skinToneCompatibility: 'all', price: 59900, description: '16hr liquid matte lipstick' },
  { brand: 'Maybelline', productLine: 'Superstay', name: 'Superstay Matte Ink', category: 'lipstick', shade: 'Lover', sku: 'MAY-LIP-002', finishType: 'matte', skinToneCompatibility: 'all', price: 59900, description: '16hr liquid matte lipstick' },
  { brand: 'MAC', productLine: 'Retro Matte', name: 'Retro Matte Lipstick', category: 'lipstick', shade: 'Ruby Woo', sku: 'MAC-LIP-001', finishType: 'matte', skinToneCompatibility: 'all', price: 180000, description: 'Iconic red lipstick' },
  { brand: 'MAC', productLine: 'Lustre', name: 'Lustre Lipstick', category: 'lipstick', shade: 'Creme Cup', sku: 'MAC-LIP-002', finishType: 'cream', skinToneCompatibility: 'all', price: 180000, description: 'Sheer creamy formula' },
  
  // EYESHADOWS
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Infinity Eye Shadow', category: 'eyeshadow', shade: 'Champagne Gold', sku: 'LAK-EYE-001', finishType: 'shimmer', skinToneCompatibility: 'all', price: 42500, description: 'Silky smooth eyeshadow' },
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Infinity Eye Shadow', category: 'eyeshadow', shade: 'Bronze', sku: 'LAK-EYE-002', finishType: 'shimmer', skinToneCompatibility: 'all', price: 42500, description: 'Silky smooth eyeshadow' },
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Infinity Eye Shadow', category: 'eyeshadow', shade: 'Soft Pink', sku: 'LAK-EYE-003', finishType: 'matte', skinToneCompatibility: 'all', price: 42500, description: 'Silky smooth eyeshadow' },
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Infinity Eye Shadow', category: 'eyeshadow', shade: 'Charcoal', sku: 'LAK-EYE-004', finishType: 'matte', skinToneCompatibility: 'all', price: 42500, description: 'Silky smooth eyeshadow' },
  { brand: 'Maybelline', productLine: 'The Nudes', name: 'The Nudes Palette', category: 'eyeshadow', shade: 'Nude Beige', sku: 'MAY-EYE-001', finishType: 'matte', skinToneCompatibility: 'all', price: 99900, description: '12 curated nude shades' },
  { brand: 'NYX', productLine: 'Ultimate', name: 'Ultimate Shadow Palette', category: 'eyeshadow', shade: 'Warm Neutrals', sku: 'NYX-EYE-001', finishType: 'shimmer', skinToneCompatibility: 'all', price: 119900, description: '16 versatile shades' },
  
  // BLUSH
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Face Stylist Blush', category: 'blush', shade: 'Coral Glow', sku: 'LAK-BLU-001', finishType: 'powder', skinToneCompatibility: 'light,medium,tan', price: 59900, description: 'Natural-looking flush' },
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Face Stylist Blush', category: 'blush', shade: 'Rose Pink', sku: 'LAK-BLU-002', finishType: 'powder', skinToneCompatibility: 'fair,light,medium', price: 59900, description: 'Natural-looking flush' },
  { brand: 'Maybelline', productLine: 'Fit Me', name: 'Fit Me Blush', category: 'blush', shade: 'Pink', sku: 'MAY-BLU-001', finishType: 'powder', skinToneCompatibility: 'light,medium', price: 39900, description: 'Lightweight blush' },
  { brand: 'NYX', productLine: 'High Definition', name: 'HD Blush', category: 'blush', shade: 'Peach', sku: 'NYX-BLU-001', finishType: 'powder', skinToneCompatibility: 'medium,tan', price: 65000, description: 'HD quality blush' },
  
  // BRONZER & HIGHLIGHTER
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Sun Kissed Bronzer', category: 'bronzer', shade: 'Sun Bronze', sku: 'LAK-BRO-001', finishType: 'powder', skinToneCompatibility: 'medium,tan,dark', price: 67500, description: 'Warm bronzed glow' },
  { brand: 'Maybelline', productLine: 'Fit Me', name: 'Fit Me Bronzer', category: 'bronzer', shade: 'Medium Bronze', sku: 'MAY-BRO-001', finishType: 'powder', skinToneCompatibility: 'medium,tan', price: 44900, description: 'Natural bronze finish' },
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Moonlit Highlighter', category: 'highlighter', shade: 'Golden Glow', sku: 'LAK-HIG-001', finishType: 'powder', skinToneCompatibility: 'all', price: 67500, description: 'Radiant highlight' },
  { brand: 'NYX', productLine: 'Born to Glow', name: 'Born to Glow Liquid Illuminator', category: 'highlighter', shade: 'Sunbeam', sku: 'NYX-HIG-001', finishType: 'liquid', skinToneCompatibility: 'all', price: 75000, description: 'Intense liquid highlight' },
  
  // EYELINER
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Shine Liquid Eye Liner', category: 'eyeliner', shade: 'Black', sku: 'LAK-ELN-001', finishType: 'liquid', skinToneCompatibility: 'all', price: 47500, description: 'Intense black liner' },
  { brand: 'Lakme', productLine: 'Eyeconic', name: 'Eyeconic Kajal', category: 'eyeliner', shade: 'Deep Black', sku: 'LAK-ELN-002', finishType: 'pencil', skinToneCompatibility: 'all', price: 22500, description: '22hr stay kajal' },
  { brand: 'Maybelline', productLine: 'Colossal', name: 'Colossal Kajal', category: 'eyeliner', shade: 'Black', sku: 'MAY-ELN-001', finishType: 'pencil', skinToneCompatibility: 'all', price: 22500, description: 'Intense black kajal' },
  { brand: 'NYX', productLine: 'Epic Ink', name: 'Epic Ink Liner', category: 'eyeliner', shade: 'Black', sku: 'NYX-ELN-001', finishType: 'liquid', skinToneCompatibility: 'all', price: 85000, description: 'Waterproof felt-tip liner' },
  
  // MASCARA
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Lash Stylist Mascara', category: 'mascara', shade: 'Black', sku: 'LAK-MAS-001', finishType: 'volumizing', skinToneCompatibility: 'all', price: 67500, description: 'Voluminous lashes' },
  { brand: 'Maybelline', productLine: 'Colossal', name: 'Colossal Mascara', category: 'mascara', shade: 'Black', sku: 'MAY-MAS-001', finishType: 'volumizing', skinToneCompatibility: 'all', price: 29900, description: '9x volume instantly' },
  { brand: "L'Oreal Paris", productLine: 'Volume Million Lashes', name: 'Volume Million Lashes Mascara', category: 'mascara', shade: 'Black', sku: 'LOR-MAS-001', finishType: 'volumizing', skinToneCompatibility: 'all', price: 85000, description: 'Million lashes effect' },
  { brand: 'MAC', productLine: 'In Extreme Dimension', name: 'In Extreme Dimension Mascara', category: 'mascara', shade: 'Black', sku: 'MAC-MAS-001', finishType: 'lengthening', skinToneCompatibility: 'all', price: 210000, description: 'Dramatic length and curl' },
  
  // EYEBROW PRODUCTS
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Brow Definer', category: 'eyebrow_pencil', shade: 'Brown', sku: 'LAK-BRW-001', finishType: 'pencil', skinToneCompatibility: 'all', price: 45000, description: 'Defines and fills brows' },
  { brand: 'Maybelline', productLine: 'Fashion Brow', name: 'Fashion Brow Duo Shaper', category: 'eyebrow_pencil', shade: 'Brown', sku: 'MAY-BRW-001', finishType: 'pencil', skinToneCompatibility: 'all', price: 24900, description: 'Dual-ended brow shaper' },
  { brand: 'NYX', productLine: 'Micro Brow', name: 'Micro Brow Pencil', category: 'eyebrow_pencil', shade: 'Ash Brown', sku: 'NYX-BRW-001', finishType: 'pencil', skinToneCompatibility: 'all', price: 75000, description: 'Ultra-fine brow pencil' },
  
  // PRIMERS
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Blur Perfect Primer', category: 'primer', shade: 'Transparent', sku: 'LAK-PRI-001', finishType: 'mattifying', skinToneCompatibility: 'all', price: 75000, description: 'Blurs pores and fine lines' },
  { brand: 'Maybelline', productLine: 'Baby Skin', name: 'Baby Skin Pore Eraser', category: 'primer', shade: 'Transparent', sku: 'MAY-PRI-001', finishType: 'pore-minimizing', skinToneCompatibility: 'all', price: 39900, description: 'Instantly erases pores' },
  { brand: 'NYX', productLine: 'Studio', name: 'Studio Perfect Primer', category: 'primer', shade: 'Clear', sku: 'NYX-PRI-001', finishType: 'hydrating', skinToneCompatibility: 'all', price: 90000, description: 'Clear hydrating primer' },
  
  // SETTING SPRAY
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Mattreal Skin Setting Spray', category: 'setting_spray', shade: 'Clear', sku: 'LAK-SET-001', finishType: 'matte', skinToneCompatibility: 'all', price: 67500, description: 'Long-lasting matte finish' },
  { brand: 'NYX', productLine: 'Setting Spray', name: 'Matte Finish Setting Spray', category: 'setting_spray', shade: 'Clear', sku: 'NYX-SET-001', finishType: 'matte', skinToneCompatibility: 'all', price: 75000, description: 'Locks makeup in place' },
  { brand: 'NYX', productLine: 'Setting Spray', name: 'Dewy Finish Setting Spray', category: 'setting_spray', shade: 'Clear', sku: 'NYX-SET-002', finishType: 'dewy', skinToneCompatibility: 'all', price: 75000, description: 'Fresh dewy glow' },
  
  // POWDER
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute White Intense Compact', category: 'powder', shade: 'Fair', sku: 'LAK-POW-001', finishType: 'pressed', skinToneCompatibility: 'fair,light', price: 59900, description: 'Brightening compact powder' },
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute White Intense Compact', category: 'powder', shade: 'Natural', sku: 'LAK-POW-002', finishType: 'pressed', skinToneCompatibility: 'medium,tan', price: 59900, description: 'Brightening compact powder' },
  { brand: 'Maybelline', productLine: 'Fit Me', name: 'Fit Me Compact Powder', category: 'powder', shade: 'Translucent', sku: 'MAY-POW-001', finishType: 'translucent', skinToneCompatibility: 'all', price: 39900, description: 'Lightweight pressed powder' },
  { brand: 'MAC', productLine: 'Studio Fix', name: 'Studio Fix Powder Plus Foundation', category: 'powder', shade: 'NC20', sku: 'MAC-POW-001', finishType: 'pressed', skinToneCompatibility: 'light,medium', price: 285000, description: '2-in-1 powder foundation' },
  
  // LIP LINER & GLOSS
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Lip Definer', category: 'lip_liner', shade: 'Nude', sku: 'LAK-LLN-001', finishType: 'matte', skinToneCompatibility: 'all', price: 35000, description: 'Precise lip definition' },
  { brand: 'NYX', productLine: 'Slim', name: 'Slim Lip Pencil', category: 'lip_liner', shade: 'Natural', sku: 'NYX-LLN-001', finishType: 'matte', skinToneCompatibility: 'all', price: 45000, description: 'Slim retractable liner' },
  { brand: 'Lakme', productLine: 'Absolute', name: 'Absolute Plump & Shine Lip Gloss', category: 'lip_gloss', shade: 'Clear', sku: 'LAK-GLO-001', finishType: 'glossy', skinToneCompatibility: 'all', price: 59900, description: 'Plumping lip gloss' },
  { brand: 'NYX', productLine: 'Butter Gloss', name: 'Butter Gloss', category: 'lip_gloss', shade: 'Creme Brulee', sku: 'NYX-GLO-001', finishType: 'glossy', skinToneCompatibility: 'all', price: 60000, description: 'Buttery soft lip gloss' },
];

const presets = [
  { name: 'Natural Glow', category: 'makeup_natural', lookTags: 'natural,everyday,fresh,dewy', associatedProducts: 'foundation,concealer,blush,mascara,lipstick' },
  { name: 'Glamorous Evening', category: 'makeup_glamorous', lookTags: 'glamorous,evening,party,shimmer', associatedProducts: 'foundation,concealer,eyeshadow,eyeliner,mascara,lipstick,highlighter' },
  { name: 'Bridal Elegance', category: 'makeup_bridal', lookTags: 'bridal,wedding,elegant,radiant', associatedProducts: 'foundation,concealer,powder,blush,bronzer,eyeshadow,eyeliner,mascara,lipstick,setting_spray' },
  { name: 'Party Glam', category: 'makeup_party', lookTags: 'party,bold,vibrant,glitter', associatedProducts: 'foundation,eyeshadow,eyeliner,mascara,lipstick,highlighter' },
  { name: 'Smokey Eye', category: 'makeup_smokey', lookTags: 'smokey,dramatic,evening,bold', associatedProducts: 'eyeshadow,eyeliner,mascara,eyebrow_pencil' },
  { name: 'Warm Brown Hair', category: 'hair_brown', lookTags: 'hair,brown,warm,natural', associatedProducts: '' },
  { name: 'Golden Blonde', category: 'hair_blonde', lookTags: 'hair,blonde,golden,bright', associatedProducts: '' },
  { name: 'Auburn Red', category: 'hair_red', lookTags: 'hair,red,auburn,vibrant', associatedProducts: '' },
  { name: 'Deep Black Hair', category: 'hair_black', lookTags: 'hair,black,deep,classic', associatedProducts: '' },
  { name: 'Balayage Highlights', category: 'hair_highlights', lookTags: 'hair,highlights,balayage,dimensional', associatedProducts: '' },
  { name: 'Ombre Style', category: 'hair_ombre', lookTags: 'hair,ombre,gradient,trendy', associatedProducts: '' },
  { name: 'Full Beard', category: 'beard_full', lookTags: 'beard,full,masculine,groomed', associatedProducts: '' },
  { name: 'Designer Stubble', category: 'beard_stubble', lookTags: 'beard,stubble,casual,rugged', associatedProducts: '' },
  { name: 'Classic Goatee', category: 'beard_goatee', lookTags: 'beard,goatee,classic,stylish', associatedProducts: '' },
];

export async function seedBeautyProducts() {
  console.log('Seeding beauty products...');
  
  try {
    for (const product of products) {
      await db.insert(beautyProducts).values(product).onConflictDoNothing();
    }
    console.log(`Seeded ${products.length} beauty products`);
    
    for (const preset of presets) {
      await db.insert(effectPresets).values(preset).onConflictDoNothing();
    }
    console.log(`Seeded ${presets.length} effect presets`);
    
    console.log('Beauty products seeding complete!');
  } catch (error) {
    console.error('Error seeding beauty products:', error);
    throw error;
  }
}

if (require.main === module) {
  seedBeautyProducts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

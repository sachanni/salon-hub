import { pool } from './db';

const INDIAN_BEAUTY_PRODUCTS = [
  {
    brand: 'Lakme',
    product_line: '9 to 5',
    name: '9 to 5 Primer + Matte Lipstick',
    category: 'lipstick',
    shade: 'Rosy Sunday',
    sku: 'LAKME-9T5-RS01',
    finish_type: 'matte',
    skin_tone_compatibility: 'all',
    price: 45000,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/7/5/75e1ec8LAKME00000020_1.jpg',
    description: 'Long-lasting matte lipstick with primer for all-day wear'
  },
  {
    brand: 'Lakme',
    product_line: '9 to 5',
    name: '9 to 5 Primer + Matte Lipstick',
    category: 'lipstick',
    shade: 'Crimson Silk',
    sku: 'LAKME-9T5-CS01',
    finish_type: 'matte',
    skin_tone_compatibility: 'all',
    price: 45000,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/7/5/75e1ec8LAKME00000003_1.jpg',
    description: 'Vibrant crimson red matte lipstick'
  },
  {
    brand: 'Lakme',
    product_line: 'Absolute',
    name: 'Absolute Argan Oil Lip Color',
    category: 'lipstick',
    shade: 'Crimson Touch',
    sku: 'LAKME-ABS-CT01',
    finish_type: 'cream',
    skin_tone_compatibility: 'all',
    price: 55000,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/7/5/75e1ec8LAKME00000134_1.jpg',
    description: 'Argan oil enriched lipstick for smooth, moisturized lips'
  },
  {
    brand: 'Lakme',
    product_line: 'Absolute',
    name: 'Absolute Gel Addict Liner',
    category: 'eyeliner',
    shade: 'Black',
    sku: 'LAKME-GEL-BLK',
    finish_type: 'matte',
    skin_tone_compatibility: 'all',
    price: 55000,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/l/a/lakme-absolute-gel-addict-liner_1.jpg',
    description: 'Intense black gel eyeliner with long-lasting formula'
  },
  {
    brand: 'Lakme',
    product_line: 'Eyeconic',
    name: 'Eyeconic Kajal',
    category: 'eyeliner',
    shade: 'Deep Black',
    sku: 'LAKME-EYE-BLK01',
    finish_type: 'matte',
    skin_tone_compatibility: 'all',
    price: 22500,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/l/a/lakme_eyeconic_kajal_black_1.jpg',
    description: 'Smudge-proof kajal with deep black color'
  },
  {
    brand: 'Lakme',
    product_line: 'Absolute',
    name: 'Absolute Blur Perfect Makeup Primer',
    category: 'primer',
    shade: null,
    sku: 'LAKME-PRI-BLR',
    finish_type: 'matte',
    skin_tone_compatibility: 'all',
    price: 75000,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/l/a/lakme-absolute-blur-perfect-makeup-primer_1.jpg',
    description: 'Pore-minimizing makeup primer for flawless base'
  },
  {
    brand: 'Lakme',
    product_line: '9 to 5',
    name: '9 to 5 Flawless Matte Complexion Compact',
    category: 'powder',
    shade: 'Almond',
    sku: 'LAKME-CPT-ALM',
    finish_type: 'matte',
    skin_tone_compatibility: 'medium',
    price: 37500,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/l/a/lakme-9-to-5-flawless-matte-complexion-compact-almond_1.jpg',
    description: 'Long-lasting matte finish compact powder'
  },
  
  {
    brand: 'Sugar',
    product_line: 'Smudge Me Not',
    name: 'Smudge Me Not Liquid Lipstick',
    category: 'lipstick',
    shade: 'Brazen Raisin',
    sku: 'SUGAR-SMN-BR01',
    finish_type: 'matte',
    skin_tone_compatibility: 'all',
    price: 40000,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/s/u/sugar-smudge-me-not-liquid-lipstick-brazen-raisin_1.jpg',
    description: 'Transfer-proof liquid matte lipstick'
  },
  {
    brand: 'Sugar',
    product_line: 'Smudge Me Not',
    name: 'Smudge Me Not Liquid Lipstick',
    category: 'lipstick',
    shade: 'Maroon Frenzy',
    sku: 'SUGAR-SMN-MF01',
    finish_type: 'matte',
    skin_tone_compatibility: 'all',
    price: 40000,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/s/u/sugar-smudge-me-not-liquid-lipstick-maroon-frenzy_1.jpg',
    description: 'Bold maroon liquid lipstick with long-lasting formula'
  },
  {
    brand: 'Sugar',
    product_line: 'Contour De Force',
    name: 'Contour De Force Mini Blush',
    category: 'blush',
    shade: 'Peach Peak',
    sku: 'SUGAR-CDF-PP01',
    finish_type: 'matte',
    skin_tone_compatibility: 'light-medium',
    price: 55000,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/s/u/sugar-contour-de-force-mini-blush-peach-peak_1.jpg',
    description: 'Peachy matte blush for natural flush'
  },
  {
    brand: 'Sugar',
    product_line: 'Stroke of Genius',
    name: 'Stroke of Genius Heavy Duty Kohl',
    category: 'eyeliner',
    shade: 'Intense Black',
    sku: 'SUGAR-SOG-BLK01',
    finish_type: 'matte',
    skin_tone_compatibility: 'all',
    price: 30000,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/s/u/sugar-stroke-of-genius-heavy-duty-kohl_1.jpg',
    description: 'Long-lasting waterproof kohl pencil'
  },
  {
    brand: 'Sugar',
    product_line: 'Uptown Curl',
    name: 'Uptown Curl Lengthening Mascara',
    category: 'mascara',
    shade: 'Black',
    sku: 'SUGAR-UC-BLK01',
    finish_type: null,
    skin_tone_compatibility: 'all',
    price: 50000,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/s/u/sugar-uptown-curl-lengthening-mascara_1.jpg',
    description: 'Volumizing and lengthening mascara'
  },
  {
    brand: 'Sugar',
    product_line: 'Uptown Girl',
    name: 'Uptown Girl Highlighter',
    category: 'highlighter',
    shade: 'Bronze Glimmer',
    sku: 'SUGAR-UG-BG01',
    finish_type: 'shimmer',
    skin_tone_compatibility: 'medium-deep',
    price: 60000,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/s/u/sugar-uptown-girl-highlighter-bronze_1.jpg',
    description: 'Shimmery bronze highlighter for glowing skin'
  },
  
  {
    brand: 'Faces Canada',
    product_line: 'Ultime Pro',
    name: 'Ultime Pro Matte Lip Crayon',
    category: 'lipstick',
    shade: 'Wine Not',
    sku: 'FACES-UPM-WN01',
    finish_type: 'matte',
    skin_tone_compatibility: 'all',
    price: 42500,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/f/a/faces-ultime-pro-matte-lip-crayon-wine-not_1.jpg',
    description: 'Highly pigmented matte lip crayon'
  },
  {
    brand: 'Faces Canada',
    product_line: 'Ultime Pro',
    name: 'Ultime Pro HD Intense Matte Lips + Primer',
    category: 'lipstick',
    shade: 'Berry Burst',
    sku: 'FACES-UHD-BB01',
    finish_type: 'matte',
    skin_tone_compatibility: 'all',
    price: 59900,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/f/a/faces-ultime-pro-hd-intense-matte-lips-berry-burst_1.jpg',
    description: 'HD matte lipstick with built-in primer'
  },
  {
    brand: 'Faces Canada',
    product_line: 'Magneteyes',
    name: 'Magneteyes Kajal',
    category: 'eyeliner',
    shade: 'Black',
    sku: 'FACES-MAG-BLK01',
    finish_type: 'matte',
    skin_tone_compatibility: 'all',
    price: 25000,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/f/a/faces-magneteyes-kajal-black_1.jpg',
    description: 'Intense black kajal with magnetic precision'
  },
  {
    brand: 'Faces Canada',
    product_line: 'Ultime Pro',
    name: 'Ultime Pro HD Flawless Finish Foundation',
    category: 'foundation',
    shade: 'Natural',
    sku: 'FACES-FDN-NAT',
    finish_type: 'natural',
    skin_tone_compatibility: 'medium',
    price: 84900,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/f/a/faces-ultime-pro-hd-flawless-finish-foundation-natural_1.jpg',
    description: 'HD coverage foundation with flawless finish'
  },
  {
    brand: 'Faces Canada',
    product_line: 'Ultime Pro',
    name: 'Ultime Pro HD Flawless Finish Foundation',
    category: 'foundation',
    shade: 'Ivory',
    sku: 'FACES-FDN-IVR',
    finish_type: 'natural',
    skin_tone_compatibility: 'fair',
    price: 84900,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/f/a/faces-ultime-pro-hd-flawless-finish-foundation-ivory_1.jpg',
    description: 'HD coverage foundation for fair skin'
  },
  {
    brand: 'Faces Canada',
    product_line: 'Cheek Illusion',
    name: 'Cheek Illusion Blush',
    category: 'blush',
    shade: 'Pink Romance',
    sku: 'FACES-CHK-PR01',
    finish_type: 'shimmer',
    skin_tone_compatibility: 'fair-medium',
    price: 55000,
    image_url: 'https://images-static.nykaa.com/media/catalog/product/tr:h-800,w-800,cm-pad_resize/f/a/faces-cheek-illusion-blush-pink-romance_1.jpg',
    description: 'Shimmery pink blush for radiant cheeks'
  }
];

async function importIndianBrands() {
  console.log('🇮🇳 Starting Indian beauty brands import...\n');
  
  let imported = 0;
  let skipped = 0;
  
  for (const product of INDIAN_BEAUTY_PRODUCTS) {
    try {
      const insertQuery = `
        INSERT INTO beauty_products (
          brand, product_line, name, category, shade, sku, 
          finish_type, skin_tone_compatibility, price, image_url, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (sku) DO NOTHING
      `;
      
      await pool.query(insertQuery, [
        product.brand,
        product.product_line,
        product.name,
        product.category,
        product.shade,
        product.sku,
        product.finish_type,
        product.skin_tone_compatibility,
        product.price,
        product.image_url,
        product.description
      ]);
      
      console.log(`  ✓ ${product.brand} - ${product.name} (${product.shade || 'N/A'})`);
      imported++;
    } catch (error: any) {
      if (!error.message.includes('duplicate key')) {
        console.error(`  ❌ Error importing ${product.name}:`, error.message);
      }
      skipped++;
    }
  }
  
  const countResult = await pool.query('SELECT COUNT(*) as total FROM beauty_products');
  const totalProducts = countResult.rows[0].total;
  
  console.log('\n📊 Import Summary:');
  console.log(`  • Indian products imported: ${imported}`);
  console.log(`  • Skipped/duplicates: ${skipped}`);
  console.log(`  • Total in database: ${totalProducts}`);
  console.log('\n✅ Indian brands import complete!');
}

importIndianBrands()
  .catch(error => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
    process.exit(0);
  });

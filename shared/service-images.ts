// Service image library - maps service types to professional stock images
// Uses Unsplash for high-quality, free-to-use images

export const SERVICE_IMAGES: Record<string, string> = {
  // Hair & Styling Services
  'haircut': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500',
  'haircut & styling': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500',
  'hair color': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500',
  'hair coloring': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500',
  'hair treatment': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500',
  'hair treatment & spa': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500',
  'balayage': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=500',
  'balayage & highlights': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=500',
  'keratin': 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=500',
  'keratin treatment': 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=500',
  'hair extensions': 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=500',
  'hair patch': 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=500',
  'hair weaving': 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=500',
  'hair bonding': 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=500',

  // Nails Services
  'manicure': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500',
  'pedicure': 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=500',
  'nail art': 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=500',
  'nail art & design': 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=500',
  'gel nails': 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500',
  'acrylic nails': 'https://images.unsplash.com/photo-1604654894564-80ed46c4f939?w=500',
  'nail extensions': 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=500',

  // Skincare & Facials
  'facial': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500',
  'classic facial': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500',
  'anti-aging': 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=500',
  'anti-aging treatment': 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=500',
  'acne treatment': 'https://images.unsplash.com/photo-1531299204812-e6d44d9a185c?w=500',
  'hydrafacial': 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=500',
  'cleanup': 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=500',
  'cleanup & bleach': 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=500',
  'chemical peel': 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=500',

  // Massage & Spa
  'massage': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500',
  'body massage': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500',
  'full body massage': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500',
  'aromatherapy': 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=500',
  'deep tissue': 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=500',
  'deep tissue massage': 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=500',
  'thai massage': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500',
  'hot stone': 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=500',
  'hot stone massage': 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=500',
  'spa package': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500',
  'spa packages': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500',

  // Eyebrows & Lashes
  'eyebrow': 'https://images.unsplash.com/photo-1634926878768-2a5b3c42f139?w=500',
  'eyebrow shaping': 'https://images.unsplash.com/photo-1634926878768-2a5b3c42f139?w=500',
  'threading': 'https://images.unsplash.com/photo-1542103749-8ef59b94f47e?w=500',
  'eyelash': 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=500',
  'eyelash extensions': 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=500',
  'lash lift': 'https://images.unsplash.com/photo-1612293040335-d5e5e7a8eb8e?w=500',
  'lash lift & tint': 'https://images.unsplash.com/photo-1612293040335-d5e5e7a8eb8e?w=500',
  'eyebrow tint': 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=500',
  'eyebrow tinting': 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=500',
  'microblading': 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=500',

  // Hair Removal
  'wax': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500',
  'waxing': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500',
  'laser hair removal': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
  'full body wax': 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=500',
  'full body waxing': 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=500',
  'bikini wax': 'https://images.unsplash.com/photo-1551122089-4e3e72477a97?w=500',
  'brazilian wax': 'https://images.unsplash.com/photo-1551122089-4e3e72477a97?w=500',

  // Piercing
  'piercing': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500',
  'ear piercing': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500',
  'nose piercing': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
  'belly piercing': 'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=500',
  'lip piercing': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500',
  'eyebrow piercing': 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=500',
  'cartilage piercing': 'https://images.unsplash.com/photo-1530893776091-5003274b645c?w=500',

  // Tattoo
  'tattoo': 'https://images.unsplash.com/photo-1565058379802-bbe93b2f703f?w=500',
  'small tattoo': 'https://images.unsplash.com/photo-1565058379802-bbe93b2f703f?w=500',
  'medium tattoo': 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=500',
  'large tattoo': 'https://images.unsplash.com/photo-1590246814883-57c511a8a1c4?w=500',
  'coverup tattoo': 'https://images.unsplash.com/photo-1590817421957-09d9c652a604?w=500',
  'cover-up tattoo': 'https://images.unsplash.com/photo-1590817421957-09d9c652a604?w=500',
  'tattoo removal': 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=500',
  'permanent makeup': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=500',
  'permanent makeup tattoo': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=500',
  'henna': 'https://images.unsplash.com/photo-1610195342108-891e89d0c33c?w=500',
  'henna tattoo': 'https://images.unsplash.com/photo-1610195342108-891e89d0c33c?w=500',
  'mehndi': 'https://images.unsplash.com/photo-1610195342108-891e89d0c33c?w=500',

  // Makeup
  'makeup': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=500',
  'makup': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=500',
  'bridal makeup': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500',
  'party makeup': 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=500',
  'hd makeup': 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500',
  'airbrush makeup': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=500',
  'natural makeup': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500',
  'daily makup': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500',

  // Body Treatments
  'body scrub': 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=500',
  'body scrub & polishing': 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=500',
  'body wrap': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500',
  'tan removal': 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=500',
  'body polish': 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=500',
  'body polishing': 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=500',

  // Men's Grooming
  'mens haircut': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500',
  "men's haircut": 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500',
  'beard': 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500',
  'beard trim': 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500',
  'beard trim & styling': 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500',
  'mens facial': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500',
  "men's facial": 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500',
  'mens grooming': 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=500',
  "men's grooming package": 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=500',

  // Wellness & Other
  'reflexology': 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=500',
  'wellness therapy': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500',
  'consultation': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500',
  'beauty consultation': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500',

  // Additional services (fallbacks)
  'color treatment': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500',
  'extra massage': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500',
  'hair cut': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500',
  'hair color man': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500',
  'hair color wemen': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500',
  'hair color women': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500',
  'swedish massage': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500',
};

// Helper function to get image for a service
export function getServiceImage(serviceName: string): string | null {
  if (!serviceName) return null;
  
  // Normalize service name for matching
  const normalized = serviceName.toLowerCase().trim();
  
  // Direct match
  if (SERVICE_IMAGES[normalized]) {
    return SERVICE_IMAGES[normalized];
  }
  
  // Fuzzy match - find if service name contains any key
  for (const [key, image] of Object.entries(SERVICE_IMAGES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return image;
    }
  }
  
  // Return null if no match found
  return null;
}

// Get default image by category
export function getDefaultImageByCategory(category: string): string {
  const categoryLower = category?.toLowerCase() || '';
  
  const categoryDefaults: Record<string, string> = {
    'hair': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500',
    'nails': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500',
    'facial': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500',
    'skincare': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500',
    'massage': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500',
    'spa': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500',
    'makeup': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=500',
    'piercing': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500',
    'tattoo': 'https://images.unsplash.com/photo-1565058379802-bbe93b2f703f?w=500',
    'wax': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500',
    'eyebrow': 'https://images.unsplash.com/photo-1634926878768-2a5b3c42f139?w=500',
    'lash': 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=500',
  };
  
  for (const [key, image] of Object.entries(categoryDefaults)) {
    if (categoryLower.includes(key)) {
      return image;
    }
  }
  
  // Ultimate fallback - generic beauty salon image
  return 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=500';
}

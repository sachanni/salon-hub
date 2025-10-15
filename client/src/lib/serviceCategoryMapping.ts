// Intelligent mapping between business categories and service categories
// This creates a smart connection so the platform shows relevant services

export const BUSINESS_TO_SERVICE_MAPPING: Record<string, string[]> = {
  'hair_salon': ['hair', 'eyes', 'hair-removal', 'piercing'],
  'nail_salon': ['nails', 'piercing'],
  'spa': ['massage', 'skincare', 'body', 'wellness'],
  'beauty_salon': ['hair', 'nails', 'skincare', 'eyes', 'hair-removal', 'makeup', 'piercing', 'tattoo'],
  'barber': ['hair', 'mens', 'tattoo'],
  'massage': ['massage', 'wellness', 'body'],
  'medical_spa': ['skincare', 'body', 'wellness', 'hair-removal', 'tattoo'],
  'fitness': ['wellness', 'massage'],
  'makeup_studio': ['makeup', 'eyes', 'hair', 'tattoo'],
  'tattoo_studio': ['tattoo', 'piercing']
};

// Get relevant service categories based on business categories
export function getRelevantServiceCategories(businessCategories: string[]): string[] {
  const relevantCategories = new Set<string>();
  
  businessCategories.forEach(businessCat => {
    const serviceCats = BUSINESS_TO_SERVICE_MAPPING[businessCat] || [];
    serviceCats.forEach(cat => relevantCategories.add(cat));
  });
  
  // If no mapping found, show all categories
  if (relevantCategories.size === 0) {
    return ['hair', 'nails', 'skincare', 'massage', 'eyes', 'hair-removal', 'piercing', 'tattoo', 'makeup', 'body', 'mens', 'wellness'];
  }
  
  return Array.from(relevantCategories);
}

// Get smart service suggestions based on business category
export function getSmartServiceSuggestions(businessCategories: string[]): string[] {
  const suggestions: Record<string, string[]> = {
    'hair_salon': ['Haircut & Styling', 'Hair Coloring', 'Balayage & Highlights', 'Hair Patch', 'Threading', 'Ear Piercing'],
    'nail_salon': ['Manicure', 'Pedicure', 'Gel Nails', 'Nail Art & Design', 'Ear Piercing'],
    'spa': ['Full Body Massage', 'Aromatherapy', 'Classic Facial', 'Body Scrub & Polishing'],
    'beauty_salon': ['Haircut & Styling', 'Manicure', 'Cleanup & Bleach', 'Threading', 'Waxing', 'Ear Piercing', 'Henna/Mehndi Tattoo'],
    'barber': ["Men's Haircut", 'Beard Trim & Styling', "Men's Facial", "Men's Grooming Package", 'Small Tattoo'],
    'massage': ['Full Body Massage', 'Deep Tissue Massage', 'Thai Massage', 'Aromatherapy'],
    'medical_spa': ['HydraFacial', 'Chemical Peel', 'Laser Hair Removal', 'Anti-Aging Treatment', 'Tattoo Removal'],
    'fitness': ['Wellness Therapy', 'Reflexology', 'Full Body Massage'],
    'makeup_studio': ['Bridal Makeup', 'Party Makeup', 'HD Makeup', 'Eyelash Extensions', 'Permanent Makeup Tattoo'],
    'tattoo_studio': ['Small Tattoo', 'Medium Tattoo', 'Large Tattoo', 'Cover-up Tattoo', 'Ear Piercing', 'Nose Piercing']
  };
  
  const allSuggestions = new Set<string>();
  
  businessCategories.forEach(cat => {
    const catSuggestions = suggestions[cat] || [];
    catSuggestions.forEach(s => allSuggestions.add(s));
  });
  
  return Array.from(allSuggestions);
}

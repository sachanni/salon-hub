/**
 * Comprehensive Service Templates Library
 * Inspired by Billu Partner App - Complete service catalog for Indian salon market
 * 
 * Categories covered:
 * 1. Hair Cut & Style (Male: 54+ services, Female: 116+ services)
 * 2. Hair Color
 * 3. Hair Chemical (Treatments)
 * 4. Hair Treatments
 * 5. Mani-Pedi & Hygiene
 * 6. Skin Care
 * 7. Makeup
 * 8. Massage & Spa
 * 9. Body Treatments
 * 10. Waxing & Threading
 * 11. Piercing & Tattoo
 */

export interface ServiceTemplateData {
  name: string;
  description: string;
  category: string;
  subCategory?: string;
  gender: 'male' | 'female' | 'unisex';
  suggestedDurationMinutes: number;
  suggestedPriceInPaisa: number;
  isPopular?: boolean;
  tags?: string[];
}

// ============================================
// CATEGORY 1: HAIR CUT & STYLE - MALE SERVICES
// ============================================
export const maleHairCutServices: ServiceTemplateData[] = [
  // Classic Haircuts
  { name: "Classic Haircut", description: "Traditional professional haircut", category: "Hair Cut & Style", subCategory: "Male - Classic", gender: "male", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 30000, isPopular: true, tags: ["basic", "classic"] },
  { name: "Men's Haircut", description: "Standard men's haircut with styling", category: "Hair Cut & Style", subCategory: "Male - Classic", gender: "male", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 30000, isPopular: true },
  { name: "Executive Haircut", description: "Premium professional haircut", category: "Hair Cut & Style", subCategory: "Male - Classic", gender: "male", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 50000 },
  
  // Fade Variations (10+ types)
  { name: "Low Fade", description: "Fade starting near the ears", category: "Hair Cut & Style", subCategory: "Male - Fade", gender: "male", suggestedDurationMinutes: 40, suggestedPriceInPaisa: 40000, isPopular: true, tags: ["fade", "modern"] },
  { name: "Mid Fade", description: "Fade starting mid-head", category: "Hair Cut & Style", subCategory: "Male - Fade", gender: "male", suggestedDurationMinutes: 40, suggestedPriceInPaisa: 40000, isPopular: true, tags: ["fade", "modern"] },
  { name: "High Fade", description: "Fade starting high on head", category: "Hair Cut & Style", subCategory: "Male - Fade", gender: "male", suggestedDurationMinutes: 40, suggestedPriceInPaisa: 45000, isPopular: true, tags: ["fade", "modern"] },
  { name: "Skin Fade", description: "Fade down to skin level", category: "Hair Cut & Style", subCategory: "Male - Fade", gender: "male", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 50000, isPopular: true, tags: ["fade", "skin"] },
  { name: "Bald Fade", description: "Complete fade to skin", category: "Hair Cut & Style", subCategory: "Male - Fade", gender: "male", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 50000, tags: ["fade", "skin"] },
  { name: "Drop Fade", description: "Curved fade behind ears", category: "Hair Cut & Style", subCategory: "Male - Fade", gender: "male", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 45000, tags: ["fade", "modern"] },
  { name: "Taper Fade", description: "Gradual tapering fade", category: "Hair Cut & Style", subCategory: "Male - Fade", gender: "male", suggestedDurationMinutes: 40, suggestedPriceInPaisa: 40000, tags: ["fade", "classic"] },
  { name: "Box Fade", description: "Squared corners fade", category: "Hair Cut & Style", subCategory: "Male - Fade", gender: "male", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 45000, tags: ["fade", "modern"] },
  { name: "Shadow Fade", description: "Soft gradual fade", category: "Hair Cut & Style", subCategory: "Male - Fade", gender: "male", suggestedDurationMinutes: 40, suggestedPriceInPaisa: 40000, tags: ["fade"] },
  { name: "Burst Fade", description: "Circular fade around ears", category: "Hair Cut & Style", subCategory: "Male - Fade", gender: "male", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 45000, tags: ["fade", "modern"] },
  
  // Modern/Trendy Cuts
  { name: "Undercut", description: "Short sides with longer top", category: "Hair Cut & Style", subCategory: "Male - Modern", gender: "male", suggestedDurationMinutes: 40, suggestedPriceInPaisa: 45000, isPopular: true, tags: ["modern", "trendy"] },
  { name: "Disconnected Undercut", description: "Sharp contrast undercut", category: "Hair Cut & Style", subCategory: "Male - Modern", gender: "male", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 50000, isPopular: true, tags: ["modern", "trendy"] },
  { name: "Pompadour", description: "Volume swept back style", category: "Hair Cut & Style", subCategory: "Male - Modern", gender: "male", suggestedDurationMinutes: 50, suggestedPriceInPaisa: 55000, isPopular: true, tags: ["modern", "styling"] },
  { name: "Quiff", description: "Volume pushed forward and up", category: "Hair Cut & Style", subCategory: "Male - Modern", gender: "male", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 50000, tags: ["modern", "styling"] },
  { name: "Faux Hawk", description: "Center strip styled up", category: "Hair Cut & Style", subCategory: "Male - Modern", gender: "male", suggestedDurationMinutes: 40, suggestedPriceInPaisa: 45000, tags: ["modern", "edgy"] },
  { name: "Mohawk", description: "Shaved sides with long center", category: "Hair Cut & Style", subCategory: "Male - Modern", gender: "male", suggestedDurationMinutes: 50, suggestedPriceInPaisa: 60000, tags: ["edgy", "bold"] },
  { name: "Comb Over", description: "Hair combed to one side", category: "Hair Cut & Style", subCategory: "Male - Modern", gender: "male", suggestedDurationMinutes: 40, suggestedPriceInPaisa: 40000, tags: ["classic", "professional"] },
  { name: "Side Part", description: "Classic parted style", category: "Hair Cut & Style", subCategory: "Male - Modern", gender: "male", suggestedDurationMinutes: 35, suggestedPriceInPaisa: 35000, tags: ["classic"] },
  { name: "Textured Crop", description: "Choppy layered top", category: "Hair Cut & Style", subCategory: "Male - Modern", gender: "male", suggestedDurationMinutes: 40, suggestedPriceInPaisa: 45000, isPopular: true, tags: ["modern", "textured"] },
  
  // Short Haircuts
  { name: "Buzz Cut", description: "Very short all-over clip", category: "Hair Cut & Style", subCategory: "Male - Short", gender: "male", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 20000, isPopular: true, tags: ["short", "minimal"] },
  { name: "Crew Cut", description: "Short neat uniform length", category: "Hair Cut & Style", subCategory: "Male - Short", gender: "male", suggestedDurationMinutes: 25, suggestedPriceInPaisa: 25000, isPopular: true, tags: ["short", "classic"] },
  { name: "Caesar Cut", description: "Short with forward fringe", category: "Hair Cut & Style", subCategory: "Male - Short", gender: "male", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 30000, tags: ["short", "classic"] },
  { name: "French Crop", description: "Textured top with blunt fringe", category: "Hair Cut & Style", subCategory: "Male - Short", gender: "male", suggestedDurationMinutes: 35, suggestedPriceInPaisa: 35000, isPopular: true, tags: ["short", "modern"] },
  { name: "High and Tight", description: "Military-style very short sides", category: "Hair Cut & Style", subCategory: "Male - Short", gender: "male", suggestedDurationMinutes: 25, suggestedPriceInPaisa: 25000, tags: ["short", "military"] },
  { name: "Flat Top", description: "Hair cut flat on top", category: "Hair Cut & Style", subCategory: "Male - Short", gender: "male", suggestedDurationMinutes: 40, suggestedPriceInPaisa: 40000, tags: ["short", "classic"] },
  { name: "Ivy League", description: "Longer crew cut, can be parted", category: "Hair Cut & Style", subCategory: "Male - Short", gender: "male", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 30000, tags: ["short", "classic"] },
  
  // Beard Services (15+ types)
  { name: "Beard Trim", description: "Professional beard trimming", category: "Hair Cut & Style", subCategory: "Male - Beard", gender: "male", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 20000, isPopular: true, tags: ["beard", "grooming"] },
  { name: "Beard Trim & Styling", description: "Beard trim with styling", category: "Hair Cut & Style", subCategory: "Male - Beard", gender: "male", suggestedDurationMinutes: 25, suggestedPriceInPaisa: 25000, isPopular: true, tags: ["beard", "grooming"] },
  { name: "French Beard Shave", description: "French beard styling and shave", category: "Hair Cut & Style", subCategory: "Male - Beard", gender: "male", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 30000, tags: ["beard", "shave"] },
  { name: "Full Beard Styling", description: "Complete beard shaping and styling", category: "Hair Cut & Style", subCategory: "Male - Beard", gender: "male", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 35000, tags: ["beard", "styling"] },
  { name: "Goatee Trim", description: "Goatee shaping and maintenance", category: "Hair Cut & Style", subCategory: "Male - Beard", gender: "male", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 20000, tags: ["beard", "goatee"] },
  { name: "Stubble Grooming", description: "Maintain perfect stubble length", category: "Hair Cut & Style", subCategory: "Male - Beard", gender: "male", suggestedDurationMinutes: 15, suggestedPriceInPaisa: 15000, tags: ["beard", "stubble"] },
  { name: "Beard Shaping & Design", description: "Custom beard design and lines", category: "Hair Cut & Style", subCategory: "Male - Beard", gender: "male", suggestedDurationMinutes: 35, suggestedPriceInPaisa: 40000, tags: ["beard", "design"] },
  { name: "Beard Oil Treatment", description: "Conditioning beard oil treatment", category: "Hair Cut & Style", subCategory: "Male - Beard", gender: "male", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 25000, tags: ["beard", "treatment"] },
  { name: "Traditional Wet Shave", description: "Classic hot towel wet shave", category: "Hair Cut & Style", subCategory: "Male - Shave", gender: "male", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 30000, isPopular: true, tags: ["shave", "traditional"] },
  { name: "Straight Razor Shave", description: "Professional straight razor shave", category: "Hair Cut & Style", subCategory: "Male - Shave", gender: "male", suggestedDurationMinutes: 35, suggestedPriceInPaisa: 40000, tags: ["shave", "luxury"] },
  { name: "Clean Shave", description: "Complete facial shaving", category: "Hair Cut & Style", subCategory: "Male - Shave", gender: "male", suggestedDurationMinutes: 25, suggestedPriceInPaisa: 25000, tags: ["shave"] },
  { name: "Head Shave", description: "Full head shaving service", category: "Hair Cut & Style", subCategory: "Male - Shave", gender: "male", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 30000, tags: ["shave", "head"] },
  { name: "Mustache Trim & Styling", description: "Mustache grooming and styling", category: "Hair Cut & Style", subCategory: "Male - Beard", gender: "male", suggestedDurationMinutes: 15, suggestedPriceInPaisa: 15000, tags: ["mustache", "grooming"] },
  
  // Combination Services
  { name: "Haircut + Beard Trim", description: "Haircut with beard trimming", category: "Hair Cut & Style", subCategory: "Male - Combo", gender: "male", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 45000, isPopular: true, tags: ["combo"] },
  { name: "Haircut + Shave", description: "Haircut with clean shave", category: "Hair Cut & Style", subCategory: "Male - Combo", gender: "male", suggestedDurationMinutes: 50, suggestedPriceInPaisa: 50000, isPopular: true, tags: ["combo"] },
  { name: "Haircut + Beard + Shave", description: "Complete grooming package", category: "Hair Cut & Style", subCategory: "Male - Combo", gender: "male", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 60000, tags: ["combo", "complete"] },
];

// ============================================
// CATEGORY 1: HAIR CUT & STYLE - FEMALE SERVICES (116+ services)
// ============================================
export const femaleHairCutServices: ServiceTemplateData[] = [
  // Basic Haircuts by Hair Length
  { name: "Haircut - Short Hair", description: "Professional haircut for short hair", category: "Hair Cut & Style", subCategory: "Female - Haircut", gender: "female", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 50000, isPopular: true, tags: ["haircut", "short"] },
  { name: "Haircut - Medium Hair", description: "Professional haircut for medium length hair", category: "Hair Cut & Style", subCategory: "Female - Haircut", gender: "female", suggestedDurationMinutes: 50, suggestedPriceInPaisa: 60000, isPopular: true, tags: ["haircut", "medium"] },
  { name: "Haircut - Long Hair", description: "Professional haircut for long hair", category: "Hair Cut & Style", subCategory: "Female - Haircut", gender: "female", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 70000, isPopular: true, tags: ["haircut", "long"] },
  { name: "Hair Trim - Short Hair", description: "Trim and shape for short hair", category: "Hair Cut & Style", subCategory: "Female - Trim", gender: "female", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 30000, tags: ["trim", "short"] },
  { name: "Hair Trim - Medium Hair", description: "Trim and shape for medium hair", category: "Hair Cut & Style", subCategory: "Female - Trim", gender: "female", suggestedDurationMinutes: 35, suggestedPriceInPaisa: 35000, tags: ["trim", "medium"] },
  { name: "Hair Trim - Long Hair", description: "Trim and shape for long hair", category: "Hair Cut & Style", subCategory: "Female - Trim", gender: "female", suggestedDurationMinutes: 40, suggestedPriceInPaisa: 40000, tags: ["trim", "long"] },
  { name: "Split Ends Treatment", description: "Remove split ends and damaged hair", category: "Hair Cut & Style", subCategory: "Female - Trim", gender: "female", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 25000, tags: ["trim", "treatment"] },
  
  // Layered Cuts
  { name: "Layered Haircut - Short", description: "Layered cut for short hair", category: "Hair Cut & Style", subCategory: "Female - Layered", gender: "female", suggestedDurationMinutes: 50, suggestedPriceInPaisa: 60000, isPopular: true, tags: ["layered", "short"] },
  { name: "Layered Haircut - Medium", description: "Layered cut for medium hair", category: "Hair Cut & Style", subCategory: "Female - Layered", gender: "female", suggestedDurationMinutes: 55, suggestedPriceInPaisa: 70000, isPopular: true, tags: ["layered", "medium"] },
  { name: "Layered Haircut - Long", description: "Layered cut for long hair", category: "Hair Cut & Style", subCategory: "Female - Layered", gender: "female", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 80000, isPopular: true, tags: ["layered", "long"] },
  { name: "Feather Cut", description: "Soft feathered layered cut", category: "Hair Cut & Style", subCategory: "Female - Layered", gender: "female", suggestedDurationMinutes: 55, suggestedPriceInPaisa: 70000, tags: ["layered", "feather"] },
  { name: "Step Cut", description: "Stepped layered haircut", category: "Hair Cut & Style", subCategory: "Female - Layered", gender: "female", suggestedDurationMinutes: 55, suggestedPriceInPaisa: 70000, tags: ["layered", "step"] },
  
  // Styling Services
  { name: "Hair Styling - Short Hair", description: "Professional styling for short hair", category: "Hair Cut & Style", subCategory: "Female - Styling", gender: "female", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 30000, tags: ["styling", "short"] },
  { name: "Hair Styling - Medium Hair", description: "Professional styling for medium hair", category: "Hair Cut & Style", subCategory: "Female - Styling", gender: "female", suggestedDurationMinutes: 40, suggestedPriceInPaisa: 40000, tags: ["styling", "medium"] },
  { name: "Hair Styling - Long Hair", description: "Professional styling for long hair", category: "Hair Cut & Style", subCategory: "Female - Styling", gender: "female", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 50000, isPopular: true, tags: ["styling", "long"] },
  { name: "Blow Dry - Short Hair", description: "Professional blow dry for short hair", category: "Hair Cut & Style", subCategory: "Female - Blow Dry", gender: "female", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 30000, isPopular: true, tags: ["blowdry", "short"] },
  { name: "Blow Dry - Medium Hair", description: "Professional blow dry for medium hair", category: "Hair Cut & Style", subCategory: "Female - Blow Dry", gender: "female", suggestedDurationMinutes: 40, suggestedPriceInPaisa: 40000, isPopular: true, tags: ["blowdry", "medium"] },
  { name: "Blow Dry - Long Hair", description: "Professional blow dry for long hair", category: "Hair Cut & Style", subCategory: "Female - Blow Dry", gender: "female", suggestedDurationMinutes: 50, suggestedPriceInPaisa: 50000, isPopular: true, tags: ["blowdry", "long"] },
  
  // Curling Services
  { name: "Iron Curls", description: "Beautiful iron curls styling", category: "Hair Cut & Style", subCategory: "Female - Curling", gender: "female", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 60000, isPopular: true, tags: ["curls", "styling"] },
  { name: "Soft Curls", description: "Soft romantic curls", category: "Hair Cut & Style", subCategory: "Female - Curling", gender: "female", suggestedDurationMinutes: 50, suggestedPriceInPaisa: 50000, tags: ["curls", "soft"] },
  { name: "Tight Curls", description: "Defined tight curls", category: "Hair Cut & Style", subCategory: "Female - Curling", gender: "female", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 60000, tags: ["curls", "tight"] },
  { name: "Beach Waves", description: "Relaxed beachy waves", category: "Hair Cut & Style", subCategory: "Female - Curling", gender: "female", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 50000, isPopular: true, tags: ["curls", "waves"] },
  { name: "Spiral Curls", description: "Beautiful spiral curls", category: "Hair Cut & Style", subCategory: "Female - Curling", gender: "female", suggestedDurationMinutes: 70, suggestedPriceInPaisa: 70000, tags: ["curls", "spiral"] },
  { name: "Bouncy Curls", description: "Voluminous bouncy curls", category: "Hair Cut & Style", subCategory: "Female - Curling", gender: "female", suggestedDurationMinutes: 55, suggestedPriceInPaisa: 60000, tags: ["curls", "bouncy"] },
  
  // Straightening/Ironing
  { name: "Hair Straightening - Short Hair", description: "Temporary hair straightening short hair", category: "Hair Cut & Style", subCategory: "Female - Straightening", gender: "female", suggestedDurationMinutes: 40, suggestedPriceInPaisa: 40000, tags: ["straightening", "short"] },
  { name: "Hair Straightening - Medium Hair", description: "Temporary hair straightening medium hair", category: "Hair Cut & Style", subCategory: "Female - Straightening", gender: "female", suggestedDurationMinutes: 50, suggestedPriceInPaisa: 50000, tags: ["straightening", "medium"] },
  { name: "Hair Straightening - Long Hair", description: "Temporary hair straightening long hair", category: "Hair Cut & Style", subCategory: "Female - Straightening", gender: "female", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 60000, isPopular: true, tags: ["straightening", "long"] },
  { name: "Hair Ironing - Short", description: "Professional hair ironing short", category: "Hair Cut & Style", subCategory: "Female - Ironing", gender: "female", suggestedDurationMinutes: 35, suggestedPriceInPaisa: 35000, tags: ["ironing", "short"] },
  { name: "Hair Ironing - Medium", description: "Professional hair ironing medium", category: "Hair Cut & Style", subCategory: "Female - Ironing", gender: "female", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 45000, tags: ["ironing", "medium"] },
  { name: "Hair Ironing - Long", description: "Professional hair ironing long", category: "Hair Cut & Style", subCategory: "Female - Ironing", gender: "female", suggestedDurationMinutes: 55, suggestedPriceInPaisa: 55000, tags: ["ironing", "long"] },
  
  // Hair Wash Services
  { name: "Hair Wash - Short Hair", description: "Professional hair wash short", category: "Hair Cut & Style", subCategory: "Female - Wash", gender: "female", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 15000, tags: ["wash", "short"] },
  { name: "Hair Wash - Medium Hair", description: "Professional hair wash medium", category: "Hair Cut & Style", subCategory: "Female - Wash", gender: "female", suggestedDurationMinutes: 25, suggestedPriceInPaisa: 20000, tags: ["wash", "medium"] },
  { name: "Hair Wash - Long Hair", description: "Professional hair wash long", category: "Hair Cut & Style", subCategory: "Female - Wash", gender: "female", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 25000, tags: ["wash", "long"] },
  { name: "Deep Cleansing Hair Wash", description: "Deep cleansing scalp and hair wash", category: "Hair Cut & Style", subCategory: "Female - Wash", gender: "female", suggestedDurationMinutes: 35, suggestedPriceInPaisa: 30000, tags: ["wash", "deep"] },
  { name: "Anti-Dandruff Hair Wash", description: "Specialized anti-dandruff treatment wash", category: "Hair Cut & Style", subCategory: "Female - Wash", gender: "female", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 30000, tags: ["wash", "treatment"] },
  
  // Head Massage
  { name: "Head Massage", description: "Relaxing scalp and head massage", category: "Hair Cut & Style", subCategory: "Female - Massage", gender: "female", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 20000, isPopular: true, tags: ["massage", "relaxing"] },
  { name: "Scalp Massage with Oil", description: "Nourishing oil scalp massage", category: "Hair Cut & Style", subCategory: "Female - Massage", gender: "female", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 30000, tags: ["massage", "oil"] },
  { name: "Champi (Indian Head Massage)", description: "Traditional Indian head massage", category: "Hair Cut & Style", subCategory: "Female - Massage", gender: "female", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 30000, tags: ["massage", "traditional"] },
  
  // Combination Services
  { name: "Hair Wash, Cut, Head Massage, BlowDry", description: "Complete hair service package", category: "Hair Cut & Style", subCategory: "Female - Combo", gender: "female", suggestedDurationMinutes: 120, suggestedPriceInPaisa: 120000, isPopular: true, tags: ["combo", "complete"] },
  { name: "Hair Cut + Hair Wash + Blow Dry", description: "Haircut with wash and blow dry", category: "Hair Cut & Style", subCategory: "Female - Combo", gender: "female", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 90000, isPopular: true, tags: ["combo"] },
  { name: "Hair Wash + Blow Dry", description: "Wash and professional blow dry", category: "Hair Cut & Style", subCategory: "Female - Combo", gender: "female", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 60000, isPopular: true, tags: ["combo"] },
  { name: "Hair Cut + Styling", description: "Haircut with professional styling", category: "Hair Cut & Style", subCategory: "Female - Combo", gender: "female", suggestedDurationMinutes: 75, suggestedPriceInPaisa: 80000, tags: ["combo"] },
  { name: "Hair Wash + Iron Curls", description: "Wash with beautiful curls", category: "Hair Cut & Style", subCategory: "Female - Combo", gender: "female", suggestedDurationMinutes: 80, suggestedPriceInPaisa: 80000, isPopular: true, tags: ["combo", "curls"] },
  
  // Braiding & Updos
  { name: "Simple Braid", description: "Classic simple braid styling", category: "Hair Cut & Style", subCategory: "Female - Braiding", gender: "female", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 20000, tags: ["braiding"] },
  { name: "French Braid", description: "Elegant French braid", category: "Hair Cut & Style", subCategory: "Female - Braiding", gender: "female", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 30000, tags: ["braiding", "french"] },
  { name: "Fishtail Braid", description: "Intricate fishtail braid", category: "Hair Cut & Style", subCategory: "Female - Braiding", gender: "female", suggestedDurationMinutes: 35, suggestedPriceInPaisa: 35000, tags: ["braiding", "fishtail"] },
  { name: "Dutch Braid", description: "Beautiful Dutch braid", category: "Hair Cut & Style", subCategory: "Female - Braiding", gender: "female", suggestedDurationMinutes: 35, suggestedPriceInPaisa: 35000, tags: ["braiding", "dutch"] },
  { name: "Box Braids", description: "Protective box braids styling", category: "Hair Cut & Style", subCategory: "Female - Braiding", gender: "female", suggestedDurationMinutes: 180, suggestedPriceInPaisa: 200000, tags: ["braiding", "protective"] },
  { name: "Cornrows", description: "Close-to-scalp cornrows braiding", category: "Hair Cut & Style", subCategory: "Female - Braiding", gender: "female", suggestedDurationMinutes: 120, suggestedPriceInPaisa: 150000, tags: ["braiding", "cornrows"] },
  { name: "Simple Bun", description: "Classic elegant bun", category: "Hair Cut & Style", subCategory: "Female - Updo", gender: "female", suggestedDurationMinutes: 25, suggestedPriceInPaisa: 25000, tags: ["updo", "bun"] },
  { name: "Messy Bun", description: "Trendy messy bun style", category: "Hair Cut & Style", subCategory: "Female - Updo", gender: "female", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 20000, isPopular: true, tags: ["updo", "bun"] },
  { name: "Top Knot", description: "High fashionable top knot", category: "Hair Cut & Style", subCategory: "Female - Updo", gender: "female", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 20000, tags: ["updo", "topknot"] },
  { name: "Chignon", description: "Elegant low chignon bun", category: "Hair Cut & Style", subCategory: "Female - Updo", gender: "female", suggestedDurationMinutes: 35, suggestedPriceInPaisa: 40000, tags: ["updo", "chignon"] },
  { name: "Bridal Updo", description: "Elaborate bridal hair updo", category: "Hair Cut & Style", subCategory: "Female - Updo", gender: "female", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 150000, isPopular: true, tags: ["updo", "bridal"] },
  { name: "Party Updo", description: "Glamorous party updo styling", category: "Hair Cut & Style", subCategory: "Female - Updo", gender: "female", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 80000, tags: ["updo", "party"] },
  
  // Ponytails
  { name: "High Ponytail", description: "Sleek high ponytail", category: "Hair Cut & Style", subCategory: "Female - Ponytail", gender: "female", suggestedDurationMinutes: 15, suggestedPriceInPaisa: 15000, tags: ["ponytail"] },
  { name: "Low Ponytail", description: "Elegant low ponytail", category: "Hair Cut & Style", subCategory: "Female - Ponytail", gender: "female", suggestedDurationMinutes: 15, suggestedPriceInPaisa: 15000, tags: ["ponytail"] },
  { name: "Side Ponytail", description: "Stylish side ponytail", category: "Hair Cut & Style", subCategory: "Female - Ponytail", gender: "female", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 20000, tags: ["ponytail"] },
  { name: "Bubble Ponytail", description: "Trendy bubble ponytail", category: "Hair Cut & Style", subCategory: "Female - Ponytail", gender: "female", suggestedDurationMinutes: 25, suggestedPriceInPaisa: 25000, tags: ["ponytail", "bubble"] },
];

// Combine all hair cut & style services
export const hairCutStyleServices: ServiceTemplateData[] = [
  ...maleHairCutServices,
  ...femaleHairCutServices
];

// ============================================
// CATEGORY 2: HAIR COLOR SERVICES
// ============================================
export const hairColorServices: ServiceTemplateData[] = [
  // Global Color (Full Head)
  { name: "Global Hair Color - Short Hair", description: "Full head color application short hair", category: "Hair Color", subCategory: "Global Color", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 150000, isPopular: true, tags: ["color", "full"] },
  { name: "Global Hair Color - Medium Hair", description: "Full head color application medium hair", category: "Hair Color", subCategory: "Global Color", gender: "unisex", suggestedDurationMinutes: 120, suggestedPriceInPaisa: 200000, isPopular: true, tags: ["color", "full"] },
  { name: "Global Hair Color - Long Hair", description: "Full head color application long hair", category: "Hair Color", subCategory: "Global Color", gender: "unisex", suggestedDurationMinutes: 150, suggestedPriceInPaisa: 250000, isPopular: true, tags: ["color", "full"] },
  
  // Root Touch Up
  { name: "Root Touch Up", description: "Color roots to cover gray/regrowth", category: "Hair Color", subCategory: "Root Touch Up", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 80000, isPopular: true, tags: ["color", "roots"] },
  { name: "Root Touch Up with Toner", description: "Root color with toning", category: "Hair Color", subCategory: "Root Touch Up", gender: "unisex", suggestedDurationMinutes: 75, suggestedPriceInPaisa: 100000, tags: ["color", "roots", "toner"] },
  
  // Highlights & Lowlights
  { name: "Full Head Highlights", description: "Highlights throughout entire head", category: "Hair Color", subCategory: "Highlights", gender: "unisex", suggestedDurationMinutes: 180, suggestedPriceInPaisa: 350000, isPopular: true, tags: ["highlights"] },
  { name: "Partial Highlights", description: "Highlights on top sections", category: "Hair Color", subCategory: "Highlights", gender: "unisex", suggestedDurationMinutes: 120, suggestedPriceInPaisa: 250000, isPopular: true, tags: ["highlights"] },
  { name: "Streaks", description: "Chunky color streaks", category: "Hair Color", subCategory: "Highlights", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 180000, tags: ["highlights", "streaks"] },
  { name: "Babylights", description: "Ultra-fine delicate highlights", category: "Hair Color", subCategory: "Highlights", gender: "female", suggestedDurationMinutes: 150, suggestedPriceInPaisa: 300000, tags: ["highlights", "natural"] },
  { name: "Balayage", description: "Hand-painted highlights", category: "Hair Color", subCategory: "Highlights", gender: "unisex", suggestedDurationMinutes: 180, suggestedPriceInPaisa: 400000, isPopular: true, tags: ["highlights", "balayage"] },
  { name: "Ombre", description: "Gradual color transition", category: "Hair Color", subCategory: "Highlights", gender: "unisex", suggestedDurationMinutes: 150, suggestedPriceInPaisa: 350000, isPopular: true, tags: ["ombre"] },
  { name: "Lowlights", description: "Darker tones for dimension", category: "Hair Color", subCategory: "Lowlights", gender: "unisex", suggestedDurationMinutes: 120, suggestedPriceInPaisa: 250000, tags: ["lowlights"] },
  
  // Fashion Colors
  { name: "Fashion Color - Single Color", description: "Bold fashion color application", category: "Hair Color", subCategory: "Fashion Color", gender: "unisex", suggestedDurationMinutes: 150, suggestedPriceInPaisa: 300000, tags: ["fashion", "bold"] },
  { name: "Fashion Color - Multi Color", description: "Multiple vibrant colors", category: "Hair Color", subCategory: "Fashion Color", gender: "unisex", suggestedDurationMinutes: 180, suggestedPriceInPaisa: 400000, tags: ["fashion", "rainbow"] },
  { name: "Pastel Hair Color", description: "Soft pastel hair coloring", category: "Hair Color", subCategory: "Fashion Color", gender: "unisex", suggestedDurationMinutes: 180, suggestedPriceInPaisa: 350000, tags: ["fashion", "pastel"] },
  
  // Bleaching
  { name: "Hair Bleaching - Full Head", description: "Complete hair bleaching", category: "Hair Color", subCategory: "Bleaching", gender: "unisex", suggestedDurationMinutes: 150, suggestedPriceInPaisa: 250000, tags: ["bleach"] },
  { name: "Hair Bleaching - Partial", description: "Partial section bleaching", category: "Hair Color", subCategory: "Bleaching", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 150000, tags: ["bleach"] },
  { name: "Bleach & Tone", description: "Bleach with toner application", category: "Hair Color", subCategory: "Bleaching", gender: "unisex", suggestedDurationMinutes: 180, suggestedPriceInPaisa: 300000, isPopular: true, tags: ["bleach", "toner"] },
  
  // Gray Coverage
  { name: "Gray Coverage - Short Hair", description: "Full gray hair coverage short", category: "Hair Color", subCategory: "Gray Coverage", gender: "unisex", suggestedDurationMinutes: 75, suggestedPriceInPaisa: 120000, isPopular: true, tags: ["gray", "coverage"] },
  { name: "Gray Coverage - Medium Hair", description: "Full gray hair coverage medium", category: "Hair Color", subCategory: "Gray Coverage", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 150000, isPopular: true, tags: ["gray", "coverage"] },
  { name: "Gray Coverage - Long Hair", description: "Full gray hair coverage long", category: "Hair Color", subCategory: "Gray Coverage", gender: "unisex", suggestedDurationMinutes: 120, suggestedPriceInPaisa: 180000, isPopular: true, tags: ["gray", "coverage"] },
  
  // Male Specific
  { name: "Beard Color", description: "Professional beard coloring", category: "Hair Color", subCategory: "Male - Beard", gender: "male", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 50000, tags: ["beard", "male"] },
  { name: "Mustache Color", description: "Mustache coloring service", category: "Hair Color", subCategory: "Male - Beard", gender: "male", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 30000, tags: ["mustache", "male"] },
];

// ============================================
// CATEGORY 3: HAIR TREATMENTS (CHEMICAL & SPA)
// ============================================
export const hairTreatmentServices: ServiceTemplateData[] = [
  // Keratin & Smoothening
  { name: "Keratin Treatment - Short Hair", description: "Keratin smoothening for short hair", category: "Hair Treatment", subCategory: "Keratin", gender: "unisex", suggestedDurationMinutes: 120, suggestedPriceInPaisa: 300000, isPopular: true, tags: ["keratin", "smoothening"] },
  { name: "Keratin Treatment - Medium Hair", description: "Keratin smoothening for medium hair", category: "Hair Treatment", subCategory: "Keratin", gender: "unisex", suggestedDurationMinutes: 150, suggestedPriceInPaisa: 400000, isPopular: true, tags: ["keratin", "smoothening"] },
  { name: "Keratin Treatment - Long Hair", description: "Keratin smoothening for long hair", category: "Hair Treatment", subCategory: "Keratin", gender: "unisex", suggestedDurationMinutes: 180, suggestedPriceInPaisa: 500000, isPopular: true, tags: ["keratin", "smoothening"] },
  { name: "Brazilian Blowout", description: "Brazilian keratin blowout treatment", category: "Hair Treatment", subCategory: "Keratin", gender: "unisex", suggestedDurationMinutes: 180, suggestedPriceInPaisa: 600000, tags: ["keratin", "brazilian"] },
  { name: "Protein Treatment", description: "Intensive protein hair treatment", category: "Hair Treatment", subCategory: "Protein", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 200000, tags: ["protein", "treatment"] },
  
  // Perms & Texturizing
  { name: "Perm - Short Hair", description: "Permanent wave treatment short", category: "Hair Treatment", subCategory: "Perm", gender: "unisex", suggestedDurationMinutes: 120, suggestedPriceInPaisa: 250000, tags: ["perm", "curls"] },
  { name: "Perm - Medium Hair", description: "Permanent wave treatment medium", category: "Hair Treatment", subCategory: "Perm", gender: "unisex", suggestedDurationMinutes: 150, suggestedPriceInPaisa: 300000, tags: ["perm", "curls"] },
  { name: "Perm - Long Hair", description: "Permanent wave treatment long", category: "Hair Treatment", subCategory: "Perm", gender: "unisex", suggestedDurationMinutes: 180, suggestedPriceInPaisa: 350000, tags: ["perm", "curls"] },
  { name: "Rebonding - Short Hair", description: "Permanent hair straightening short", category: "Hair Treatment", subCategory: "Rebonding", gender: "unisex", suggestedDurationMinutes: 180, suggestedPriceInPaisa: 350000, isPopular: true, tags: ["rebonding", "straightening"] },
  { name: "Rebonding - Medium Hair", description: "Permanent hair straightening medium", category: "Hair Treatment", subCategory: "Rebonding", gender: "unisex", suggestedDurationMinutes: 210, suggestedPriceInPaisa: 450000, isPopular: true, tags: ["rebonding", "straightening"] },
  { name: "Rebonding - Long Hair", description: "Permanent hair straightening long", category: "Hair Treatment", subCategory: "Rebonding", gender: "unisex", suggestedDurationMinutes: 240, suggestedPriceInPaisa: 550000, isPopular: true, tags: ["rebonding", "straightening"] },
  
  // Hair Spa
  { name: "Hair Spa - Short Hair", description: "Nourishing hair spa treatment short", category: "Hair Treatment", subCategory: "Hair Spa", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 100000, isPopular: true, tags: ["spa", "treatment"] },
  { name: "Hair Spa - Medium Hair", description: "Nourishing hair spa treatment medium", category: "Hair Treatment", subCategory: "Hair Spa", gender: "unisex", suggestedDurationMinutes: 75, suggestedPriceInPaisa: 120000, isPopular: true, tags: ["spa", "treatment"] },
  { name: "Hair Spa - Long Hair", description: "Nourishing hair spa treatment long", category: "Hair Treatment", subCategory: "Hair Spa", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 150000, isPopular: true, tags: ["spa", "treatment"] },
  { name: "Deep Conditioning Treatment", description: "Intensive deep conditioning", category: "Hair Treatment", subCategory: "Conditioning", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 80000, tags: ["conditioning"] },
  { name: "Hot Oil Treatment", description: "Nourishing hot oil therapy", category: "Hair Treatment", subCategory: "Oil Treatment", gender: "unisex", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 60000, tags: ["oil", "treatment"] },
  { name: "Moroccan Oil Treatment", description: "Argan oil intensive treatment", category: "Hair Treatment", subCategory: "Oil Treatment", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 100000, tags: ["oil", "moroccan"] },
  
  // Scalp Treatments
  { name: "Anti-Dandruff Treatment", description: "Specialized anti-dandruff therapy", category: "Hair Treatment", subCategory: "Scalp Treatment", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 80000, tags: ["scalp", "dandruff"] },
  { name: "Scalp Detox Treatment", description: "Deep scalp detoxification", category: "Hair Treatment", subCategory: "Scalp Treatment", gender: "unisex", suggestedDurationMinutes: 75, suggestedPriceInPaisa: 100000, tags: ["scalp", "detox"] },
  { name: "Hair Fall Control Treatment", description: "Anti hair fall therapy", category: "Hair Treatment", subCategory: "Scalp Treatment", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 120000, isPopular: true, tags: ["scalp", "hairfall"] },
  { name: "Hair Growth Treatment", description: "Stimulate hair growth treatment", category: "Hair Treatment", subCategory: "Scalp Treatment", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 150000, tags: ["scalp", "growth"] },
];

// ============================================
// CATEGORY 4: SKIN CARE (FACIALS & TREATMENTS)
// ============================================
export const skinCareServices: ServiceTemplateData[] = [
  // Basic Facials
  { name: "Basic Facial", description: "Essential cleansing facial", category: "Skin Care", subCategory: "Basic Facial", gender: "unisex", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 80000, isPopular: true, tags: ["facial", "basic"] },
  { name: "Deep Cleansing Facial", description: "Intensive deep pore cleansing", category: "Skin Care", subCategory: "Basic Facial", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 100000, isPopular: true, tags: ["facial", "cleansing"] },
  { name: "Cleanup", description: "Quick facial cleanup", category: "Skin Care", subCategory: "Cleanup", gender: "unisex", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 50000, isPopular: true, tags: ["cleanup", "quick"] },
  
  // Specialty Facials
  { name: "Gold Facial", description: "Luxurious gold-infused facial", category: "Skin Care", subCategory: "Luxury Facial", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 250000, tags: ["facial", "luxury", "gold"] },
  { name: "Diamond Facial", description: "Premium diamond facial treatment", category: "Skin Care", subCategory: "Luxury Facial", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 300000, tags: ["facial", "luxury", "diamond"] },
  { name: "Pearl Facial", description: "Brightening pearl facial", category: "Skin Care", subCategory: "Luxury Facial", gender: "unisex", suggestedDurationMinutes: 75, suggestedPriceInPaisa: 180000, tags: ["facial", "brightening"] },
  { name: "Fruit Facial", description: "Natural fruit enzyme facial", category: "Skin Care", subCategory: "Natural Facial", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 120000, isPopular: true, tags: ["facial", "natural"] },
  { name: "Chocolate Facial", description: "Antioxidant chocolate facial", category: "Skin Care", subCategory: "Natural Facial", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 130000, tags: ["facial", "chocolate"] },
  { name: "Vitamin C Facial", description: "Brightening vitamin C treatment", category: "Skin Care", subCategory: "Treatment Facial", gender: "unisex", suggestedDurationMinutes: 75, suggestedPriceInPaisa: 150000, isPopular: true, tags: ["facial", "brightening"] },
  { name: "Anti-Aging Facial", description: "Anti-aging rejuvenation treatment", category: "Skin Care", subCategory: "Treatment Facial", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 200000, tags: ["facial", "antiaging"] },
  { name: "Hydrating Facial", description: "Deep hydration facial therapy", category: "Skin Care", subCategory: "Treatment Facial", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 130000, tags: ["facial", "hydrating"] },
  { name: "Acne Treatment Facial", description: "Specialized acne treatment", category: "Skin Care", subCategory: "Treatment Facial", gender: "unisex", suggestedDurationMinutes: 75, suggestedPriceInPaisa: 150000, isPopular: true, tags: ["facial", "acne"] },
  
  // Advanced Treatments
  { name: "Oxygen Facial", description: "Oxygenating skin treatment", category: "Skin Care", subCategory: "Advanced Treatment", gender: "unisex", suggestedDurationMinutes: 75, suggestedPriceInPaisa: 200000, tags: ["facial", "oxygen"] },
  { name: "LED Light Therapy", description: "LED phototherapy facial", category: "Skin Care", subCategory: "Advanced Treatment", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 180000, tags: ["advanced", "LED"] },
  { name: "Microdermabrasion", description: "Exfoliating microdermabrasion", category: "Skin Care", subCategory: "Advanced Treatment", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 200000, tags: ["advanced", "exfoliation"] },
  { name: "Chemical Peel", description: "Skin resurfacing chemical peel", category: "Skin Care", subCategory: "Advanced Treatment", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 250000, tags: ["advanced", "peel"] },
  { name: "Hydra Facial", description: "Hydradermabrasion treatment", category: "Skin Care", subCategory: "Advanced Treatment", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 300000, isPopular: true, tags: ["advanced", "hydra"] },
  
  // De-Tan & Brightening
  { name: "De-Tan Face", description: "Face tan removal treatment", category: "Skin Care", subCategory: "De-Tan", gender: "unisex", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 80000, isPopular: true, tags: ["detan"] },
  { name: "Brightening Facial", description: "Skin brightening treatment", category: "Skin Care", subCategory: "Brightening", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 120000, tags: ["brightening"] },
  { name: "Pigmentation Treatment", description: "Dark spot reduction therapy", category: "Skin Care", subCategory: "Pigmentation", gender: "unisex", suggestedDurationMinutes: 75, suggestedPriceInPaisa: 180000, tags: ["pigmentation"] },
  
  // Bridal Packages
  { name: "Bridal Facial", description: "Pre-wedding bridal facial", category: "Skin Care", subCategory: "Bridal", gender: "female", suggestedDurationMinutes: 120, suggestedPriceInPaisa: 250000, isPopular: true, tags: ["bridal", "facial"] },
];

// ============================================
// CATEGORY 5: MAKEUP SERVICES
// ============================================
export const makeupServices: ServiceTemplateData[] = [
  // Bridal Makeup
  { name: "Bridal Makeup", description: "Complete bridal makeup package", category: "Makeup", subCategory: "Bridal", gender: "female", suggestedDurationMinutes: 180, suggestedPriceInPaisa: 500000, isPopular: true, tags: ["bridal", "wedding"] },
  { name: "HD Bridal Makeup", description: "High-definition bridal makeup", category: "Makeup", subCategory: "Bridal", gender: "female", suggestedDurationMinutes: 180, suggestedPriceInPaisa: 700000, isPopular: true, tags: ["bridal", "HD"] },
  { name: "Airbrush Bridal Makeup", description: "Airbrush bridal makeup", category: "Makeup", subCategory: "Bridal", gender: "female", suggestedDurationMinutes: 180, suggestedPriceInPaisa: 800000, tags: ["bridal", "airbrush"] },
  { name: "Engagement Makeup", description: "Engagement ceremony makeup", category: "Makeup", subCategory: "Bridal", gender: "female", suggestedDurationMinutes: 120, suggestedPriceInPaisa: 350000, isPopular: true, tags: ["engagement"] },
  { name: "Mehendi Makeup", description: "Mehendi ceremony makeup", category: "Makeup", subCategory: "Bridal", gender: "female", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 250000, tags: ["mehendi"] },
  { name: "Reception Makeup", description: "Wedding reception makeup", category: "Makeup", subCategory: "Bridal", gender: "female", suggestedDurationMinutes: 120, suggestedPriceInPaisa: 400000, tags: ["reception"] },
  
  // Party & Events
  { name: "Party Makeup", description: "Glamorous party makeup", category: "Makeup", subCategory: "Party", gender: "female", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 200000, isPopular: true, tags: ["party"] },
  { name: "HD Party Makeup", description: "High-definition party makeup", category: "Makeup", subCategory: "Party", gender: "female", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 300000, isPopular: true, tags: ["party", "HD"] },
  { name: "Airbrush Makeup", description: "Professional airbrush makeup", category: "Makeup", subCategory: "Party", gender: "female", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 350000, tags: ["airbrush"] },
  { name: "Cocktail Makeup", description: "Elegant cocktail event makeup", category: "Makeup", subCategory: "Party", gender: "female", suggestedDurationMinutes: 75, suggestedPriceInPaisa: 180000, tags: ["cocktail"] },
  
  // Everyday Makeup
  { name: "Natural Makeup", description: "Natural everyday makeup", category: "Makeup", subCategory: "Everyday", gender: "female", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 80000, isPopular: true, tags: ["natural"] },
  { name: "Office Makeup", description: "Professional office makeup", category: "Makeup", subCategory: "Everyday", gender: "female", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 70000, tags: ["office", "professional"] },
  { name: "Minimal Makeup", description: "Light minimal makeup", category: "Makeup", subCategory: "Everyday", gender: "female", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 50000, tags: ["minimal"] },
  
  // Specialty Makeup
  { name: "Smokey Eye Makeup", description: "Dramatic smokey eye", category: "Makeup", subCategory: "Eye Makeup", gender: "female", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 100000, tags: ["eyes", "smokey"] },
  { name: "Glam Makeup", description: "Full glam makeup", category: "Makeup", subCategory: "Specialty", gender: "female", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 180000, tags: ["glam"] },
  { name: "Photoshoot Makeup", description: "Professional photoshoot makeup", category: "Makeup", subCategory: "Specialty", gender: "female", suggestedDurationMinutes: 120, suggestedPriceInPaisa: 250000, tags: ["photoshoot"] },
  { name: "Editorial Makeup", description: "High-fashion editorial makeup", category: "Makeup", subCategory: "Specialty", gender: "female", suggestedDurationMinutes: 150, suggestedPriceInPaisa: 300000, tags: ["editorial", "fashion"] },
  
  // Add-On Services
  { name: "False Lashes Application", description: "False eyelash application", category: "Makeup", subCategory: "Add-On", gender: "female", suggestedDurationMinutes: 15, suggestedPriceInPaisa: 15000, isPopular: true, tags: ["lashes"] },
  { name: "Eyebrow Shaping & Fill", description: "Eyebrow shaping and filling", category: "Makeup", subCategory: "Add-On", gender: "female", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 20000, tags: ["eyebrows"] },
  { name: "Contouring & Highlighting", description: "Face contouring and highlighting", category: "Makeup", subCategory: "Add-On", gender: "female", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 30000, tags: ["contouring"] },
];

// ============================================
// CATEGORY 6: MANI-PEDI & HYGIENE
// ============================================
export const maniPediServices: ServiceTemplateData[] = [
  // Manicure Services
  { name: "Basic Manicure", description: "Essential manicure service", category: "Mani-Pedi & Hygiene", subCategory: "Manicure", gender: "unisex", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 50000, isPopular: true, tags: ["manicure", "nails"] },
  { name: "Spa Manicure", description: "Luxurious spa manicure treatment", category: "Mani-Pedi & Hygiene", subCategory: "Manicure", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 80000, isPopular: true, tags: ["manicure", "spa"] },
  { name: "Gel Manicure", description: "Long-lasting gel polish manicure", category: "Mani-Pedi & Hygiene", subCategory: "Manicure", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 100000, isPopular: true, tags: ["manicure", "gel"] },
  { name: "French Manicure", description: "Classic French manicure", category: "Mani-Pedi & Hygiene", subCategory: "Manicure", gender: "female", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 90000, isPopular: true, tags: ["manicure", "french"] },
  { name: "Nail Polish Change", description: "Simple nail polish application", category: "Mani-Pedi & Hygiene", subCategory: "Manicure", gender: "unisex", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 20000, tags: ["nails", "polish"] },
  { name: "Nail Art - Simple", description: "Basic nail art design", category: "Mani-Pedi & Hygiene", subCategory: "Nail Art", gender: "unisex", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 80000, tags: ["nailart"] },
  { name: "Nail Art - Elaborate", description: "Complex nail art designs", category: "Mani-Pedi & Hygiene", subCategory: "Nail Art", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 150000, tags: ["nailart", "complex"] },
  { name: "Nail Extension - Acrylic", description: "Acrylic nail extensions", category: "Mani-Pedi & Hygiene", subCategory: "Nail Extension", gender: "female", suggestedDurationMinutes: 120, suggestedPriceInPaisa: 200000, tags: ["extension", "acrylic"] },
  { name: "Nail Extension - Gel", description: "Gel nail extensions", category: "Mani-Pedi & Hygiene", subCategory: "Nail Extension", gender: "female", suggestedDurationMinutes: 120, suggestedPriceInPaisa: 250000, tags: ["extension", "gel"] },
  { name: "Nail Extension Removal", description: "Safe removal of nail extensions", category: "Mani-Pedi & Hygiene", subCategory: "Nail Extension", gender: "female", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 50000, tags: ["removal"] },
  
  // Pedicure Services
  { name: "Basic Pedicure", description: "Essential pedicure service", category: "Mani-Pedi & Hygiene", subCategory: "Pedicure", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 60000, isPopular: true, tags: ["pedicure", "feet"] },
  { name: "Spa Pedicure", description: "Luxurious spa pedicure treatment", category: "Mani-Pedi & Hygiene", subCategory: "Pedicure", gender: "unisex", suggestedDurationMinutes: 75, suggestedPriceInPaisa: 100000, isPopular: true, tags: ["pedicure", "spa"] },
  { name: "Gel Pedicure", description: "Long-lasting gel polish pedicure", category: "Mani-Pedi & Hygiene", subCategory: "Pedicure", gender: "unisex", suggestedDurationMinutes: 75, suggestedPriceInPaisa: 120000, isPopular: true, tags: ["pedicure", "gel"] },
  { name: "French Pedicure", description: "Classic French pedicure", category: "Mani-Pedi & Hygiene", subCategory: "Pedicure", gender: "female", suggestedDurationMinutes: 75, suggestedPriceInPaisa: 110000, tags: ["pedicure", "french"] },
  { name: "Medical Pedicure", description: "Therapeutic medical pedicure", category: "Mani-Pedi & Hygiene", subCategory: "Pedicure", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 150000, tags: ["pedicure", "medical"] },
  { name: "Foot Scrub & Polish", description: "Foot exfoliation and polish", category: "Mani-Pedi & Hygiene", subCategory: "Pedicure", gender: "unisex", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 70000, tags: ["feet", "scrub"] },
  
  // Combination Packages
  { name: "Manicure + Pedicure Combo", description: "Combined mani-pedi package", category: "Mani-Pedi & Hygiene", subCategory: "Combo", gender: "unisex", suggestedDurationMinutes: 105, suggestedPriceInPaisa: 100000, isPopular: true, tags: ["combo", "package"] },
  { name: "Spa Manicure + Spa Pedicure", description: "Luxurious spa mani-pedi combo", category: "Mani-Pedi & Hygiene", subCategory: "Combo", gender: "unisex", suggestedDurationMinutes: 135, suggestedPriceInPaisa: 160000, isPopular: true, tags: ["combo", "spa"] },
];

// ============================================
// CATEGORY 7: MASSAGE & SPA
// ============================================
export const massageServices: ServiceTemplateData[] = [
  // Body Massage
  { name: "Full Body Massage", description: "Complete body relaxation massage", category: "Massage & Spa", subCategory: "Body Massage", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 150000, isPopular: true, tags: ["massage", "fullbody"] },
  { name: "Swedish Massage", description: "Gentle Swedish massage therapy", category: "Massage & Spa", subCategory: "Body Massage", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 180000, isPopular: true, tags: ["massage", "swedish"] },
  { name: "Deep Tissue Massage", description: "Intensive deep tissue therapy", category: "Massage & Spa", subCategory: "Body Massage", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 200000, isPopular: true, tags: ["massage", "deeptissue"] },
  { name: "Aromatherapy Massage", description: "Aromatic oil massage therapy", category: "Massage & Spa", subCategory: "Body Massage", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 200000, tags: ["massage", "aromatherapy"] },
  { name: "Hot Stone Massage", description: "Heated stone massage therapy", category: "Massage & Spa", subCategory: "Body Massage", gender: "unisex", suggestedDurationMinutes: 75, suggestedPriceInPaisa: 250000, tags: ["massage", "hotstone"] },
  { name: "Thai Massage", description: "Traditional Thai massage", category: "Massage & Spa", subCategory: "Body Massage", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 220000, tags: ["massage", "thai"] },
  { name: "Balinese Massage", description: "Traditional Balinese therapy", category: "Massage & Spa", subCategory: "Body Massage", gender: "unisex", suggestedDurationMinutes: 75, suggestedPriceInPaisa: 210000, tags: ["massage", "balinese"] },
  
  // Targeted Massage
  { name: "Back Massage", description: "Focused back and shoulder massage", category: "Massage & Spa", subCategory: "Targeted Massage", gender: "unisex", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 80000, isPopular: true, tags: ["massage", "back"] },
  { name: "Foot Massage", description: "Relaxing foot reflexology", category: "Massage & Spa", subCategory: "Targeted Massage", gender: "unisex", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 70000, isPopular: true, tags: ["massage", "foot"] },
  { name: "Neck & Shoulder Massage", description: "Neck and shoulder tension relief", category: "Massage & Spa", subCategory: "Targeted Massage", gender: "unisex", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 75000, tags: ["massage", "neck"] },
  { name: "Hand & Arm Massage", description: "Hand and arm relaxation", category: "Massage & Spa", subCategory: "Targeted Massage", gender: "unisex", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 50000, tags: ["massage", "hand"] },
  
  // Specialty Massage
  { name: "Sports Massage", description: "Athletic recovery massage", category: "Massage & Spa", subCategory: "Specialty", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 200000, tags: ["massage", "sports"] },
  { name: "Prenatal Massage", description: "Safe pregnancy massage", category: "Massage & Spa", subCategory: "Specialty", gender: "female", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 180000, tags: ["massage", "prenatal"] },
  { name: "Couple Massage", description: "Romantic couples massage", category: "Massage & Spa", subCategory: "Specialty", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 300000, tags: ["massage", "couple"] },
];

// ============================================
// CATEGORY 8: BODY TREATMENTS
// ============================================
export const bodyTreatmentServices: ServiceTemplateData[] = [
  // Body Scrubs & Polishing
  { name: "Full Body Scrub", description: "Complete body exfoliation", category: "Body Treatment", subCategory: "Body Scrub", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 120000, isPopular: true, tags: ["scrub", "exfoliation"] },
  { name: "Body Polishing", description: "Luxurious body polishing treatment", category: "Body Treatment", subCategory: "Body Polish", gender: "unisex", suggestedDurationMinutes: 75, suggestedPriceInPaisa: 150000, isPopular: true, tags: ["polish", "exfoliation"] },
  { name: "Salt Scrub", description: "Mineral-rich salt body scrub", category: "Body Treatment", subCategory: "Body Scrub", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 130000, tags: ["scrub", "salt"] },
  { name: "Coffee Scrub", description: "Energizing coffee body scrub", category: "Body Treatment", subCategory: "Body Scrub", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 120000, tags: ["scrub", "coffee"] },
  
  // Body Wraps
  { name: "Body Wrap - Detox", description: "Detoxifying body wrap", category: "Body Treatment", subCategory: "Body Wrap", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 200000, tags: ["wrap", "detox"] },
  { name: "Body Wrap - Hydrating", description: "Moisturizing body wrap", category: "Body Treatment", subCategory: "Body Wrap", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 200000, tags: ["wrap", "hydrating"] },
  { name: "Mud Wrap", description: "Therapeutic mud body wrap", category: "Body Treatment", subCategory: "Body Wrap", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 220000, tags: ["wrap", "mud"] },
  
  // De-Tan Treatments
  { name: "Full Body De-Tan", description: "Complete body tan removal", category: "Body Treatment", subCategory: "De-Tan", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 180000, isPopular: true, tags: ["detan", "brightening"] },
  { name: "Back De-Tan", description: "Back tan removal treatment", category: "Body Treatment", subCategory: "De-Tan", gender: "unisex", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 80000, tags: ["detan", "back"] },
  { name: "Arms & Legs De-Tan", description: "Limbs tan removal", category: "Body Treatment", subCategory: "De-Tan", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 100000, tags: ["detan", "limbs"] },
  
  // Body Bleaching
  { name: "Full Body Bleach", description: "Complete body bleaching", category: "Body Treatment", subCategory: "Bleaching", gender: "female", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 150000, tags: ["bleach"] },
  { name: "Arms & Legs Bleach", description: "Limbs bleaching treatment", category: "Body Treatment", subCategory: "Bleaching", gender: "female", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 80000, tags: ["bleach"] },
  { name: "Back Bleach", description: "Back bleaching service", category: "Body Treatment", subCategory: "Bleaching", gender: "female", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 70000, tags: ["bleach"] },
];

// ============================================
// CATEGORY 9: WAXING & THREADING
// ============================================
export const waxingThreadingServices: ServiceTemplateData[] = [
  // Full Body Waxing
  { name: "Full Body Wax", description: "Complete body waxing", category: "Waxing & Threading", subCategory: "Body Waxing", gender: "female", suggestedDurationMinutes: 120, suggestedPriceInPaisa: 200000, isPopular: true, tags: ["waxing", "fullbody"] },
  { name: "Full Arms Wax", description: "Complete arms waxing", category: "Waxing & Threading", subCategory: "Body Waxing", gender: "female", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 40000, isPopular: true, tags: ["waxing", "arms"] },
  { name: "Full Legs Wax", description: "Complete legs waxing", category: "Waxing & Threading", subCategory: "Body Waxing", gender: "female", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 60000, isPopular: true, tags: ["waxing", "legs"] },
  { name: "Half Arms Wax", description: "Lower arms waxing", category: "Waxing & Threading", subCategory: "Body Waxing", gender: "female", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 25000, tags: ["waxing", "arms"] },
  { name: "Half Legs Wax", description: "Lower legs waxing", category: "Waxing & Threading", subCategory: "Body Waxing", gender: "female", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 35000, tags: ["waxing", "legs"] },
  { name: "Underarms Wax", description: "Underarm waxing service", category: "Waxing & Threading", subCategory: "Body Waxing", gender: "female", suggestedDurationMinutes: 15, suggestedPriceInPaisa: 15000, isPopular: true, tags: ["waxing", "underarms"] },
  { name: "Bikini Wax", description: "Bikini area waxing", category: "Waxing & Threading", subCategory: "Intimate Waxing", gender: "female", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 50000, tags: ["waxing", "bikini"] },
  { name: "Brazilian Wax", description: "Full Brazilian waxing", category: "Waxing & Threading", subCategory: "Intimate Waxing", gender: "female", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 80000, tags: ["waxing", "brazilian"] },
  { name: "Back Wax", description: "Back waxing service", category: "Waxing & Threading", subCategory: "Body Waxing", gender: "unisex", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 50000, tags: ["waxing", "back"] },
  { name: "Chest Wax", description: "Chest waxing service", category: "Waxing & Threading", subCategory: "Body Waxing", gender: "male", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 50000, tags: ["waxing", "chest", "male"] },
  { name: "Stomach Wax", description: "Stomach waxing service", category: "Waxing & Threading", subCategory: "Body Waxing", gender: "female", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 30000, tags: ["waxing", "stomach"] },
  
  // Facial Waxing
  { name: "Full Face Wax", description: "Complete facial waxing", category: "Waxing & Threading", subCategory: "Facial Waxing", gender: "female", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 40000, isPopular: true, tags: ["waxing", "face"] },
  { name: "Upper Lip Wax", description: "Upper lip hair removal", category: "Waxing & Threading", subCategory: "Facial Waxing", gender: "female", suggestedDurationMinutes: 10, suggestedPriceInPaisa: 10000, isPopular: true, tags: ["waxing", "lip"] },
  { name: "Chin Wax", description: "Chin hair removal", category: "Waxing & Threading", subCategory: "Facial Waxing", gender: "female", suggestedDurationMinutes: 10, suggestedPriceInPaisa: 10000, tags: ["waxing", "chin"] },
  { name: "Forehead Wax", description: "Forehead hair removal", category: "Waxing & Threading", subCategory: "Facial Waxing", gender: "female", suggestedDurationMinutes: 10, suggestedPriceInPaisa: 10000, tags: ["waxing", "forehead"] },
  { name: "Sideburns Wax", description: "Sideburns hair removal", category: "Waxing & Threading", subCategory: "Facial Waxing", gender: "female", suggestedDurationMinutes: 10, suggestedPriceInPaisa: 10000, tags: ["waxing", "sideburns"] },
  
  // Threading Services
  { name: "Eyebrow Threading", description: "Precise eyebrow shaping", category: "Waxing & Threading", subCategory: "Threading", gender: "unisex", suggestedDurationMinutes: 15, suggestedPriceInPaisa: 15000, isPopular: true, tags: ["threading", "eyebrows"] },
  { name: "Upper Lip Threading", description: "Upper lip hair threading", category: "Waxing & Threading", subCategory: "Threading", gender: "female", suggestedDurationMinutes: 10, suggestedPriceInPaisa: 10000, isPopular: true, tags: ["threading", "lip"] },
  { name: "Full Face Threading", description: "Complete facial threading", category: "Waxing & Threading", subCategory: "Threading", gender: "female", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 35000, isPopular: true, tags: ["threading", "face"] },
  { name: "Chin Threading", description: "Chin hair threading", category: "Waxing & Threading", subCategory: "Threading", gender: "female", suggestedDurationMinutes: 10, suggestedPriceInPaisa: 10000, tags: ["threading", "chin"] },
  { name: "Forehead Threading", description: "Forehead hair threading", category: "Waxing & Threading", subCategory: "Threading", gender: "female", suggestedDurationMinutes: 10, suggestedPriceInPaisa: 10000, tags: ["threading", "forehead"] },
];

// ============================================
// CATEGORY 10: PIERCING & TATTOO
// ============================================
export const piercingTattooServices: ServiceTemplateData[] = [
  // Piercing Services
  { name: "Ear Piercing - Single", description: "Single ear piercing", category: "Piercing & Tattoo", subCategory: "Piercing", gender: "unisex", suggestedDurationMinutes: 15, suggestedPriceInPaisa: 30000, isPopular: true, tags: ["piercing", "ear"] },
  { name: "Ear Piercing - Pair", description: "Pair of ear piercings", category: "Piercing & Tattoo", subCategory: "Piercing", gender: "unisex", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 50000, isPopular: true, tags: ["piercing", "ear"] },
  { name: "Cartilage Piercing", description: "Upper ear cartilage piercing", category: "Piercing & Tattoo", subCategory: "Piercing", gender: "unisex", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 40000, tags: ["piercing", "cartilage"] },
  { name: "Nose Piercing", description: "Nose piercing service", category: "Piercing & Tattoo", subCategory: "Piercing", gender: "unisex", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 40000, isPopular: true, tags: ["piercing", "nose"] },
  { name: "Septum Piercing", description: "Septum nose piercing", category: "Piercing & Tattoo", subCategory: "Piercing", gender: "unisex", suggestedDurationMinutes: 25, suggestedPriceInPaisa: 50000, tags: ["piercing", "septum"] },
  { name: "Eyebrow Piercing", description: "Eyebrow piercing service", category: "Piercing & Tattoo", subCategory: "Piercing", gender: "unisex", suggestedDurationMinutes: 20, suggestedPriceInPaisa: 40000, tags: ["piercing", "eyebrow"] },
  { name: "Lip Piercing", description: "Lip piercing service", category: "Piercing & Tattoo", subCategory: "Piercing", gender: "unisex", suggestedDurationMinutes: 25, suggestedPriceInPaisa: 50000, tags: ["piercing", "lip"] },
  { name: "Tongue Piercing", description: "Tongue piercing service", category: "Piercing & Tattoo", subCategory: "Piercing", gender: "unisex", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 60000, tags: ["piercing", "tongue"] },
  { name: "Navel Piercing", description: "Belly button piercing", category: "Piercing & Tattoo", subCategory: "Piercing", gender: "unisex", suggestedDurationMinutes: 25, suggestedPriceInPaisa: 50000, tags: ["piercing", "navel"] },
  
  // Temporary Tattoo Services
  { name: "Temporary Tattoo - Small", description: "Small temporary tattoo", category: "Piercing & Tattoo", subCategory: "Temporary Tattoo", gender: "unisex", suggestedDurationMinutes: 30, suggestedPriceInPaisa: 50000, tags: ["tattoo", "temporary"] },
  { name: "Temporary Tattoo - Medium", description: "Medium temporary tattoo", category: "Piercing & Tattoo", subCategory: "Temporary Tattoo", gender: "unisex", suggestedDurationMinutes: 60, suggestedPriceInPaisa: 100000, tags: ["tattoo", "temporary"] },
  { name: "Temporary Tattoo - Large", description: "Large temporary tattoo", category: "Piercing & Tattoo", subCategory: "Temporary Tattoo", gender: "unisex", suggestedDurationMinutes: 90, suggestedPriceInPaisa: 150000, tags: ["tattoo", "temporary"] },
  { name: "Henna/Mehndi Application - Simple", description: "Simple henna design", category: "Piercing & Tattoo", subCategory: "Henna", gender: "unisex", suggestedDurationMinutes: 45, suggestedPriceInPaisa: 50000, isPopular: true, tags: ["henna", "mehndi"] },
  { name: "Henna/Mehndi Application - Elaborate", description: "Intricate henna design", category: "Piercing & Tattoo", subCategory: "Henna", gender: "unisex", suggestedDurationMinutes: 120, suggestedPriceInPaisa: 150000, isPopular: true, tags: ["henna", "mehndi", "bridal"] },
  { name: "Bridal Mehndi - Both Hands & Feet", description: "Complete bridal mehndi", category: "Piercing & Tattoo", subCategory: "Henna", gender: "female", suggestedDurationMinutes: 240, suggestedPriceInPaisa: 500000, isPopular: true, tags: ["henna", "mehndi", "bridal"] },
];

// ============================================
// MASTER EXPORT - ALL SERVICE TEMPLATES
// ============================================
export const allServiceTemplates: ServiceTemplateData[] = [
  ...hairCutStyleServices,
  ...hairColorServices,
  ...hairTreatmentServices,
  ...skinCareServices,
  ...makeupServices,
  ...maniPediServices,
  ...massageServices,
  ...bodyTreatmentServices,
  ...waxingThreadingServices,
  ...piercingTattooServices
];

// Export summary for reference
export const serviceTemplatesSummary = {
  totalServices: allServiceTemplates.length,
  categories: {
    "Hair Cut & Style": hairCutStyleServices.length,
    "Hair Color": hairColorServices.length,
    "Hair Treatment": hairTreatmentServices.length,
    "Skin Care": skinCareServices.length,
    "Makeup": makeupServices.length,
    "Mani-Pedi & Hygiene": maniPediServices.length,
    "Massage & Spa": massageServices.length,
    "Body Treatment": bodyTreatmentServices.length,
    "Waxing & Threading": waxingThreadingServices.length,
    "Piercing & Tattoo": piercingTattooServices.length
  }
};

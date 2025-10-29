export function getServiceImage(serviceName: string, category: string): string {
  const name = serviceName.toLowerCase();
  const cat = category.toLowerCase();
  
  // Men's services
  if (name.includes('men') || name.includes('beard') || name.includes('shave')) {
    return '/assets/services/haircut-men.jpg';
  }
  
  // Bridal services
  if (name.includes('bridal') || name.includes('bride') || name.includes('wedding')) {
    return '/assets/services/bridal-makeup.jpg';
  }
  
  // Hair coloring
  if (name.includes('color') || name.includes('highlight') || name.includes('balayage') || 
      name.includes('ombre') || name.includes('bleach') || name.includes('dye') ||
      cat.includes('hair color')) {
    return '/assets/services/hair-color.jpg';
  }
  
  // Hair treatment
  if (name.includes('treatment') || name.includes('keratin') || name.includes('straighten') ||
      name.includes('smoothing') || name.includes('protein') || name.includes('spa') && cat.includes('hair') ||
      cat.includes('hair treatment')) {
    return '/assets/services/hair-treatment.jpg';
  }
  
  // Makeup
  if (name.includes('makeup') || name.includes('foundation') || name.includes('eye') ||
      name.includes('lip') || cat.includes('makeup')) {
    return '/assets/services/makeup.jpg';
  }
  
  // Manicure/Pedicure
  if (name.includes('manicure') || name.includes('pedicure') || name.includes('nail') ||
      name.includes('mani') || name.includes('pedi') || cat.includes('mani-pedi')) {
    return '/assets/services/manicure.jpg';
  }
  
  // Facial/Skincare
  if (name.includes('facial') || name.includes('skin') || name.includes('cleanup') ||
      name.includes('peel') || name.includes('glow') || cat.includes('skin care')) {
    return '/assets/services/facial.jpg';
  }
  
  // Waxing/Threading
  if (name.includes('wax') || name.includes('thread') || name.includes('hair removal') ||
      name.includes('eyebrow') || cat.includes('waxing') || cat.includes('threading')) {
    return '/assets/services/waxing.jpg';
  }
  
  // Massage
  if (name.includes('massage') || name.includes('therapy') && !cat.includes('hair') ||
      cat.includes('massage')) {
    return '/assets/services/massage.jpg';
  }
  
  // Body treatment
  if (name.includes('body') || name.includes('scrub') || name.includes('wrap') ||
      cat.includes('body treatment')) {
    return '/assets/services/body-treatment.jpg';
  }
  
  // Haircut (default for hair services)
  if (cat.includes('hair') || name.includes('haircut') || name.includes('trim') ||
      name.includes('cut') || name.includes('style')) {
    return '/assets/services/haircut-women.jpg';
  }
  
  // Default fallback
  return '/assets/services/haircut-women.jpg';
}

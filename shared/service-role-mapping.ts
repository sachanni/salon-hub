/**
 * Intelligent Service-to-Role Mapping System
 * Maps service categories and names to appropriate staff roles
 * Ensures staff roles stay in sync with salon's service offerings
 */

export interface RoleTemplate {
  value: string;
  icon: string;
  color: string;
  serviceCategories: string[];
  serviceKeywords: string[];
}

// Comprehensive role templates with service mappings
export const ROLE_TEMPLATES_WITH_MAPPING: RoleTemplate[] = [
  {
    value: "Stylist",
    icon: "Scissors",
    color: "from-purple-500 to-pink-500",
    serviceCategories: ["Hair & styling", "Hair"],
    serviceKeywords: ["haircut", "hair cut", "styling", "blowdry", "blow dry", "hair styling", "men's haircut", "women's haircut", "kids haircut"]
  },
  {
    value: "Colorist",
    icon: "PaintBucket",
    color: "from-pink-500 to-rose-500",
    serviceCategories: ["Hair & styling", "Hair"],
    serviceKeywords: ["color", "coloring", "highlights", "balayage", "ombre", "hair color", "dye", "tint", "bleach", "root touch"]
  },
  {
    value: "Nail Technician",
    icon: "Sparkles",
    color: "from-violet-500 to-purple-500",
    serviceCategories: ["Nails"],
    serviceKeywords: ["manicure", "pedicure", "nail", "gel nails", "acrylic", "nail art", "nail polish", "shellac"]
  },
  {
    value: "Makeup Artist",
    icon: "Smile",
    color: "from-rose-500 to-pink-500",
    serviceCategories: ["Makeup"],
    serviceKeywords: ["makeup", "make up", "bridal makeup", "party makeup", "special occasion", "cosmetics"]
  },
  {
    value: "Esthetician",
    icon: "Star",
    color: "from-purple-500 to-violet-500",
    serviceCategories: ["Skincare & Facials", "Eyebrows & Lashes", "Body Treatments"],
    serviceKeywords: ["facial", "skincare", "skin care", "eyebrow", "lashes", "waxing", "threading", "microdermabrasion", "chemical peel", "body scrub", "body wrap"]
  },
  {
    value: "Massage Therapist",
    icon: "Briefcase",
    color: "from-pink-500 to-purple-500",
    serviceCategories: ["Massage & Spa", "Body Treatments", "Wellness & Other"],
    serviceKeywords: ["massage", "spa", "body massage", "deep tissue", "swedish", "aromatherapy", "hot stone", "reflexology"]
  },
  {
    value: "Piercing Specialist",
    icon: "Circle",
    color: "from-indigo-500 to-purple-500",
    serviceCategories: ["Piercing"],
    serviceKeywords: ["piercing", "ear piercing", "nose piercing", "cartilage", "body piercing"]
  },
  {
    value: "Tattoo Artist",
    icon: "Palette",
    color: "from-purple-500 to-indigo-500",
    serviceCategories: ["Tattoo"],
    serviceKeywords: ["tattoo", "ink", "body art", "permanent art"]
  },
  {
    value: "Barber",
    icon: "Scissors",
    color: "from-blue-500 to-indigo-500",
    serviceCategories: ["Men's Grooming", "Hair & styling"],
    serviceKeywords: ["beard", "shave", "men's grooming", "barber", "men's haircut", "beard trim", "hot towel"]
  },
  {
    value: "Lash Technician",
    icon: "Eye",
    color: "from-pink-500 to-rose-500",
    serviceCategories: ["Eyebrows & Lashes"],
    serviceKeywords: ["lash", "lashes", "eyelash", "lash extension", "lash lift", "lash tint"]
  },
  {
    value: "Waxing Specialist",
    icon: "Zap",
    color: "from-orange-500 to-pink-500",
    serviceCategories: ["Hair Removal"],
    serviceKeywords: ["wax", "waxing", "hair removal", "brazilian", "bikini wax", "body wax"]
  }
];

/**
 * Analyzes salon services and returns suggested staff roles
 * @param services - Array of salon's active services
 * @returns Array of suggested role names with reasoning
 */
export function getSuggestedRolesFromServices(services: Array<{ name: string; category?: string | null }>): Array<{
  role: string;
  reason: string;
  matchedServices: string[];
}> {
  const suggestedRolesMap = new Map<string, { reason: string; matchedServices: Set<string> }>();

  services.forEach(service => {
    const serviceName = service.name.toLowerCase();
    const serviceCategory = service.category?.toLowerCase() || '';

    ROLE_TEMPLATES_WITH_MAPPING.forEach(roleTemplate => {
      let isMatch = false;
      const matchType: string[] = [];

      // Check category match
      if (serviceCategory && roleTemplate.serviceCategories.some(cat => 
        serviceCategory.includes(cat.toLowerCase()) || cat.toLowerCase().includes(serviceCategory)
      )) {
        isMatch = true;
        matchType.push('category');
      }

      // Check keyword match
      if (roleTemplate.serviceKeywords.some(keyword => serviceName.includes(keyword.toLowerCase()))) {
        isMatch = true;
        matchType.push('service name');
      }

      if (isMatch) {
        if (!suggestedRolesMap.has(roleTemplate.value)) {
          suggestedRolesMap.set(roleTemplate.value, {
            reason: `Based on ${matchType.join(' and ')} match`,
            matchedServices: new Set()
          });
        }
        suggestedRolesMap.get(roleTemplate.value)!.matchedServices.add(service.name);
      }
    });
  });

  // Convert map to array with detailed information
  return Array.from(suggestedRolesMap.entries()).map(([role, data]) => ({
    role,
    reason: data.reason,
    matchedServices: Array.from(data.matchedServices)
  }));
}

/**
 * Get role template by role name
 */
export function getRoleTemplate(roleName: string): RoleTemplate | undefined {
  return ROLE_TEMPLATES_WITH_MAPPING.find(r => r.value === roleName);
}

/**
 * Get all available role names
 */
export function getAllRoleNames(): string[] {
  return ROLE_TEMPLATES_WITH_MAPPING.map(r => r.value);
}

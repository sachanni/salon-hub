import { useState, useEffect, useCallback } from 'react';

export interface RecentlyViewedSalon {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  location: string;
  category: string;
  priceRange: string;
  image?: string;
  viewedAt: string; // ISO timestamp
}

const RECENTLY_VIEWED_KEY = 'salonhub_recently_viewed';
const MAX_RECENTLY_VIEWED = 12; // Store up to 12 items, display fewer

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedSalon[]>([]);

  // Load recently viewed salons from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (stored && typeof stored === 'string') {
        const parsed: RecentlyViewedSalon[] = JSON.parse(stored);
        // Validate that we got an array
        if (Array.isArray(parsed)) {
          // Sort by most recent first and validate data structure
          const validSalons = parsed
            .filter(salon => salon && typeof salon === 'object' && salon.id && salon.name && salon.viewedAt)
            .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
            .slice(0, MAX_RECENTLY_VIEWED);
          setRecentlyViewed(validSalons);
        } else {
          throw new Error('Parsed data is not an array');
        }
      }
    } catch (error) {
      console.error('Error loading recently viewed salons:', error);
      // Clear corrupted data
      localStorage.removeItem(RECENTLY_VIEWED_KEY);
      setRecentlyViewed([]);
    }
  }, []);

  // Add or update a salon in recently viewed list
  const addRecentlyViewed = useCallback((salon: Omit<RecentlyViewedSalon, 'viewedAt'>) => {
    const newSalon: RecentlyViewedSalon = {
      ...salon,
      viewedAt: new Date().toISOString()
    };

    setRecentlyViewed(current => {
      // Remove existing entry if present (to avoid duplicates)
      const filtered = current.filter(item => item.id !== salon.id);
      
      // Add new entry at the beginning
      const updated = [newSalon, ...filtered].slice(0, MAX_RECENTLY_VIEWED);

      // Persist to localStorage
      try {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving recently viewed salon:', error);
      }

      return updated;
    });
  }, []);

  // Clear all recently viewed salons
  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  }, []);

  // Remove a specific salon from recently viewed
  const removeRecentlyViewed = useCallback((salonId: string) => {
    setRecentlyViewed(current => {
      const updated = current.filter(salon => salon.id !== salonId);
      
      try {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error removing recently viewed salon:', error);
      }

      return updated;
    });
  }, []);

  // Get recently viewed salons (limited for display)
  const getRecentlyViewed = useCallback((limit = 8) => {
    return recentlyViewed.slice(0, limit);
  }, [recentlyViewed]);

  return {
    recentlyViewed,
    addRecentlyViewed,
    clearRecentlyViewed,
    removeRecentlyViewed,
    getRecentlyViewed,
    hasRecentlyViewed: recentlyViewed.length > 0
  };
}
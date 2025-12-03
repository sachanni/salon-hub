import { useEffect, useCallback, useMemo } from 'react';
import { useABTest, ABVariant } from '@/contexts/ABTestContext';

interface UseABTestTrackingOptions {
  testId: string;
  variant?: ABVariant;
  trackPageView?: boolean;
  distribution?: number;
}

export function useABTestTracking({
  testId,
  variant,
  trackPageView = true,
  distribution = 0.5
}: UseABTestTrackingOptions) {
  const { getVariant, setVariant, trackEvent } = useABTest();
  
  const activeVariant = useMemo(() => {
    return variant || getVariant(testId, distribution);
  }, [variant, testId, distribution, getVariant]);

  useEffect(() => {
    setVariant(testId, activeVariant);
  }, [testId, activeVariant, setVariant]);

  useEffect(() => {
    if (trackPageView) {
      trackEvent(testId, 'page_view', {
        variant: activeVariant,
        page: window.location.pathname
      });
    }
  }, [testId, activeVariant, trackPageView, trackEvent]);

  const trackClick = useCallback((elementName: string, metadata?: Record<string, any>) => {
    trackEvent(testId, 'click', {
      variant: activeVariant,
      element: elementName,
      ...metadata
    });
  }, [testId, activeVariant, trackEvent]);

  const trackConversion = useCallback((conversionType: string, metadata?: Record<string, any>) => {
    trackEvent(testId, 'conversion', {
      variant: activeVariant,
      type: conversionType,
      ...metadata
    });
  }, [testId, activeVariant, trackEvent]);

  const trackEngagement = useCallback((engagementType: string, metadata?: Record<string, any>) => {
    trackEvent(testId, 'engagement', {
      variant: activeVariant,
      type: engagementType,
      ...metadata
    });
  }, [testId, activeVariant, trackEvent]);

  return {
    variant: activeVariant,
    trackClick,
    trackConversion,
    trackEngagement
  };
}

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ABVariant = 'A' | 'B';

interface ABTest {
  testId: string;
  variant: ABVariant;
  timestamp: number;
}

interface ABTestContextType {
  getVariant: (testId: string, distribution?: number) => ABVariant;
  setVariant: (testId: string, variant: ABVariant) => void;
  trackEvent: (testId: string, eventName: string, metadata?: Record<string, any>) => void;
  resetTest: (testId: string) => void;
  resetAllTests: () => void;
  getAllTests: () => ABTest[];
}

const ABTestContext = createContext<ABTestContextType | undefined>(undefined);

const AB_TEST_STORAGE_KEY = 'salonhub_ab_tests';
const AB_TEST_EVENTS_KEY = 'salonhub_ab_events';

export function ABTestProvider({ children }: { children: ReactNode }) {
  const [tests, setTests] = useState<Record<string, ABTest>>({});

  useEffect(() => {
    const stored = localStorage.getItem(AB_TEST_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTests(parsed);
      } catch (error) {
        console.error('Failed to parse AB test data:', error);
        localStorage.removeItem(AB_TEST_STORAGE_KEY);
      }
    }
  }, []);

  const saveTests = (updatedTests: Record<string, ABTest>) => {
    setTests(updatedTests);
    localStorage.setItem(AB_TEST_STORAGE_KEY, JSON.stringify(updatedTests));
  };

  const getVariant = (testId: string, distribution: number = 0.5): ABVariant => {
    if (tests[testId]) {
      return tests[testId].variant;
    }

    const random = Math.random();
    const variant: ABVariant = random < distribution ? 'A' : 'B';

    return variant;
  };

  const setVariant = (testId: string, variant: ABVariant) => {
    if (tests[testId]?.variant === variant) {
      return;
    }

    const newTest: ABTest = {
      testId,
      variant,
      timestamp: Date.now()
    };

    const updatedTests = {
      ...tests,
      [testId]: newTest
    };

    saveTests(updatedTests);
    trackEvent(testId, 'variant_assigned', { variant });
  };

  const trackEvent = (testId: string, eventName: string, metadata?: Record<string, any>) => {
    const variant = tests[testId]?.variant || 'unknown';

    const event = {
      testId,
      variant,
      eventName,
      metadata: metadata || {},
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const existingEvents = localStorage.getItem(AB_TEST_EVENTS_KEY);
    const events = existingEvents ? JSON.parse(existingEvents) : [];
    events.push(event);

    const maxEvents = 1000;
    const trimmedEvents = events.slice(-maxEvents);

    localStorage.setItem(AB_TEST_EVENTS_KEY, JSON.stringify(trimmedEvents));

    if (process.env.NODE_ENV === 'development') {
      console.log('[A/B Test Event]', event);
    }
  };

  const resetTest = (testId: string) => {
    const updatedTests = { ...tests };
    delete updatedTests[testId];
    saveTests(updatedTests);
    trackEvent(testId, 'test_reset', {});
  };

  const resetAllTests = () => {
    setTests({});
    localStorage.removeItem(AB_TEST_STORAGE_KEY);
    localStorage.removeItem(AB_TEST_EVENTS_KEY);
    console.log('[A/B Testing] All tests reset');
  };

  const getAllTests = (): ABTest[] => {
    return Object.values(tests);
  };

  return (
    <ABTestContext.Provider
      value={{
        getVariant,
        setVariant,
        trackEvent,
        resetTest,
        resetAllTests,
        getAllTests
      }}
    >
      {children}
    </ABTestContext.Provider>
  );
}

export function useABTest() {
  const context = useContext(ABTestContext);
  if (!context) {
    throw new Error('useABTest must be used within ABTestProvider');
  }
  return context;
}

export function useABVariant(testId: string, distribution?: number): ABVariant {
  const { getVariant } = useABTest();
  return getVariant(testId, distribution);
}

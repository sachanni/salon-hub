import { useState, useCallback, useRef, useEffect } from 'react';

interface UserCheckResult {
  exists: boolean;
  hasAccount: boolean;
}

interface UseUserVerificationReturn {
  checkUserExists: (email?: string, phone?: string) => Promise<UserCheckResult | null>;
  isChecking: boolean;
  userExistsCheck: UserCheckResult | null;
}

export function useUserVerification(): UseUserVerificationReturn {
  const [isChecking, setIsChecking] = useState(false);
  const [userExistsCheck, setUserExistsCheck] = useState<UserCheckResult | null>(null);
  const lastCheckedRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const checkUserExists = useCallback(async (
    email?: string, 
    phone?: string
  ): Promise<UserCheckResult | null> => {
    // Cancel any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!email && !phone) {
      setUserExistsCheck(null);
      setIsChecking(false);
      return null;
    }

    const checkKey = `${email || ''}-${phone || ''}`;
    
    // Skip if same as last checked and we have a result
    if (checkKey === lastCheckedRef.current && userExistsCheck !== null) {
      return userExistsCheck;
    }

    // Set checking state immediately for UX feedback
    setIsChecking(true);
    
    // Debounce the actual API call by 500ms to prevent rate limit exhaustion
    return new Promise<UserCheckResult | null>((resolve) => {
      debounceTimerRef.current = setTimeout(async () => {
        lastCheckedRef.current = checkKey;

        // Create new abort controller for this request
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
          const response = await fetch('/api/auth/check-user-exists', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, phone }),
            signal: abortController.signal,
          });

          // Only update state if this request wasn't aborted
          if (!abortController.signal.aborted) {
            if (response.ok) {
              const result: UserCheckResult = await response.json();
              
              // Double-check the input still matches to prevent race conditions
              const currentCheckKey = `${email || ''}-${phone || ''}`;
              if (currentCheckKey === lastCheckedRef.current) {
                setUserExistsCheck(result);
                resolve(result);
              } else {
                resolve(null);
              }
            } else {
              console.error('Failed to check user existence');
              setUserExistsCheck(null);
              resolve(null);
            }
          }
        } catch (error) {
          // Ignore abort errors
          if ((error as Error).name !== 'AbortError') {
            console.error('Error checking user existence:', error);
            setUserExistsCheck(null);
          }
          resolve(null);
        } finally {
          if (!abortController.signal.aborted) {
            setIsChecking(false);
          }
        }
      }, 500); // 500ms debounce delay
    });
  }, [userExistsCheck]);

  return {
    checkUserExists,
    isChecking,
    userExistsCheck,
  };
}

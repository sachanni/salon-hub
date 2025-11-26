/**
 * JWT Authentication Utility for Mobile and Web
 * Handles access token storage, automatic refresh, and API request interceptors
 */

import { useEffect, useRef } from 'react';

// Store access token in memory (not localStorage for security)
let accessToken: string | null = null;
let tokenRefreshTimer: NodeJS.Timeout | null = null;

/**
 * Get the current access token from memory
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Set the access token in memory and schedule automatic refresh
 */
export function setAccessToken(token: string | null) {
  accessToken = token;
  
  if (token) {
    // Schedule token refresh 2 minutes before expiry (15 min token - 2 min = 13 min)
    scheduleTokenRefresh();
  } else {
    // Clear refresh timer if token is removed
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer);
      tokenRefreshTimer = null;
    }
  }
}

/**
 * Schedule automatic token refresh before expiry
 * Access tokens expire in 15 minutes, we refresh after 13 minutes
 */
function scheduleTokenRefresh() {
  // Clear any existing timer
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
  }

  // Refresh token after 13 minutes (780,000 ms)
  tokenRefreshTimer = setTimeout(async () => {
    try {
      await refreshAccessToken();
    } catch (error) {
      console.error('Automatic token refresh failed:', error);
      // Token refresh failed, emit event for UI warning
      window.dispatchEvent(
        new CustomEvent('session_expiry_warning', {
          detail: { reason: 'token_refresh_failed' },
        })
      );
      setAccessToken(null);
    }
  }, 13 * 60 * 1000); // 13 minutes
}

/**
 * Refresh the access token using the refresh token cookie
 */
export async function refreshAccessToken(): Promise<string> {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include', // Include cookies (refresh token)
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();
  setAccessToken(data.accessToken);
  return data.accessToken;
}

/**
 * Clear all authentication data (logout)
 */
export function clearAuth() {
  setAccessToken(null);
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
    tokenRefreshTimer = null;
  }
}

/**
 * Fetch wrapper that automatically includes JWT token in headers
 * Falls back to session cookies if no JWT token is available
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Add Authorization header if we have a JWT token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Always include credentials for cookies (session or refresh token)
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // If we get a 401 and have a refresh token, try to refresh and retry
  if (response.status === 401 && !(headers['X-Retry-After-Refresh'])) {
    try {
      const newToken = await refreshAccessToken();
      
      // Create new headers object for retry to avoid mutation issues
      const retryHeaders: Record<string, string> = {
        ...headers,
        'Authorization': `Bearer ${newToken}`,
        'X-Retry-After-Refresh': 'true', // Prevent infinite retry loop
      };
      
      return fetch(url, {
        ...options,
        headers: retryHeaders,
        credentials: 'include',
      });
    } catch (error) {
      console.error('Token refresh failed, user needs to login:', error);
      // Emit event for UI warning before redirecting
      window.dispatchEvent(
        new CustomEvent('session_expiry_warning', {
          detail: { reason: 'token_refresh_failed' },
        })
      );
      clearAuth();
      // Give user 2 minutes before force redirect
      setTimeout(() => {
        if (!getAccessToken()) {
          window.location.href = '/login';
        }
      }, 2 * 60 * 1000);
    }
  }

  return response;
}

/**
 * React hook to initialize JWT authentication on app load
 * Call this in your main App component
 */
export function useJWTAuth() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Try to get access token from login response (stored in sessionStorage temporarily)
    const storedToken = sessionStorage.getItem('accessToken');
    if (storedToken) {
      setAccessToken(storedToken);
      sessionStorage.removeItem('accessToken'); // Remove after reading
    } else {
      // No stored token, try to refresh from cookie on page load
      refreshAccessToken()
        .then((token) => {
          console.log('Access token refreshed on page load');
        })
        .catch((error) => {
          console.debug('No valid refresh token on page load:', error);
          // This is normal for first-time visitors or logged-out users
        });
    }

    // Cleanup on unmount
    return () => {
      clearAuth();
    };
  }, []);
}

/**
 * Login helper that stores the access token
 */
export function handleLoginSuccess(accessToken: string) {
  setAccessToken(accessToken);
}

/**
 * Logout helper that clears all auth data
 */
export async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout request failed:', error);
  } finally {
    clearAuth();
    window.location.href = '/login';
  }
}

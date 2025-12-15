import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getAccessToken, refreshAccessToken } from "./auth";

async function throwIfResNotOk(res: Response) {
  if (!res.ok && res.status !== 304) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function getAuthHeaders(existingHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAccessToken();
  if (token) {
    return { ...existingHeaders, 'Authorization': `Bearer ${token}` };
  }
  return existingHeaders;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(headers),
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // If 401, try to refresh token and retry once
  if (res.status === 401) {
    try {
      await refreshAccessToken();
      const retryRes = await fetch(url, {
        method,
        headers: getAuthHeaders(headers),
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });
      await throwIfResNotOk(retryRes);
      return retryRes;
    } catch (refreshError) {
      // Refresh failed, return original 401
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Extract URL path (all non-object elements) and query params (last object element if exists)
    const pathSegments: string[] = [];
    let queryParams: Record<string, unknown> | undefined;
    
    for (const segment of queryKey) {
      if (typeof segment === 'object' && segment !== null && !Array.isArray(segment)) {
        // Last object is query parameters (not arrays)
        queryParams = segment as Record<string, unknown>;
      } else {
        // Convert all other types (string, number, boolean) to string for URL path
        pathSegments.push(String(segment));
      }
    }
    
    // Build URL with query parameters
    let url = pathSegments.join("/");
    if (queryParams && Object.keys(queryParams).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    try {
      const res = await fetch(url, {
        credentials: "include",
        cache: "no-store",
        headers: getAuthHeaders({
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        })
      });

      // If 401, try to refresh token and retry once
      if (res.status === 401) {
        try {
          await refreshAccessToken();
          const retryRes = await fetch(url, {
            credentials: "include",
            cache: "no-store",
            headers: getAuthHeaders({
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            })
          });
          
          if (unauthorizedBehavior === "returnNull" && retryRes.status === 401) {
            return null;
          }
          
          await throwIfResNotOk(retryRes);
          
          const retryText = await retryRes.text();
          if (!retryText || retryText.trim() === '') {
            return null as unknown as T;
          }
          
          try {
            const retryJsonResponse = JSON.parse(retryText);
            if (retryJsonResponse && typeof retryJsonResponse === 'object' && 'success' in retryJsonResponse && 'data' in retryJsonResponse) {
              return retryJsonResponse.data as T;
            }
            return retryJsonResponse as T;
          } catch (error) {
            console.error('JSON parsing error after token refresh:', error);
            throw new Error(`Failed to parse JSON response: ${error}`);
          }
        } catch (refreshError) {
          // Token refresh failed, continue with original 401 handling
          if (unauthorizedBehavior === "returnNull") {
            return null;
          }
          throw new Error('401: Unauthorized');
        }
      }

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      
      const text = await res.text();
      
      if (!text || text.trim() === '') {
        return null as unknown as T;
      }
      
      try {
        const jsonResponse = JSON.parse(text);
        
        if (jsonResponse && typeof jsonResponse === 'object' && 'success' in jsonResponse && 'data' in jsonResponse) {
          return jsonResponse.data as T;
        }
        
        return jsonResponse as T;
      } catch (error) {
        console.error('JSON parsing error in queryClient:', error, 'Response:', text.substring(0, 200));
        throw new Error(`Failed to parse JSON response: ${error}`);
      }
    } catch (error) {
      console.error('QueryClient fetch error for', url, ':', error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

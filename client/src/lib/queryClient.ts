import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok && res.status !== 304) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

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
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        return {} as unknown as T;
      }
      
      // Parse JSON response
      const text = await res.text();
      
      if (!text || text.trim() === '') {
        return null as unknown as T;
      }
      
      try {
        const jsonResponse = JSON.parse(text);
        
        // Auto-unwrap standard API response format: { success, data }
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

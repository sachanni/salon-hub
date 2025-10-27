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
    const url = queryKey.join("/") as string;
    console.log('QueryClient fetching:', url);
    
    try {
      const res = await fetch(url, {
        credentials: "include",
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      console.log('QueryClient response:', url, 'status:', res.status, 'ok:', res.ok);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log('QueryClient 401 - returning null');
        return null;
      }

      await throwIfResNotOk(res);
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      console.log('QueryClient content-type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        console.log('QueryClient no JSON content-type - returning {}');
        return {} as unknown as T;
      }
      
      // Parse JSON response
      const text = await res.text();
      console.log('QueryClient text length:', text?.length || 0);
      
      if (!text || text.trim() === '') {
        console.log('QueryClient empty text - returning null');
        return null as unknown as T;
      }
      
      try {
        const data = JSON.parse(text) as T;
        console.log('QueryClient parsed successfully:', url);
        return data;
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

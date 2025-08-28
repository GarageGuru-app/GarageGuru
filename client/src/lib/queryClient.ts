import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const json = await res.json();
      // Use the server's message if available, otherwise use a generic message
      const message = json.message || json.error || res.statusText;
      throw new Error(message);
    } catch (parseError) {
      // If response isn't JSON, show user-friendly messages based on status
      if (res.status === 401) {
        throw new Error("Invalid email or password");
      } else if (res.status === 403) {
        throw new Error("Access denied");
      } else if (res.status === 404) {
        throw new Error("Service not found");
      } else if (res.status >= 500) {
        throw new Error("Server error. Please try again later");
      } else {
        throw new Error("Something went wrong. Please try again");
      }
    }
  }
}

// API base URL - use relative paths since frontend and backend are served together
// In production, if VITE_API_URL is not set, we default to empty string (same origin)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

console.log('🔧 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD
});

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  console.log(`🌐 API Request: ${method} ${fullUrl}`);
  
  const token = localStorage.getItem('auth-token');
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log(`📡 API Response: ${res.status} ${res.statusText}`);
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`❌ API Request failed: ${method} ${fullUrl}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    console.log(`🔍 Query Request: GET ${fullUrl}`);
    
    const token = localStorage.getItem('auth-token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(fullUrl, {
        headers,
        credentials: "include",
      });

      console.log(`📊 Query Response: ${res.status} ${res.statusText}`);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      // Don't clear auth state for failed API calls - just throw the error
      if (!res.ok) {
        try {
          const json = await res.json();
          const message = json.message || json.error || res.statusText;
          throw new Error(message);
        } catch (parseError) {
          // If response isn't JSON, show user-friendly messages based on status
          if (res.status === 401) {
            throw new Error("Unauthorized access");
          } else if (res.status === 403) {
            throw new Error("Access denied");
          } else if (res.status === 404) {
            throw new Error("Resource not found");
          } else if (res.status >= 500) {
            throw new Error("Server error. Please try again later");
          } else {
            throw new Error("Request failed. Please try again");
          }
        }
      }
      return await res.json();
    } catch (error) {
      console.error(`❌ Query Request failed: GET ${fullUrl}`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }), // Don't throw on 401, just return null
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

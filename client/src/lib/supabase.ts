// This file is kept minimal since we're using Drizzle directly
// but provides a foundation for any Supabase-specific configurations

export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("auth-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiRequest = async (
  method: string,
  url: string,
  data?: unknown
): Promise<Response> => {
  // Ensure we use the correct base URL for API calls
  const API_BASE_URL = import.meta.env.VITE_API_URL || (
    import.meta.env.DEV ? 'http://localhost:5000' : ''
  );
  
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  console.log(`🌐 Supabase API Request: ${method} ${fullUrl}`);
  
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };

  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  console.log(`📡 Supabase API Response: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || "Request failed");
  }

  return response;
};

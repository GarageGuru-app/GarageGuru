// This file is kept minimal since we're using Drizzle directly
// but provides a foundation for any Supabase-specific configurations

export const getAuthHeaders = () => {
  const token = localStorage.getItem("auth-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiRequest = async (
  method: string,
  url: string,
  data?: unknown
): Promise<Response> => {
  const headers: HeadersInit = {
    ...getAuthHeaders(),
  };

  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || "Request failed");
  }

  return response;
};

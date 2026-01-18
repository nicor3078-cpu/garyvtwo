import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Gets the base URL for the Express API server
 * In development: uses EXPO_PUBLIC_DOMAIN from environment
 * In production: uses EXPO_PUBLIC_API_URL or falls back to the deployed Replit URL
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  // First check for explicit API URL (set during build for production)
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (apiUrl) {
    return apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
  }

  // Fall back to domain-based URL (development)
  const host = process.env.EXPO_PUBLIC_DOMAIN;
  if (host) {
    const url = new URL(`https://${host}`);
    return url.href;
  }

  // Final fallback for standalone builds - this should be updated after publishing
  // If you're building an APK, set EXPO_PUBLIC_API_URL to your deployed Replit URL
  console.warn("No API URL configured - using placeholder. Set EXPO_PUBLIC_API_URL for production builds.");
  return "https://gary-decoder.replit.app/";
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

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
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
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

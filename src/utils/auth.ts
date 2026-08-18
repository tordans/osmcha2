import { toast } from "sonner";
import { postFinalTokensOSMCha } from "../network/auth.ts";
import { useAuthStore } from "../stores/authStore.ts";

/**
 * OSM OAuth against production only works when this origin is localhost
 * (Django overrides the redirect URI for those hosts).
 */
export function isLocalOAuthHost(
  hostname: string = window.location.hostname,
): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/**
 * If `search` contains a non-empty `token` param, return it and the same query
 * with `token` removed. Does not persist or log the value.
 *
 * Splits on `&` instead of URLSearchParams so OSMCha's unencoded JSON
 * `filters={...}` query is left intact.
 */
export function takeAuthTokenFromSearch(
  search: string,
): { token: string; nextSearch: string } | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw) return null;

  const rest: string[] = [];
  let token = "";
  for (const part of raw.split("&")) {
    const eq = part.indexOf("=");
    const key = eq === -1 ? part : part.slice(0, eq);
    if (key === "token") {
      if (!token) {
        const value = eq === -1 ? "" : part.slice(eq + 1);
        try {
          token = decodeURIComponent(value.replace(/\+/g, " ")).trim();
        } catch {
          token = value.trim();
        }
      }
      continue;
    }
    rest.push(part);
  }
  if (!token) return null;
  const next = rest.join("&");
  return { token, nextSearch: next ? `?${next}` : "" };
}

/**
 * Completes OAuth login flow by exchanging code for token.
 */
export async function completeOAuthLogin(code: string) {
  try {
    toast.warning("Login in progress", {
      description: "Please wait. We are logging you in.",
      duration: 1000,
    });

    const { token } = (await postFinalTokensOSMCha(code)) as { token: string };

    if (!token || token === "") {
      throw new Error("Invalid token");
    }

    // Save to Zustand store (persists to localStorage under "auth" key)
    useAuthStore.getState().setToken(token);

    toast.success("Login Successful");

    return token;
  } catch (error) {
    console.error("Login error:", error);
    const err = error as Error;
    toast.error("Login failed", { description: err.message });
    throw error;
  }
}

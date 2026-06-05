/**
 * Resolves asset paths through the Vercel proxy to avoid CORS issues.
 *
 * All asset URLs are routed through `/api/assets/...` which Vercel
 * rewrites to `assets.grudge-studio.com/...` (same-origin = no CORS).
 *
 * In development: returns the path as-is (served from public/).
 * In production: prefixes `/api/assets` so the Vercel rewrite proxies
 * the request to the R2 CDN without cross-origin restrictions.
 *
 * Usage:
 *   assetUrl("/assets/barbarians/models/characters/BRB_Characters_customizable.FBX")
 *   // dev  → "/assets/barbarians/models/characters/BRB_Characters_customizable.FBX"
 *   // prod → "/api/assets/assets/barbarians/models/characters/BRB_Characters_customizable.FBX"
 *   //        (Vercel rewrites to assets.grudge-studio.com/assets/...)
 */

const IS_PROD = import.meta.env.PROD;

/**
 * Resolve a local asset path to the correct origin.
 * In production, routes through the Vercel `/api/assets/` proxy.
 */
export function assetUrl(path: string): string {
  // Already an absolute URL — pass through
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // Ensure single leading slash
  const clean = path.startsWith("/") ? path : `/${path}`;
  // In production, proxy through Vercel to avoid CORS
  if (IS_PROD) return `/api/assets${clean}`;
  // In dev, serve from public/
  return clean;
}

/** The proxy base path for assets */
export const CDN_BASE = IS_PROD ? "/api/assets" : "";

/** Whether proxied CDN is active */
export const isR2Active = IS_PROD;

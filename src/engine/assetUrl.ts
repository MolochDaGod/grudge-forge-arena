/**
 * Resolves asset paths to either the local public/ folder or the R2 CDN.
 *
 * In development (no VITE_R2_CDN_BASE set): returns the path as-is (served
 * from public/).
 *
 * In production (VITE_R2_CDN_BASE is set): prefixes the CDN origin so assets
 * are loaded from Cloudflare R2 / assets.grudge-studio.com.
 *
 * Usage:
 *   assetUrl("/assets/barbarians/models/characters/BRB_Characters_customizable.FBX")
 *   // dev  → "/assets/barbarians/models/characters/BRB_Characters_customizable.FBX"
 *   // prod → "https://assets.grudge-studio.com/assets/barbarians/models/characters/BRB_Characters_customizable.FBX"
 */

const R2_CDN_BASE = (import.meta.env.VITE_R2_CDN_BASE ?? "").replace(/\/$/, "");

/**
 * Resolve a local asset path to the correct origin.
 * Paths must start with "/" (relative to public root).
 */
export function assetUrl(path: string): string {
  if (!R2_CDN_BASE) return path;
  // Already an absolute URL — pass through
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // Ensure single leading slash
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${R2_CDN_BASE}${clean}`;
}

/** The raw CDN base, empty string when not configured */
export const CDN_BASE = R2_CDN_BASE;

/** Whether R2 CDN is active (truthy in prod, falsy in local dev) */
export const isR2Active = !!R2_CDN_BASE;

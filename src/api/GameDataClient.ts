/**
 * GameDataClient.ts
 * REST API client for Grudge ObjectStore — fetches game data with caching.
 *
 * Endpoints:
 *   objectstore.grudge-studio.com/api/v1/weapons.json
 *   objectstore.grudge-studio.com/api/v1/skills.json
 *   objectstore.grudge-studio.com/api/v1/races.json
 *   objectstore.grudge-studio.com/api/v1/map-config.json
 *
 * Falls back to local hardcoded data if fetch fails (offline-first).
 * Caches successful responses in sessionStorage for the session duration.
 */

const API_BASE = "https://grudge-objectstore.pages.dev/api/v1";
const CACHE_PREFIX = "grudge_api_";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export interface FetchResult<T> {
  data: T;
  fromCache: boolean;
  fromFallback: boolean;
}

/**
 * Fetch JSON from ObjectStore with sessionStorage cache + fallback.
 */
async function fetchWithCache<T>(
  endpoint: string,
  fallback: T,
  onProgress?: (status: string) => void,
): Promise<FetchResult<T>> {
  const cacheKey = CACHE_PREFIX + endpoint;

  // 1. Check sessionStorage cache
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed._ts && Date.now() - parsed._ts < CACHE_TTL) {
        return { data: parsed.data as T, fromCache: true, fromFallback: false };
      }
    }
  } catch { /* cache miss */ }

  // 2. Fetch from ObjectStore
  onProgress?.(`Fetching ${endpoint}...`);
  try {
    const url = `${API_BASE}/${endpoint}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000), // 8s timeout
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as T;

    // Cache in sessionStorage
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ data, _ts: Date.now() }));
    } catch { /* storage full — skip cache */ }

    return { data, fromCache: false, fromFallback: false };
  } catch (err) {
    console.warn(`[GameDataClient] Failed to fetch ${endpoint}, using fallback:`, err);
    return { data: fallback, fromCache: false, fromFallback: true };
  }
}

/**
 * GameDataClient — high-level API for loading all game data.
 */
export class GameDataClient {
  /** Fetch weapon definitions from ObjectStore. */
  static async fetchWeapons(
    fallback: any[],
    onProgress?: (status: string) => void,
  ) {
    return fetchWithCache("weapons.json", fallback, onProgress);
  }

  /** Fetch skill catalog from ObjectStore. */
  static async fetchSkills(
    fallback: Record<string, any>,
    onProgress?: (status: string) => void,
  ) {
    return fetchWithCache("skills.json", fallback, onProgress);
  }

  /** Fetch race configurations from ObjectStore. */
  static async fetchRaces(
    fallback: any[],
    onProgress?: (status: string) => void,
  ) {
    return fetchWithCache("races.json", fallback, onProgress);
  }

  /** Fetch map configuration (terrain params, spawn points, etc.) from ObjectStore. */
  static async fetchMapConfig(
    fallback: Record<string, any>,
    onProgress?: (status: string) => void,
  ) {
    return fetchWithCache("map-config.json", fallback, onProgress);
  }

  /** Clear all cached API data. */
  static clearCache(): void {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) keys.push(key);
    }
    keys.forEach(k => sessionStorage.removeItem(k));
  }
}

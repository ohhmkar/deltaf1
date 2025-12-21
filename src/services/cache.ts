interface CacheEntry {
  data: any;
  timestamp: number;
  expiresIn: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, expiresIn: number = this.DEFAULT_EXPIRY): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  remove(key: string): void {
    this.cache.delete(key);
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.expiresIn) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new ApiCache();

// Cleanup expired cache entries every 10 minutes
if (typeof window !== "undefined") {
  setInterval(() => apiCache.cleanup(), 10 * 60 * 1000);
}

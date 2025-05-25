/**
 * Client-side caching utilities for calendar data
 */

// Define the cache structure
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Cache configuration
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Set an item in the cache
 * @param key Cache key
 * @param data Data to cache
 * @param duration Optional cache duration in milliseconds
 */
export function setCacheItem<T>(
  key: string,
  data: T,
  duration: number = DEFAULT_CACHE_DURATION
): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const cacheItem: CacheItem<T> = {
    data,
    timestamp: now,
    expiresAt: now + duration,
  };

  try {
    localStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('Error setting cache item:', error);
    // If localStorage is full, clear older items
    clearOldCacheItems();
    try {
      localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (retryError) {
      console.error('Failed to set cache item after clearing old items:', retryError);
    }
  }
}

/**
 * Get an item from the cache
 * @param key Cache key
 * @returns Cached data or null if not found or expired
 */
export function getCacheItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const cacheItem: CacheItem<T> = JSON.parse(item);
    const now = Date.now();

    // Check if the item has expired
    if (now > cacheItem.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return cacheItem.data;
  } catch (error) {
    console.error('Error getting cache item:', error);
    return null;
  }
}

/**
 * Clear all cache items
 */
export function clearCache(): void {
  if (typeof window === 'undefined') return;

  try {
    // Only clear items that start with 'calendar_'
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('calendar_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Clear old cache items (older than the default cache duration)
 */
function clearOldCacheItems(): void {
  if (typeof window === 'undefined') return;

  try {
    const now = Date.now();
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('calendar_')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const cacheItem = JSON.parse(item);
            if (now > cacheItem.expiresAt) {
              localStorage.removeItem(key);
            }
          }
        } catch (parseError) {
          // If we can't parse the item, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Error clearing old cache items:', error);
  }
}

/**
 * Generate a cache key for calendar tasks
 * @param planId Study plan ID
 * @param startDate Start date of the range
 * @param endDate End date of the range
 * @returns Cache key string
 */
export function generateTasksCacheKey(
  planId: string,
  startDate: Date,
  endDate: Date
): string {
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  return `calendar_tasks_${planId}_${startStr}_${endStr}`;
}

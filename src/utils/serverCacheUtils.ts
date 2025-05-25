/**
 * Server-side caching utilities for AI responses
 * 
 * This utility provides server-side caching for AI responses to reduce API calls
 * and improve performance. It uses an in-memory cache with expiration.
 */

// Define the cache structure
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// In-memory cache storage
const memoryCache: Map<string, CacheItem<any>> = new Map();

// Cache configuration
const DEFAULT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const MAX_CACHE_SIZE = 1000; // Maximum number of items in cache
const CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

// Set up periodic cache cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupCache, CACHE_CLEANUP_INTERVAL);
}

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
  const now = Date.now();
  const cacheItem: CacheItem<T> = {
    data,
    timestamp: now,
    expiresAt: now + duration,
  };

  // Check if cache is at capacity
  if (memoryCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest item
    const oldestKey = findOldestCacheItem();
    if (oldestKey) {
      memoryCache.delete(oldestKey);
    }
  }

  // Add new item to cache
  memoryCache.set(key, cacheItem);
}

/**
 * Get an item from the cache
 * @param key Cache key
 * @returns Cached data or null if not found or expired
 */
export function getCacheItem<T>(key: string): T | null {
  const cacheItem = memoryCache.get(key) as CacheItem<T> | undefined;
  
  if (!cacheItem) {
    return null;
  }

  const now = Date.now();

  // Check if the item has expired
  if (now > cacheItem.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return cacheItem.data;
}

/**
 * Clear all cache items
 */
export function clearCache(): void {
  memoryCache.clear();
}

/**
 * Clear expired cache items
 */
function cleanupCache(): void {
  const now = Date.now();
  
  for (const [key, item] of memoryCache.entries()) {
    if (now > item.expiresAt) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Find the oldest item in the cache
 * @returns The key of the oldest cache item, or null if cache is empty
 */
function findOldestCacheItem(): string | null {
  if (memoryCache.size === 0) {
    return null;
  }

  let oldestKey: string | null = null;
  let oldestTimestamp = Infinity;

  for (const [key, item] of memoryCache.entries()) {
    if (item.timestamp < oldestTimestamp) {
      oldestTimestamp = item.timestamp;
      oldestKey = key;
    }
  }

  return oldestKey;
}

/**
 * Generate a cache key for an agent request
 * @param agentType Type of agent
 * @param userId User ID
 * @param contextHash Hash of the context object
 * @returns Cache key
 */
export function generateAgentCacheKey(
  agentType: string,
  userId: string,
  contextHash: string
): string {
  return `agent_${agentType}_${userId}_${contextHash}`;
}

/**
 * Generate a simple hash for an object
 * @param obj Object to hash
 * @returns Hash string
 */
export function hashObject(obj: any): string {
  // Simple hash function for objects
  const str = JSON.stringify(obj);
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash.toString(36);
}

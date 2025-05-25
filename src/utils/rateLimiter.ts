/**
 * Simple in-memory rate limiter for API endpoints
 * 
 * This utility helps prevent excessive API calls by tracking
 * the last time an endpoint was called for a specific user.
 */

interface RateLimitEntry {
  userId: string;
  endpoint: string;
  lastCalled: number;
}

// In-memory storage for rate limit entries
const rateLimitStore: RateLimitEntry[] = [];

// Default cooldown periods (in milliseconds)
const DEFAULT_COOLDOWN = 60 * 1000; // 1 minute
const ENDPOINT_COOLDOWNS: Record<string, number> = {
  'remediation': 5 * 60 * 1000, // 5 minutes
  'remediation-agent': 5 * 60 * 1000, // 5 minutes
  'monitor': 10 * 60 * 1000, // 10 minutes
  'monitor/trigger': 10 * 60 * 1000, // 10 minutes
};

/**
 * Check if a request is rate limited
 * @param userId User ID
 * @param endpoint API endpoint
 * @returns Whether the request is rate limited
 */
export function isRateLimited(userId: string, endpoint: string): boolean {
  // Clean up old entries
  cleanupOldEntries();

  // Get the cooldown period for this endpoint
  const cooldown = getEndpointCooldown(endpoint);

  // Find the entry for this user and endpoint
  const entry = rateLimitStore.find(
    entry => entry.userId === userId && entry.endpoint === endpoint
  );

  // If no entry exists, the request is not rate limited
  if (!entry) {
    return false;
  }

  // Check if the cooldown period has elapsed
  const now = Date.now();
  const timeSinceLastCall = now - entry.lastCalled;

  return timeSinceLastCall < cooldown;
}

/**
 * Record a request for rate limiting
 * @param userId User ID
 * @param endpoint API endpoint
 */
export function recordRequest(userId: string, endpoint: string): void {
  // Find the entry for this user and endpoint
  const entryIndex = rateLimitStore.findIndex(
    entry => entry.userId === userId && entry.endpoint === endpoint
  );

  // Update or create the entry
  if (entryIndex >= 0) {
    rateLimitStore[entryIndex].lastCalled = Date.now();
  } else {
    rateLimitStore.push({
      userId,
      endpoint,
      lastCalled: Date.now()
    });
  }
}

/**
 * Get the cooldown period for an endpoint
 * @param endpoint API endpoint
 * @returns Cooldown period in milliseconds
 */
function getEndpointCooldown(endpoint: string): number {
  // Check for exact match
  if (endpoint in ENDPOINT_COOLDOWNS) {
    return ENDPOINT_COOLDOWNS[endpoint];
  }

  // Check for partial match
  for (const [key, value] of Object.entries(ENDPOINT_COOLDOWNS)) {
    if (endpoint.includes(key)) {
      return value;
    }
  }

  // Return default cooldown
  return DEFAULT_COOLDOWN;
}

/**
 * Clean up old entries from the rate limit store
 */
function cleanupOldEntries(): void {
  const now = Date.now();
  const maxCooldown = Math.max(...Object.values(ENDPOINT_COOLDOWNS), DEFAULT_COOLDOWN);

  // Remove entries that are older than the maximum cooldown period
  const newStore = rateLimitStore.filter(entry => {
    const timeSinceLastCall = now - entry.lastCalled;
    return timeSinceLastCall < maxCooldown * 2; // Keep entries for twice the cooldown period
  });

  // Update the store
  rateLimitStore.length = 0;
  rateLimitStore.push(...newStore);
}

/**
 * Get time remaining until rate limit expires
 * @param userId User ID
 * @param endpoint API endpoint
 * @returns Time remaining in milliseconds, or 0 if not rate limited
 */
export function getRateLimitTimeRemaining(userId: string, endpoint: string): number {
  // Find the entry for this user and endpoint
  const entry = rateLimitStore.find(
    entry => entry.userId === userId && entry.endpoint === endpoint
  );

  // If no entry exists, return 0
  if (!entry) {
    return 0;
  }

  // Get the cooldown period for this endpoint
  const cooldown = getEndpointCooldown(endpoint);

  // Calculate time remaining
  const now = Date.now();
  const timeSinceLastCall = now - entry.lastCalled;
  const timeRemaining = cooldown - timeSinceLastCall;

  return Math.max(0, timeRemaining);
}

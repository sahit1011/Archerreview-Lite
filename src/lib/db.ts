import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dynamic-calendar';

/**
 * Fail fast in production if the URI is missing or still points at a local dev DB.
 * Checked at connect time (NOT module top-level) so `next build` — which sets
 * NODE_ENV=production and loads .env.local — doesn't trip it during static analysis.
 * Fires on the first real DB request in prod, giving a clear config error instead
 * of a confusing "connect ECONNREFUSED" on every request.
 */
function assertProdUri() {
  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.MONGODB_URI || MONGODB_URI.includes('localhost') || MONGODB_URI.includes('127.0.0.1'))
  ) {
    throw new Error(
      'MONGODB_URI is missing or points at localhost in production. ' +
      'Set a managed MongoDB (Atlas) connection string in the deployment env.'
    );
  }
}

/**
 * Cached connection across hot reloads / serverless invocations. The cache is
 * RESILIENT: it never hands back a dead connection. When Mongo restarts or the
 * socket drops, the cached conn becomes truthy-but-disconnected — returning it
 * would 500 every request until the whole app restarts (the old bug). Here we
 * gate reuse on `readyState` and clear a failed promise so the next request
 * transparently reconnects once Mongo is back.
 *
 * mongoose.connection.readyState: 0 disconnected · 1 connected · 2 connecting · 3 disconnecting
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null, listenersBound: false };
}

/** Reset the cache so the next connect() call re-establishes from scratch. */
function resetCache() {
  cached.conn = null;
  cached.promise = null;
}

/** Bind disconnect/error listeners once so a dropped connection self-heals. */
function bindListeners() {
  if (cached.listenersBound) return;
  cached.listenersBound = true;
  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected — cache cleared, will reconnect on next query');
    resetCache();
  });
  mongoose.connection.on('error', (err) => {
    console.error('[db] MongoDB connection error:', err?.message || err);
    resetCache();
  });
}

export async function connectToDatabase() {
  assertProdUri();
  bindListeners();

  // Reuse only a genuinely-live connection.
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Truthy-but-dead (0 disconnected / 3 disconnecting) → discard and reconnect.
  // Leave readyState 2 (connecting) alone so we don't stack parallel connects.
  if (cached.conn && mongoose.connection.readyState !== 2) {
    resetCache();
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // fail fast when Mongo is down, then retry next request
    };

    console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        console.log('MongoDB connection successful');
        return m;
      })
      .catch((error) => {
        // CRITICAL: clear the cached promise so a transient failure doesn't
        // poison the cache forever. Without this, one failed connect makes
        // every subsequent request re-await the same rejected promise until
        // the process restarts.
        cached.promise = null;
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    resetCache();
    throw error;
  }
}

// For backward compatibility
export default connectToDatabase;

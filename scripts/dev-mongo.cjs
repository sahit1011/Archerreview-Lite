/**
 * Local dev MongoDB via mongodb-memory-server (no Docker / no system install needed).
 * Starts a real mongod on a fixed port so the app's MONGODB_URI works, and keeps running
 * until killed.
 *
 * PERSISTENT: data is stored in .mongodb-data/ (gitignored) so it survives process
 * restarts and laptop reboots — required for the student pilot. Only re-seed when you
 * intentionally want a fresh database.
 */
const path = require('path');
const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');

const dbPath = path.join(__dirname, '..', '.mongodb-data');
fs.mkdirSync(dbPath, { recursive: true });

(async () => {
  const server = await MongoMemoryServer.create({
    instance: { port: 27017, dbName: 'archerreview', dbPath, storageEngine: 'wiredTiger' },
  });
  console.log('[dev-mongo] ready at ' + server.getUri() + ' (persistent dbPath: ' + dbPath + ')');

  const stop = async () => {
    try { await server.stop(); } catch (_) {}
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  // keep the process alive
  await new Promise(() => {});
})().catch((err) => {
  console.error('[dev-mongo] failed to start:', err);
  process.exit(1);
});

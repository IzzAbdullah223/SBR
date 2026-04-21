import mongoose from 'mongoose';
import dns from 'dns'
import dotenv from 'dotenv';



dotenv.config();
 dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
// ─────────────────────────────────────────────
// WHY CACHED CONNECTION?
//
// LOCAL (nodemon): The server process stays alive forever.
//   mongoose.connect() is called once on startup, and the
//   same connection is reused for every request. No problem.
//
// RENDER / any long-running server: Same as local — one
//   process, one connection, lives until you redeploy.
//   Also fine without caching, but caching doesn't hurt.
//
// VERCEL / AWS Lambda / serverless: Each incoming request
//   may spin up a BRAND NEW Node.js process (cold start).
//   Without caching, you'd call mongoose.connect() on
//   EVERY request — slow and hits Atlas connection limits.
//   With caching, the connection is stored on `global` which
//   survives between requests within the SAME warm instance.
//
// The pattern works identically in all three environments.
// ─────────────────────────────────────────────

// `global` persists across multiple calls within the same
// Node.js process. On serverless it survives between warm
// invocations of the same instance.
let cached = global.mongooseConnection;

if (!cached) {
  // First time this module loads: create the cache slot.
  cached = global.mongooseConnection = { conn: null, promise: null };
}

export const db_connection = async () => {
  // If we already have a live connection, reuse it immediately.
  // This is the key line — no reconnect overhead on warm calls.
  if (cached.conn) {
    console.log(' DB reusing existing connection');
    return cached.conn;
  }

  // If a connection attempt is already in-flight (parallel cold starts),
  // wait for that same promise instead of opening a second connection.
  if (!cached.promise) {
    const Connection_URL = process.env.MONGO_URL;

    if (!Connection_URL) {
      throw new Error('MONGO_URL environment variable is not set');
    }

    cached.promise = mongoose
      .connect(Connection_URL, {
        // These options prevent connection pool exhaustion on serverless
        maxPoolSize: 10,         // max simultaneous connections
        serverSelectionTimeoutMS: 5000, // fail fast if Atlas unreachable
        socketTimeoutMS: 45000,
      })
      .then((mongooseInstance) => {
        console.log(' DB connected successfully');
        return mongooseInstance;
      })
      .catch((error) => {
        // Clear the promise so the next request tries again
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    console.error(`DB Connection Error: ${error.message}`);
    process.exit(1);
  }

  return cached.conn;
};
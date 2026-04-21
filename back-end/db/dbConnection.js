import mongoose from 'mongoose';
import dns from 'dns'
import dotenv from 'dotenv';



dotenv.config();
 dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

let cached = global.mongooseConnection;

if (!cached) {
 
  cached = global.mongooseConnection = { conn: null, promise: null };
}

export const db_connection = async () => {
 
  if (cached.conn) {
    console.log(' DB reusing existing connection');
    return cached.conn;
  }

  
  if (!cached.promise) {
    const Connection_URL = process.env.MONGO_URL;

    if (!Connection_URL) {
      throw new Error('MONGO_URL environment variable is not set');
    }

    cached.promise = mongoose
      .connect(Connection_URL, {
       
        maxPoolSize: 10,         
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
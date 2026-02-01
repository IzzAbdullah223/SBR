import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const Connection_URL = process.env.MONGO_URL;

export const db_connection = async () => {
  try {
    await mongoose.connect(Connection_URL);
    console.log(' DB is connected successfully');
  } catch (error) {
    console.log('Connection error:', error.message);
  }
};
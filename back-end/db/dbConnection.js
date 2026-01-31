import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const Connection_URL= process.env.MONGODB_URI;

export const db_Connection= async ()=>{
try{
await mongoose.connect(Connection_URL);
console.log('DB is connected successfully');
}
catch(error){
    console.log(`Connection error: ${error}`)

}
}
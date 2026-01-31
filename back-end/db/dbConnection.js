import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const connection_URL= process.env.MONGO_URL;

export const db_connection= async ()=>{
try{
await mongoose.connect(connection_URL);
console.log('DataBase is connected successfully');
}
catch(err){
    console.log(`Connection error: ${err}`)

}
}
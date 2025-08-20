
import mongoose from "mongoose";
import consoleManager from "../utils/consoleManager.js";

const uri=process.env.DATABASE_URI
const dbConnection= async()=>{

  try {
   await mongoose.connect(process.env.DATABASE_URI)
    consoleManager.log("data base connected");
    
} catch (error) {
   consoleManager.log(uri);
    
    throw new Error("data base not connected");
    
}
}
export default dbConnection


import mongoose from "mongoose";

const uri=process.env.DATABASE_URI
const dbConnection= async()=>{

  try {
   await mongoose.connect(process.env.DATABASE_URI)
    console.log("data base connected");
    
} catch (error) {
   console.log(uri);
    
    throw new Error("data base not connected");
    
}
}
export default dbConnection

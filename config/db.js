import mongoose from "mongoose";


import ConsoleManager from "../utils/consoleManager.js";
import dotenv from "dotenv";

dotenv.config();


const connectDatabase = async () => {
  if (!process.env.DATABASE_URI) {
    ConsoleManager.error('Error: DATABASE_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.DATABASE_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // optional: increase timeout if needed
    });

    ConsoleManager.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    ConsoleManager.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDatabase;
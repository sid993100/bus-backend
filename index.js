import dotenv from"dotenv"
import express from "express";
import cookieParser from "cookie-parser"
import cors from "cors"
import dbConnection from "./config/db.js";
import authRoutes from  "./routes/authRoutes.js"
import adminRoutes from "./routes/adminRoute.js";
import userRoutes from "./routes/userRoutes.js"
import rbac from "./routes/RBACRoute.js";

dotenv.config()
const app=express()
const port = process.env.PORT

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
  }))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use("/api/auth",authRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/user",userRoutes);
app.use("/api/rbac",rbac)
// app.use("/api/share",linkRouter);



app.listen(port,()=>{
console.log(`Server Running On Port ${port}`);
dbConnection()
})
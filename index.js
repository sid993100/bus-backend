import dotenv from"dotenv"
import express from "express";
import cookieParser from "cookie-parser"
import cors from "cors"
import dbConnection from "./config/db.js";
import authRoutes from  "./routes/authRoutes.js"
import adminRoutes from "./routes/adminRoute.js";
import userRoutes from "./routes/userRoutes.js"
import rbac from "./routes/RBACRoute.js";
import incident from "./routes/incident/incidentRoute.js"
import master from "./routes/master/master.js"
import userManegementRoute from "./routes/userManagement/userManagementRoute.js";
import operationRoute from "./routes/operation/operationRoute.js";
import {app,server} from "./tracking-Services/tracking.js"


dotenv.config()

const port = process.env.PORT||3001

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
app.use("/api/incident",incident)
app.use("/api/master",master)
app.use("/api/usermanagement",userManegementRoute)
app.use("/api/operation",operationRoute);
// app.use("/api/track",linkRouter);



server.listen(port,()=>{
console.log(`Server Running On Port ${port}`);
dbConnection()
})
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

dotenv.config()
const app=express()
const port = process.env.PORT

app.use(cors({
  origin: ["http://localhost:3000", "http://31.97.235.221:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.options("*", cors());
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
// app.use("/api/share",linkRouter);



app.listen(port,()=>{
console.log(`Server Running On Port ${port}`);
dbConnection()
})

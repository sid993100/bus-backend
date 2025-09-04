import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dbConnection from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoute.js";
import userRoutes from "./routes/userRoutes.js";
import rbac from "./routes/RBACRoute.js";
import incident from "./routes/incident/incidentRoute.js";
import master from "./routes/master/master.js";
import userManegementRoute from "./routes/userManagement/userManagementRoute.js";
import operationRoute from "./routes/operation/operationRoute.js";
import { app, server } from "./tracking-Services/tracking.js";
import consoleManager from "./utils/consoleManager.js";
import trackingRoutes from "./routes/tracking/trackingRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js"

dotenv.config();

dbConnection();

const port = process.env.PORT || 5000;

// ✅ Add Welcome Route First
app.get("/", (req, res) => {
  res.send("Welcome to API server of Bus Track Application");
});

const allowedOrigins = [
  "http://localhost:3000",
  "http://31.97.235.221:3000"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Your API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/rbac", rbac);
app.use("/api/incident", incident);
app.use("/api/master", master);
app.use("/api/usermanagement", userManegementRoute);
app.use("/api/operation", operationRoute);
app.use("/api/tracking", trackingRoutes); 
app.use("/api/dashboard", dashboardRoutes); 

// ✅ Start Server
server.listen(port, () => {
  consoleManager.log(`Server Running On Port ${port}`);
});

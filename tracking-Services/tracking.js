import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { Kafka } from "kafkajs";
import consoleManager from "../utils/consoleManager.js";
import net from "net";
import BharatDeviceParser from "../utils/BharatDeviceParser.js";
import axios from "axios";

dotenv.config();

const vehicles = [];
let sockitId;
const axiosApi = process.env.MY_AXIOS_URL || "http://localhost:5000";
const parser = new BharatDeviceParser();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  },
});
consoleManager.log("socket.io server running on port 5000");

const KAFKA_BROKER = process.env.KAFKA_BROKER;
const BHARAT_TCP_PORT = process.env.TCP_PORT || 5055;
const ACUTE_TCP_PORT = process.env.TCP_PORT || 5056;

// Kafka setup
const kafka = new Kafka({
  clientId: "tracking-service",
  brokers: [KAFKA_BROKER],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "tracking-consumers" });

// Middleware
// app.use(cors())
app.use(express.json());

// Connect Kafka Producer & Consumer
async function connectKafka() {
  await producer.connect();
  await consumer.connect();

  await consumer.subscribe({ topic: "busTrack", fromBeginning: false });
  await consumer.subscribe({ topic: "acuteBusTrack", fromBeginning: false });
  await consumer.subscribe({ topic: "bharatBusTrack", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = message.value.toString();

      // Parse the data
      const parsed = await parser.parseDeviceData(data);
      if (!parsed) {
        consoleManager.log("⚠️ Could not parse GPS data:", parsed);
        return;
      }

      const timestamp = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });

      console.log(
        `[${timestamp}] Received message from topic ${topic}:`,
        parsed
      );

      // Fix: Send to correct endpoint with raw_data included
      try {
        if (parsed.packet_type === "tracking") {
          await axios.post(`${axiosApi}/api/tracking/track`, { data: parsed });
          consoleManager.log("✅ Data saved to API successfully");
        } else if (parsed.packet_type === "login") {
          await axios.post(`${axiosApi}/api/tracking/login`, { data: parsed });
          consoleManager.log("✅ Login Data saved to API successfully");
        } else if (parsed.packet_type === "health") {
          await axios.post(`${axiosApi}/api/tracking/health`, { data: parsed });
          consoleManager.log("✅ Health Data saved to API successfully");
        } else if (parsed.packet_type === "emergency") {
          await axios.post(`${axiosApi}/api/tracking/emergency`, {
            data: parsed,
          });
          consoleManager.log("✅ Emergency Data saved to API successfully");
        }
      } catch (error) {
        console.error("❌ Failed to save to API:", error.message);
      }

      // Emit to WebSocket
      if (topic === "bharatBusTrack") {
        if (!vehicles.some((v) => v.imei === parsed.imei)) {
          vehicles.push({ ...parsed });
        }
        io.emit("track", parsed);
      } else if (topic === "acuteBusTrack") {
        io.emit("track", parsed);
      }
    },
  });
}

connectKafka().catch(console.error);

// WebSocket events
io.on("connection", (socket) => {
  sockitId = socket.id;

  socket.on("trackBus", (data) => {
    // socket.join(`bus_${data.id}`)

    if (vehicles.some((v) => v.imei === data.id)) {
      socket.to(socket.id).emit("track", data);
    }
  });

  socket.on("stopTracking", (busId) => {
    socket.leave(`bus_${busId}`);
    consoleManager.log(`Client ${socket.id} stopped tracking bus ${busId}`);
  });

  socket.on("disconnect", () => {
    consoleManager.log("Client disconnected:", socket.id);
  });
});

///////////////////////////bharat-Tcp////////////////////////////////

const bharatTcp = net.createServer((socket) => {
  consoleManager.log("📲 New GPS device connected");

  socket.on("data", async (data) => {
    const raw = data.toString().trim();
    consoleManager.log("📡 Raw GPS Data:", raw);

    // 🔹 Push parsed JSON to Kafka
    try {
      await producer.send({
        topic: "busTrack",
        messages: [{ value: raw }],
      });
      consoleManager.log("🚀 Published parsed data to Kafka");
    } catch (err) {
      console.error("❌ Kafka error:", err);
    }
  });

  socket.on("end", () => consoleManager.log("❌ GPS connection closed"));
  socket.on("error", (err) => console.error("⚠️ GPS socket error:", err));
});

bharatTcp.listen(BHARAT_TCP_PORT, () => {
  consoleManager.log(`🚀 GPS TCP server listening on port ${BHARAT_TCP_PORT}`);
});

///////////////////////////////////////////////////////////

////////////////////////////acute-Tcp////////////////////////////////

const acuteTcp = net.createServer((socket) => {
  consoleManager.log("📲 New GPS device connected");

  socket.on("data", async (data) => {
    const raw = data.toString().trim();
    consoleManager.log("📡 Raw GPS Data:", raw);

    try {
      await producer.send({
        topic: "busTrack",
        messages: [{ value: raw }],
      });
      consoleManager.log("🚀 Published parsed data to Kafka");
    } catch (err) {
      console.error("❌ Kafka error:", err);
    }
  });

  socket.on("end", () => consoleManager.log("❌ GPS connection closed"));
  socket.on("error", (err) => console.error("⚠️ GPS socket error:", err));
});

acuteTcp.listen(ACUTE_TCP_PORT, () => {
  consoleManager.log(`🚀 GPS TCP server listening on port ${ACUTE_TCP_PORT}`);
});

///////////////////////////////////////////////////////////

export { app, server };

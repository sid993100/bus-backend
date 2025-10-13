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
const BHARAT_TCP_PORT = process.env.BHARAT_TCP_PORT || 5055;
const ACUTE_TCP_PORT = process.env.ACUTE_TCP_PORT || 5056;

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

      // Fix: Send to correct endpoint with raw_data included
      try {
        if (parsed.packet_type === "tracking") {
          if(parsed.latitude===0 || parsed.longitude===0){
            return;
          }
          await axios.post(`${axiosApi}/api/tracking/track`, { data: parsed });
          await axios.post(`${axiosApi}/api/tracking/event`, { vehicleNo: parsed.vehicle_reg_no, imei: parsed.imei,eventNumber:parsed.message_id, dateAndTime: parsed.timestamp, latitude: parsed.latitude, longitude: parsed.longitude,vendor_id:parsed.vendor_id });
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
        if(parsed.latitude===0 || parsed.longitude===0){
            return;
          }
         if (parsed.packet_status==="L") {
           io.to(`bus_${parsed.vehicle_reg_no}`).emit("track",parsed)
         }
      } else if (topic === "acuteBusTrack") {
        if (parsed.packet_status==="L") {
           io.to(`bus_${parsed.vehicle_reg_no}`).emit("track",parsed)
         }
      }
    },
  });
}

connectKafka().catch(console.error);

// WebSocket events
io.on("connection", async (socket) => {

  socket.on("trackBus", async (busIdOrReg) => {
    try {
       const room = `bus_${busIdOrReg}`;
    socket.join(room);
    socket.emit("join", busIdOrReg);
      
      const res = await axios.get(`${axiosApi}/api/tracking/tracking/${busIdOrReg.trim()}`);
      if (res?.data?.success && res?.data?.data) {
        res.data.data.new=true; // mark as new data
        socket.emit("track", res.data.data);
      }
    } catch (e) {
      consoleManager.log("prefetch error",  e.message);
    }

    // confirm to requester only
  });

  socket.on("stopTracking", (busIdOrReg) => {
    const room = `bus_${busIdOrReg}`;
    socket.leave(room);
    socket.emit("stopped", { message: `Stopped tracking bus ${busIdOrReg}` });
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
        topic: "bharatBusTrack",
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
        topic: "acuteBusTrack",
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

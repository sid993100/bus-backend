
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { Kafka } from "kafkajs";
import net from "net";
import axios from "axios";
import BharatDeviceParser from "../utils/BharatDeviceParser.js"

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
// Note: Server will be started separately if needed
// console.log("socket.io server running on port 5000");

const KAFKA_BROKER = process.env.KAFKA_BROKER;
const TCP_PORT = process.env.TCP_PORT || 5055;

// Validate required environment variables
if (!KAFKA_BROKER) {
  console.error("❌ KAFKA_BROKER environment variable is not set!");
  process.exit(1);
}


// Kafka setup
const kafka = new Kafka({
  clientId: "tracking-service",
  brokers: [KAFKA_BROKER],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "tracking-consumers" });


app.use(express.json());

async function connectKafka() {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: "BusTrack", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = message.value.toString();

      const parsed = await parser.parseDeviceData(data);
      if (!parsed) {
        console.log("Could not parse GPS data:", parsed);
        return;
      }

      try {
        if (parsed.packet_type === "tracking") {
          await axios.post(`${axiosApi}/api/tracking/track`, { data: parsed });

          try {
            await axios.post(`${axiosApi}/api/incidenthandling`, {
              vehicle: parsed.vehicle_reg_no,
              messageid: parsed.message_id,
              long: parsed.longitude,
              lat: parsed.latitude
            });
          } catch (incidentError) {
            console.error("❌ Failed to save incident handling data:", incidentError.message);
          }
          
          console.log("✅ Data saved to API successfully");
        } else if (parsed.packet_type === "login") {
          await axios.post(`${axiosApi}/api/tracking/login`, { data: parsed });
          console.log("✅ Login Data saved to API successfully");
        } else if (parsed.packet_type === "health") {
          await axios.post(`${axiosApi}/api/tracking/health`, { data: parsed });
          console.log("✅ Health Data saved to API successfully");
        } else if (parsed.packet_type === "emergency") {
          await axios.post(`${axiosApi}/api/tracking/emergency`, {
            data: parsed,
          });
          console.log("✅ Emergency Data saved to API successfully");
        }
      } catch (error) {
        console.error("❌ Failed to save to API:", error.message);
      }

      // Emit socket event if packet status is "L" (Live/Location)
      try {
        if (parsed.packet_status === "L" && parsed.vehicle_reg_no) {
          io.to(`bus_${parsed.vehicle_reg_no}`).emit("track", parsed);
        }
      } catch (socketError) {
        console.error("❌ Failed to emit socket event:", socketError.message);
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
      console.log("prefetch error",  e.message);
    }

    // confirm to requester only
  });

  socket.on("stopTracking", (busIdOrReg) => {
    const room = `bus_${busIdOrReg}`;
    socket.leave(room);
    socket.emit("stopped", { message: `Stopped tracking bus ${busIdOrReg}` });
    console.log(`Client ${socket.id} stopped tracking ${busIdOrReg}`);
  });
});


///////////////////////////Tcp////////////////////////////////

const bharatTcp = net.createServer((socket) => {
  console.log("📲 New GPS device connected");

  socket.on("data", async (data) => {
    const raw = data.toString().trim();
    console.log("📡 Raw GPS Data:", raw);

    // 🔹 Push parsed JSON to Kafka
    try {
      await producer.send({
        topic: "BusTrack",
        messages: [{ value: raw }],
      });
      console.log("🚀 Published parsed data to Kafka");
    } catch (err) {
      console.error("❌ Kafka error:", err);
    }
  });

  socket.on("end", () => console.log("❌ GPS connection closed"));
  socket.on("error", (err) => console.error("⚠️ GPS socket error:", err));
});

bharatTcp.listen(TCP_PORT, () => {
  console.log(`🚀 GPS TCP server listening on port ${TCP_PORT}`);
});

///////////////////////////////////////////////////////////

export { app, server };

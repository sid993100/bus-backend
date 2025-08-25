import dotenv from "dotenv";
import express from "express"
import http from "http"
import {Server} from "socket.io"
import { Kafka } from "kafkajs"
import consoleManager from "../utils/consoleManager.js"
import net from "net"; 
import BharatDeviceParser from "../utils/BharatDeviceParser.js";





dotenv.config();

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  },
})
consoleManager.log("socket.io server running on port 5000");


const KAFKA_BROKER = process.env.KAFKA_BROKER 
const BHARAT_TCP_PORT = process.env.TCP_PORT || 5055;
const ACUTE_TCP_PORT = process.env.TCP_PORT || 5056;

// Kafka setup
const kafka = new Kafka({
  clientId: "tracking-service",
  brokers: [KAFKA_BROKER],
})

const producer = kafka.producer()
const consumer = kafka.consumer({ groupId: "tracking-consumers" })

// Middleware
// app.use(cors())
app.use(express.json())

// Connect Kafka Producer & Consumer
async function connectKafka() {
  await producer.connect();
  await consumer.connect();

  await consumer.subscribe({ topic: "busTrack", fromBeginning: false });
  await consumer.subscribe({ topic: "test", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = message.value.toString();

      // Convert UTC → IST (Asia/Kolkata)
      const timestamp = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata"
      });

      console.log(`[${timestamp}] Received message from topic ${topic}:`, data);

      if (topic === "bharatBusTrack") {
        io.emit("track", data)
       
        
      } else if (topic === "acuteBusTrack") {
        io.emit("track", data)
        
      }
    },
  });
}




connectKafka().catch(console.error)

// WebSocket events
io.on("connection", (socket) => {
  consoleManager.log("Client connected:", socket.id)

  socket.on("trackBus", (busId) => {
    socket.join(`bus_${busId}`)
    consoleManager.log(`Client ${socket.id} tracking bus ${busId}`)
  })

  socket.on("stopTracking", (busId) => {
    socket.leave(`bus_${busId}`)
    consoleManager.log(`Client ${socket.id} stopped tracking bus ${busId}`)
  })

  socket.on("disconnect", () => {
    consoleManager.log("Client disconnected:", socket.id)
  })
})


///////////////////////////bharat-Tcp////////////////////////////////



const parser = new BharatDeviceParser();

const bharatTcp = net.createServer((socket) => {
  consoleManager.log("📲 New GPS device connected");

  socket.on("data", async (data) => {
    const raw = data.toString().trim();
    consoleManager.log("📡 Raw GPS Data:", raw);

    // 🔹 Parse
    const parsed = parser.parseDeviceData(raw);
    if (!parsed) {
      consoleManager.log("⚠️ Could not parse GPS data:", raw);
      return;
    }

    consoleManager.log("✅ Parsed GPS Data:", parsed);

    // 🔹 Push parsed JSON to Kafka
    try {
      await producer.send({
        topic: "busTrack",
        messages: [{ value: JSON.stringify(parsed) }],
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
        messages: [{ value: JSON.stringify(raw) }],
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



export { app,server} 

import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { Kafka } from "kafkajs";
import net from "net";
import BharatDeviceParser from "../utils/BharatDeviceParser.js";
import axios from "axios";

dotenv.config();

const axiosApi = process.env.MY_AXIOS_URL || "http://localhost:5000";
const parser = new BharatDeviceParser();
const lastIncidentPackets = new Map();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  },
});
console.log("[TrackingService] socket.io server running on port 5000");
console.log(`[TrackingService] axios base URL -> ${axiosApi}`);

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
  console.log("[TrackingService] Connecting Kafka producer/consumer", {
    broker: KAFKA_BROKER,
  });
  await producer.connect();
  console.log("[TrackingService] Kafka producer connected");
  await consumer.connect();
  console.log("[TrackingService] Kafka consumer connected");

  await consumer.subscribe({ topic: "busTrack", fromBeginning: false });
  await consumer.subscribe({ topic: "acuteBusTrack", fromBeginning: false });
  await consumer.subscribe({ topic: "bharatBusTrack", fromBeginning: false });
  console.log("[TrackingService] Kafka topics subscribed", {
    topics: ["busTrack", "acuteBusTrack", "bharatBusTrack"],
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = message.value.toString();
      console.log("[TrackingService] Kafka message received", {
        topic,
        size: data.length,
      });

      // Parse the data
      const parsed = await parser.parseDeviceData(data);
      if (!parsed) {
        console.warn("[TrackingService] ⚠️ Could not parse GPS data", { raw: data });
        return;
      }
      console.log("[TrackingService] Parsed packet", {
        vehicle: parsed.vehicle_reg_no,
        imei: parsed.imei,
        packetType: parsed.packet_type,
        packetStatus: parsed.packet_status,
      });

      try {
        if (parsed.packet_type === "tracking") {
          console.log("[TrackingService] ➡️ Posting tracking packet", {
            vehicle: parsed.vehicle_reg_no,
            imei: parsed.imei,
            timestamp: parsed.dateAndTime,
            axiosApi,
          });
          await axios.post(`${axiosApi}/api/tracking/track`, { data: parsed });
          const incidentKey = `${parsed.vehicle_reg_no}-${parsed.message_id}-${parsed.dateAndTime}`;
          if (lastIncidentPackets.get(parsed.vehicle_reg_no) !== incidentKey) {
            console.log("[TrackingService] ➡️ Posting incident packet", {
              vehicle: parsed.vehicle_reg_no,
              message: parsed.message_id,
              axiosApi,
            });
            try {
              await axios.post(`${axiosApi}/api/incidenthandling`, {
                vehicle: parsed.vehicle_reg_no,
                messageid: parsed.message_id,
                long: parsed.longitude,
                lat: parsed.latitude,
              });
              lastIncidentPackets.set(parsed.vehicle_reg_no, incidentKey);
            } catch (incidentError) {
              if (incidentError.response?.status === 404) {
                console.log("[TrackingService] ℹ️ Incident skipped (404)", {
                  vehicle: parsed.vehicle_reg_no,
                  message: incidentError.response?.data?.message,
                });
                lastIncidentPackets.set(parsed.vehicle_reg_no, incidentKey);
              } else {
                throw incidentError;
              }
            }
          } else {
            console.log("[TrackingService] ⏭️ Skipped duplicate incident", {
              vehicle: parsed.vehicle_reg_no,
              incidentKey,
            });
          }
          const eventPayload = {
            vehicleNo: parsed.vehicle_reg_no,
            eventName: parsed.message_id,
            longitude: parsed.longitude,
            latitude: parsed.latitude,
            imei: parsed.imei,
            vendor_id: parsed.vendor_id,
            dateAndTime: parsed.dateAndTime,
          };
          const hasAllEventFields = Object.values(eventPayload).every(
            (value) => value !== undefined && value !== null && value !== ""
          );
          if (hasAllEventFields) {
            console.log("[TrackingService] ➡️ Posting tracking event", {
              vehicle: parsed.vehicle_reg_no,
              message: parsed.message_id,
              axiosApi,
            });
            try {
              await axios.post(`${axiosApi}/api/tracking/event`, eventPayload);
              console.log("[TrackingService] ✅ Tracking event saved");
            } catch (eventError) {
              if (eventError.response?.status === 400) {
                console.log("[TrackingService] ℹ️ Event skipped (400)", {
                  vehicle: parsed.vehicle_reg_no,
                  message: eventError.response?.data?.message,
                });
              } else {
                throw eventError;
              }
            }
          } else {
            console.log("[TrackingService] ℹ️ Event skipped (missing fields)", {
              vehicle: parsed.vehicle_reg_no,
              missingFields: Object.entries(eventPayload)
                .filter(([_, value]) => value === undefined || value === null || value === "")
                .map(([key]) => key),
            });
          }
          console.log("[TrackingService] ✅ Tracking data pipeline complete", {
            vehicle: parsed.vehicle_reg_no,
            message: parsed.message_id,
          });
        } else if (parsed.packet_type === "login") {
          console.log("[TrackingService] ➡️ Posting login packet", {
            vehicle: parsed.vehicle_reg_no,
            imei: parsed.imei,
            axiosApi,
          });
          await axios.post(`${axiosApi}/api/tracking/login`, { data: parsed });
          console.log("[TrackingService] ✅ Login data saved");
        } else if (parsed.packet_type === "health") {
          console.log("[TrackingService] ➡️ Posting health packet", {
            vehicle: parsed.vehicle_reg_no,
            imei: parsed.imei,
            axiosApi,
          });
          await axios.post(`${axiosApi}/api/tracking/health`, { data: parsed });
          console.log("[TrackingService] ✅ Health data saved");
        } else if (parsed.packet_type === "emergency") {
          console.log("[TrackingService] ➡️ Posting emergency packet", {
            vehicle: parsed.vehicle_reg_no,
            imei: parsed.imei,
            axiosApi,
          });
          await axios.post(`${axiosApi}/api/tracking/emergency`, {
            data: parsed,
          });
          console.log("[TrackingService] ✅ Emergency data saved");
        }
      } catch (error) {
        console.error("[TrackingService] ❌ Failed to save to API", {
          message: error.message,
          stack: error.stack,
          endpoint: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
        });
      }

      // Emit to WebSocket
      if (topic === "bharatBusTrack") {
         if (parsed.packet_status==="L") {
           io.to(`bus_${parsed.vehicle_reg_no}`).emit("track",parsed)
           console.log("[TrackingService] 📡 Emitted bharat tracking update", {
             vehicle: parsed.vehicle_reg_no,
           });
         }
      } else if (topic === "acuteBusTrack") {
        if (parsed.packet_status==="L") {
           io.to(`bus_${parsed.vehicle_reg_no}`).emit("track",parsed)
           console.log("[TrackingService] 📡 Emitted acute tracking update", {
             vehicle: parsed.vehicle_reg_no,
           });
         }
      }
    },
  });
}

connectKafka().catch(console.error);

// WebSocket events
io.on("connection", async (socket) => {
  console.log("[TrackingService] 🔌 WebSocket client connected", {
    socketId: socket.id,
  });

  socket.on("trackBus", async (busIdOrReg) => {
    try {
       const room = `bus_${busIdOrReg}`;
       
    socket.join(room);
    socket.emit("join", busIdOrReg);
    console.log("[TrackingService] 👥 Client joined room", {
      socketId: socket.id,
      room,
    });
      
      const trackingUrl = `${axiosApi}/api/tracking/tracking/${busIdOrReg.trim()}`;
      console.log("[TrackingService] ➡️ Prefetch latest tracking", {
        busIdOrReg,
        trackingUrl,
      });
      const res = await axios.get(trackingUrl);
      if (res?.data?.success && res?.data?.data) {
        res.data.data.new=true; // mark as new data
        socket.emit("track", res.data.data);
        console.log("[TrackingService] 📦 Prefetch data emitted", {
          busIdOrReg,
        });
      }
    } catch (e) {
      console.error("[TrackingService] Prefetch error", {
        message: e.message,
        stack: e.stack,
      });
    }

    // confirm to requester only
  });

  socket.on("stopTracking", (busIdOrReg) => {
    const room = `bus_${busIdOrReg}`;
    socket.leave(room);
    socket.emit("stopped", { message: `Stopped tracking bus ${busIdOrReg}` });
    console.log("[TrackingService] ⏹️ Client stopped tracking", {
      socketId: socket.id,
      busIdOrReg,
    });
  });

  socket.on("disconnect", (reason) => {
    console.log("[TrackingService] 🔌 WebSocket client disconnected", {
      socketId: socket.id,
      reason,
    });
  });
});


///////////////////////////bharat-Tcp////////////////////////////////

const bharatTcp = net.createServer((socket) => {
  console.log("[TrackingService] 📲 Bharat device connected", {
    remoteAddress: socket.remoteAddress,
    remotePort: socket.remotePort,
  });

  socket.on("data", async (data) => {
    const raw = data.toString().trim();
    console.log("[TrackingService] 📡 Bharat raw GPS data", { raw });

    // 🔹 Push parsed JSON to Kafka
    try {
      await producer.send({
        topic: "bharatBusTrack",
        messages: [{ value: raw }],
      });
      console.log("[TrackingService] 🚀 Bharat data published to Kafka");
    } catch (err) {
      console.error("[TrackingService] ❌ Bharat Kafka error", {
        message: err.message,
        stack: err.stack,
      });
    }
  });

  socket.on("end", () => console.log("[TrackingService] ❌ Bharat GPS connection closed"));
  socket.on("error", (err) =>
    console.error("[TrackingService] ⚠️ Bharat GPS socket error", {
      message: err.message,
      stack: err.stack,
    })
  );
});

bharatTcp.listen(BHARAT_TCP_PORT, () => {
  console.log(`[TrackingService] 🚀 Bharat GPS TCP server listening on port ${BHARAT_TCP_PORT}`);
});

///////////////////////////////////////////////////////////

////////////////////////////acute-Tcp////////////////////////////////

const acuteTcp = net.createServer((socket) => {
  console.log("[TrackingService] 📲 Acute device connected", {
    remoteAddress: socket.remoteAddress,
    remotePort: socket.remotePort,
  });

  socket.on("data", async (data) => {
    const raw = data.toString().trim();
    console.log("[TrackingService] 📡 Acute raw GPS data", { raw });

    try {
      await producer.send({
        topic: "acuteBusTrack",
        messages: [{ value: raw }],
      });
      console.log("[TrackingService] 🚀 Acute data published to Kafka");
    } catch (err) {
      console.error("[TrackingService] ❌ Acute Kafka error", {
        message: err.message,
        stack: err.stack,
      });
    }
  });

  socket.on("end", () => console.log("[TrackingService] ❌ Acute GPS connection closed"));
  socket.on("error", (err) =>
    console.error("[TrackingService] ⚠️ Acute GPS socket error", {
      message: err.message,
      stack: err.stack,
    })
  );
});

acuteTcp.listen(ACUTE_TCP_PORT, () => {
  console.log(`[TrackingService] 🚀 Acute GPS TCP server listening on port ${ACUTE_TCP_PORT}`);
});

///////////////////////////////////////////////////////////

export { app, server };

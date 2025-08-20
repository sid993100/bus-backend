import express from "express"
import http from "http"
import {Server} from "socket.io"
import cors from "cors"
import axios from "axios"
import { Kafka } from "kafkajs"
import consoleManager from "../utils/consoleManager.js"

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  },
})
console.log("socket.io server running on port 3001");

const DATABASE_SERVICE_URL = process.env.DATABASE_SERVICE_URL || "http://localhost:4000"
const KAFKA_BROKER = process.env.KAFKA_BROKER || "localhost:9092"

// Kafka setup
const kafka = new Kafka({
  clientId: "tracking-service",
  brokers: [KAFKA_BROKER],
})

const producer = kafka.producer()
const consumer = kafka.consumer({ groupId: "tracking-consumers" })

// Middleware
app.use(cors())
app.use(express.json())

// Connect Kafka Producer & Consumer
async function connectKafka() {
  await producer.connect()
  await consumer.connect()

  // Subscribe to topics
  await consumer.subscribe({ topic: "busTrack", fromBeginning: true })
  await consumer.subscribe({ topic: "test", fromBeginning: true })

  // Handle incoming Kafka messages
  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      // const data = JSON.parse(message.value.toString())
      const data=message.value.toString();
consoleManager.log(`Received message from topic ${topic}:`, data);

      if (topic === "busTrack") {
        io.emit("locationUpdate", data)
        console.log("log ",data);
        
      } else if (topic === "test") {
        io.emit("busAlert", data)
        console.log("log ",data);
      }
    },
  })
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
    console.log("Client disconnected:", socket.id)
  })
})


// API endpoint to update location
app.post("/api/tracking/update", async (req, res) => {
  try {
    const { busId, location, speed, heading, nextStop, eta, delay } = req.body

    // Save to DB service
    await axios.post(`${DATABASE_SERVICE_URL}/api/track`, {
      busId,
      location,
      speed,
      heading,
      nextStop,
      eta,
      delay,
    })

    const updateData = {
      busId,
      location,
      speed,
      heading,
      nextStop,
      eta,
      delay,
      timestamp: new Date(),
    }

    // Publish to Kafka topic
    await producer.send({
      topic: "busTrack",
      messages: [{ value: JSON.stringify(updateData) }],
    })

    // Emit to specific bus room
    io.to(`bus_${busId}`).emit("locationUpdate", updateData)

    res.json({ success: true, message: "Location updated successfully" })
  } catch (error) {
    console.error("Error updating location:", error)
    res.status(500).json({ error: "Failed to update location" })
  }
})

// API endpoint to send alerts
app.post("/api/tracking/alert", async (req, res) => {
  try {
    const { busId, type, message, severity } = req.body

    const alertData = {
      busId,
      type,
      message,
      severity,
      timestamp: new Date(),
    }

    // Publish to Kafka
    await producer.send({
      topic: "busAlerts",
      // messages: [{ value: JSON.stringify(alertData) }],
    })

    io.emit("busAlert", alertData)

    res.json({ success: true, message: "Alert sent successfully" })
  } catch (error) {
    console.error("Error sending alert:", error)
    res.status(500).json({ error: "Failed to send alert" })
  }
})

// Simulate GPS updates
app.post("/api/tracking/simulate/:busId", async (req, res) => {
  try {
    const { busId } = req.params
    const { routeId } = req.body

    const routeResponse = await axios.get(`${DATABASE_SERVICE_URL}/api/routes/${routeId}`)
    const route = routeResponse.data

    if (!route?.stops?.length) {
      return res.status(400).json({ error: "Invalid route data" })
    }

    let currentStopIndex = 0
    const stops = route.stops

    const simulateMovement = async () => {
      if (currentStopIndex >= stops.length) currentStopIndex = 0

      const currentStop = stops[currentStopIndex]
      const nextStop = stops[currentStopIndex + 1] || stops[0]

      const lat = currentStop.location.latitude + (Math.random() - 0.5) * 0.001
      const lng = currentStop.location.longitude + (Math.random() - 0.5) * 0.001

      const updateData = {
        busId,
        location: { latitude: lat, longitude: lng },
        speed: Math.floor(Math.random() * 60) + 20,
        heading: Math.floor(Math.random() * 360),
        nextStop: nextStop.name,
        eta: new Date(Date.now() + Math.random() * 600000),
        delay: Math.floor(Math.random() * 10) - 5,
      }

      await axios.post("http://localhost:3001/api/tracking/update", updateData)
      currentStopIndex++
    }

    const simulationInterval = setInterval(simulateMovement, 5000)
    global.simulations = global.simulations || {}
    global.simulations[busId] = simulationInterval

    res.json({ success: true, message: "Simulation started" })
  } catch (error) {
    console.error("Simulation error:", error)
    res.status(500).json({ error: "Failed to start simulation" })
  }
})

app.post("/api/tracking/simulate/:busId/stop", (req, res) => {
  const { busId } = req.params

  if (global.simulations?.[busId]) {
    clearInterval(global.simulations[busId])
    delete global.simulations[busId]
    res.json({ success: true, message: "Simulation stopped" })
  } else {
    res.status(404).json({ error: "No active simulation found" })
  }
})





export { app,server} 
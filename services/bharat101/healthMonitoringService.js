import HealthMonitoringPacket from "../../models/healthMonitoringPacketModel.js";


// ✅ Get all packets
export const getAllHealthPackets = async (req, res) => {
  try {
    const packets = await HealthMonitoringPacket.find().sort({ createdAt: -1 });
    if (!packets || packets.length === 0) {
      return res.status(404).json({ message: 'No packets found' });}
    res.status(200).json(packets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching packets', error });
  }
};

// ✅ Get packet by ID
export const getHealthPacketById = async (req, res) => {
    if (!req.params.id) {
        return res.status(400).json({ message: 'Packet ID is required' });
    }
  try {
    const packet = await HealthMonitoringPacket.findById(req.params.id);
    if (!packet) {
      return res.status(404).json({ message: 'Packet not found' });
    }
    res.status(200).json(packet);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching packet', error });
  }
};

// ✅ Create new packet
export const addHealthPacket = async (req, res) => {
  try {
    const {data} = req.body;

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Health packet data is required',
        code: 'MISSING_DATA'
      });
    }

    // Create health packet
    const healthPacket = new HealthMonitoringPacket(data);
    const savedPacket = await healthPacket.save();

    // Log health alerts
    if (savedPacket.health_status === 'CRITICAL') {
      console.log(`🚨 CRITICAL HEALTH ALERT: Device ${savedPacket.imei} - Battery: ${savedPacket.battery_percentage}%`);
    } else if (savedPacket.maintenance_alert) {
      console.log(`⚠️ MAINTENANCE ALERT: Device ${savedPacket.imei} requires attention`);
    }

    res.status(201).json({
      success: true,
      message: 'Health packet created successfully',
      data: {
        id: savedPacket._id,
        imei: savedPacket.imei,
        health_status: savedPacket.health_status,
        battery_status: savedPacket.battery_status,
        battery_percentage: savedPacket.battery_percentage,
        memory_status: savedPacket.memory_status,
        server1_memory: savedPacket.server1_memory_percentage,
        server2_memory: savedPacket.server2_memory_percentage,
        maintenance_alert: savedPacket.maintenance_alert,
        timestamp: savedPacket.timestamp
      }
    });

  } catch (error) {
    console.error('❌ Error creating health packet:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to save health packet',
      message: error.message
    });
  }
};



import EmergencyPacket from "../../models/emergencyPacketModel.js";

// CREATE
export const addEmergencyPacket = async (req, res) => {
  try {
    const {data} = req.body;

    // Create emergency packet
    const emergencyPacket = new EmergencyPacket(data);
    const savedPacket = await emergencyPacket.save();

    res.status(201).json({
      success: true,
      message: 'Emergency packet created successfully',
      data: {
        id: savedPacket._id,
        device_id: savedPacket.device_id,
        vehicle_reg_no: savedPacket.vehicle_reg_no,
        location: savedPacket.location,
        emergency_type: savedPacket.emergency_type,
        priority: savedPacket.priority,
        status: savedPacket.status,
        emergency_contact: savedPacket.emergency_contact,
        timestamp: savedPacket.timestamp
      }
    });

  } catch (error) {
    console.error('❌ Error creating emergency packet:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to save emergency packet',
      message: error.message
    });
  }
};


export const getAllEmergencyPackets = async (req, res) => {
  try {
    const rows = await EmergencyPacket.find({})
console.log("................................",rows);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No emergency packets found" });}
    return res.status(200).json({
      message: rows
    });
  } catch (error) {
    console.error("getAllEmergencyPackets error:", error);
    return res.status(500).json({ message: "Backend Error" });
  }
};


// GET BY ID
export const getEmergencyPacketById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: "ID is required" });

    const packet = await EmergencyPacket.findById(id);

    if (!packet) return res.status(404).json({ message: "Emergency packet not found" });

    return res.status(200).json({ message: packet });
  } catch (error) {
    console.error("getEmergencyPacketById error:", error);
    return res.status(500).json({ message: "Backend Error" });
  }
};

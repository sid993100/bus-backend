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
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'Packet data is required' });
    }
  try {
    const newPacket = new HealthMonitoringPacket(req.body);
    const savedPacket = await newPacket.save();
    if (!savedPacket) {
      return res.status(400).json({ message: 'Error saving packet' });
    }
    res.status(201).json(savedPacket);
  } catch (error) {
    res.status(400).json({ message: 'Error creating packet', error });
  }
};

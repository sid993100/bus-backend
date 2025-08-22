
import responseManager from "../../utils/responseManager.js";
import EmergencyPacket from "../../models/emergencyPacketModel.js";

// CREATE
export const addEmergencyPacket = async (req, res) => {
  try {
    

    const required = [
      "header","protocolName","deviceID","packetType","date",
      "gpsValidity","latitude","latitudeDir","longitude","longitudeDir",
      "altitude","speed","distance","provider","vehicleRegNo",
      "replyNumber","checksum"
    ];

    for (const f of required) {
      if (req.body[f] === undefined || req.body[f] === null || req.body[f] === "") {
        return res.status(400).json({ message: `Field '${f}' is required` });
      }
    }

    const payload = {
      startCharacter: req.body.startCharacter || "$",
      header: req.body.header,
      protocolName: req.body.protocolName,
      deviceID: req.body.deviceID,
      packetType: req.body.packetType,
      date: req.body.date,
      gpsValidity: req.body.gpsValidity,
      latitude: req.body.latitude,
      latitudeDir: req.body.latitudeDir,
      longitude: req.body.longitude,
      longitudeDir: req.body.longitudeDir,
      altitude: req.body.altitude,
      speed: req.body.speed,
      distance: req.body.distance,
      provider: req.body.provider,
      vehicleRegNo: req.body.vehicleRegNo,
      replyNumber: req.body.replyNumber,
      checksumSeparator: req.body.checksumSeparator || "*",
      checksum: req.body.checksum,
      emergencyType: req.body.emergencyType || "PANIC",
      priority: req.body.priority || "CRITICAL",
      status: req.body.status || "ACTIVE",
      responseTeam: req.body.responseTeam,
      notes: req.body.notes
    };

    const created = await EmergencyPacket.create(payload);

    return res.status(201).json({
      message: "created",
      data: created
    });
  } catch (error) {
    console.error("createEmergencyPacket error:", error);
    return res.status(500).json({ message: "Server Error" });
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

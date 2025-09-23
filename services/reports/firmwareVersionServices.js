import TrackingPacket from "../../models/trackingPacketModel.js";
import VltDevice from "../../models/vltDeviceModel.js";

export const latestFirmware = async (req, res) => {
  try {
    // Get all latest devices sorted by timestamp
    const devices = await TrackingPacket.find({})
      .sort({ timestamp: -1 })
      .limit(100); // Limit to prevent too much data

    if (!devices || devices.length === 0) {
      return res.status(404).json({ error: "No devices found" });
    }

    // Remove duplicates by IMEI (keep latest)
    const uniqueDevices = [];
    const seenImeis = new Set();

    for (const device of devices) {
      if (!seenImeis.has(device.imei)) {
        seenImeis.add(device.imei);
        uniqueDevices.push(device);
      }
    }

    // Format the data
    const formattedDevices = uniqueDevices.map((device, index) => ({
      serialNo: index + 1,
      imeiNumber: device.imei || "N/A",
      deviceMake: device.vendor_id || "Unknown",
      deviceModel: "TM100",
      mappedVehicle: device.vehicle_reg_no || "N/A",
      lastReportedDateTime: device.timestamp
        ? new Date(device.timestamp)
            .toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })
            .replace(",", "")
        : "N/A",
      firmwareVersion: device.firmware_version || "4GN6065",
    }));

    res.json({
      success: true,
      count: formattedDevices.length,
      data: formattedDevices,
    });
  } catch (error) {
    console.error("Error fetching latest firmware data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch device data",
      message: error.message,
    });
  }
};

export const latestFirmwareByImei = async (req, res) => {
  try {
    const { search } = req.params;
    let query = {};
    if (search) {
      query.$or = [{ imei: search }, { vehicle_reg_no: search }];
    }
    const device = await TrackingPacket.findOne(query).sort({ timestamp: -1 });
    if (!device) {
      return res.status(404).json({ error: "No device found" });
    }
    res.json({
      serialNo: 1,
      imeiNumber: device.imei,
      deviceMake: device.vendor_id,
      deviceModel: "TM100",
      mappedVehicle: device.vehicle_reg_no,
      lastReportedDateTime: new Date(device.timestamp)
        .toLocaleString("en-IN")
        .replace(",", ""),
      firmwareVersion: device.firmware_version || "4GN6065",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

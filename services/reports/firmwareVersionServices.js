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

    // Build IMEI -> deviceModel map by querying VltDevice
    const imeis = uniqueDevices.map(d => d.imei).filter(Boolean);
    const imeiNums = imeis.map(i => {
      const n = Number(i);
      return Number.isNaN(n) ? null : n;
    }).filter(Boolean);

    let imeiToModel = {};
    if (imeiNums.length > 0) {
      try {
        const vltDevices = await VltDevice.find({ imeiNumber: { $in: imeiNums } }).populate('vlt', 'modelName').lean();
        for (const vd of vltDevices) {
          if (vd && vd.imeiNumber) {
            imeiToModel[String(vd.imeiNumber)] = vd.vlt && vd.vlt.modelName ? vd.vlt.modelName : null;
          }
        }
      } catch (lookupErr) {
        console.warn('Failed to lookup VltDevice models for IMEIs', lookupErr && lookupErr.message);
      }
    }

    // Format the data
    const formattedDevices = uniqueDevices.map((device, index) => {
      const imeiKey = device.imei ? String(device.imei) : '';
      const modelFromVlt = imeiToModel[imeiKey];
      return {
        serialNo: index + 1,
        imeiNumber: device.imei || "N/A",
        deviceMake: device.vendor_id || "Unknown",
        deviceModel: modelFromVlt || device.vendor_id || "TM100",
        mappedVehicle: device.vehicle_reg_no || "N/A",
        lastReportedDateTime: new Date(device.timestamp).toLocaleString("en-IN").replace(",", ""),
        firmwareVersion: device.firmware_version || "4GN6065",
      };
    });

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
    // try to fetch VltDevice modelName for this IMEI
    let deviceModelName = null;
    try {
      const vltDev = await VltDevice.findOne({ imeiNumber: Number(device.imei) }).populate('vlt', 'modelName').lean();
      if (vltDev && vltDev.vlt && vltDev.vlt.modelName) deviceModelName = vltDev.vlt.modelName;
    } catch (err) {
      console.warn('failed to lookup vlt device for imei', device.imei, err && err.message);
    }

    res.json({
      serialNo: 1,
      imeiNumber: device.imei,
      deviceMake: device.vendor_id,
      deviceModel: deviceModelName || device.vendor_id || "TM100",
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

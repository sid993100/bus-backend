import TrackingPacket from "../../models/trackingPacketModel.js";

export const getVehicleCurrentStatusWithLocation = async (req, res) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;      // default 1
    const limit = parseInt(req.query.limit) || 10;   // default 10
    const skip = (page - 1) * limit;

    const collectionName = TrackingPacket.collection.name;

    // Aggregate: get latest packet per vehicle
    const vehicleStatuses = await TrackingPacket.aggregate([
      { $match: { packet_type: 'tracking', vehicle_reg_no: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$vehicle_reg_no', latestTimestamp: { $max: '$timestamp' } } },
      {
        $lookup: {
          from: collectionName,
          let: { veh: '$_id', ts: '$latestTimestamp' },
          pipeline: [
            { $match: { $expr: { $and: [ { $eq: ['$vehicle_reg_no', '$$veh'] }, { $eq: ['$timestamp', '$$ts'] } ] } } },
            { $limit: 1 }
          ],
          as: 'latestData'
        }
      },
      { $unwind: '$latestData' },
      { $replaceRoot: { newRoot: '$latestData' } },
      { $sort: { vehicle_reg_no: 1 } },
      // Apply pagination at MongoDB level (before large dataset expansion)
      { $skip: skip },
      { $limit: limit }
    ]).allowDiskUse(true);

    // Also get total unique vehicles (for total pages)
    const totalVehicles = await TrackingPacket.aggregate([
      { $match: { packet_type: 'tracking', vehicle_reg_no: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$vehicle_reg_no' } },
      { $count: 'count' }
    ]);
    const total = totalVehicles[0]?.count || 0;

    if (!vehicleStatuses || vehicleStatuses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No vehicle data found",
        data: [],
      });
    }

    // Helper: reverse geocode
    const getAddressFromCoordinates = async (lat, lng) => {
      try {
        if (!lat || !lng || lat === 0 || lng === 0) {
          return "Location not available";
        }

        const response = await fetch(
          `http://nominatim.locationtrack.in/reverse?format=geocodejson&lat=${lat}&lon=${lng}`
        );

        if (!response.ok) throw new Error("Failed to fetch address");

        const data = await response.json();
        return data.features[0]?.properties?.geocoding?.label || "Address not found";
      } catch {
        return "Could not determine location";
      }
    };

    // Map + enrich each record
    const formattedVehicleStatus = await Promise.all(
      vehicleStatuses.map(async (vehicle) => {
        const lastLocation = await getAddressFromCoordinates(vehicle.latitude, vehicle.longitude);

        // Determine status
        let status = "Stopped";
        if (vehicle.ignition && vehicle.main_power && vehicle.speed_kmh > 0) status = "Running";
        else if (vehicle.ignition && vehicle.main_power) status = "Idle";
        else if (!vehicle.main_power) status = "Offline";

        const lastUpdate =  vehicle.createdAt
              .toLocaleString("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })
              .replace(",", "")
          

        return {
          vehicleNumber: vehicle.vehicle_reg_no || "N/A",
          imeiNumber: vehicle.imei || "N/A",
          status,
          batteryStatus: vehicle.main_power ? "Connected" : "Disconnected",
          speed: `${vehicle.speed_kmh || 0} km/h`,
          lastLocation,
          lastUpdate,
          latitude: vehicle.latitude || 0,
          longitude: vehicle.longitude || 0,
          ignition: vehicle.ignition || false,
          mainPower: vehicle.main_power || false,
          emergencyStatus: vehicle.emergency_status || false,
          batteryVoltage: vehicle.battery_voltage || 0,
          gsmSignal: vehicle.gsm_signal || 0,
          satellites: vehicle.satellites || 0,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Vehicle current status retrieved successfully",
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: formattedVehicleStatus.length,
      data: formattedVehicleStatus,
    });
  } catch (error) {
    console.error("Error fetching vehicle current status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle current status",
      error: error.message,
    });
  }
};

export const getVehicleByVehicleNumber = async (req, res) => {
  try {
    const vehicleNumber = (req.params.vehicleNumber || req.query.vehicleNumber || "").toString().trim();
console.log(vehicleNumber);

    if (!vehicleNumber) {
      return res.status(400).json({ success: false, message: "vehicleNumber is required in params or query" });
    }

    const vehicle = await TrackingPacket.findOne(
      { packet_type: "tracking", packet_status: "L", vehicle_reg_no: vehicleNumber },
      {
        vehicle_reg_no: 1,
        imei: 1,
        ignition: 1,
        main_power: 1,
        speed_kmh: 1,
        latitude: 1,
        longitude: 1,
        emergency_status: 1,
        battery_voltage: 1,
        gsm_signal: 1,
        satellites: 1,
        timestamp: 1,
        packet_status: 1,
        updatedAt: 1,
      }
    )
      .sort({ timestamp: -1 })
      .lean();

    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found", data: null });
    }

    const getAddressFromCoordinates = async (lat, lng) => {
      try {
        if (!lat || !lng || lat === 0 || lng === 0) return "Location not available";
        const response = await fetch(
          `http://nominatim.locationtrack.in/reverse?format=geocodejson&lat=${lat}&lon=${lng}`
        );
        if (!response.ok) throw new Error("Failed to fetch address");
        const data = await response.json();
        return data.features?.[0]?.properties?.geocoding?.label || "Address not found";
      } catch (err) {
        console.error("Address fetch error:", err);
        return "Could not determine location";
      }
    };

    const lastLocation = await getAddressFromCoordinates(vehicle.latitude, vehicle.longitude);

    let status = "Stopped";
    if (vehicle.ignition && vehicle.main_power && vehicle.speed_kmh > 0) {
      status = "Running";
    } else if (vehicle.ignition && vehicle.main_power) {
      status = "Idle";
    } else if (!vehicle.main_power) {
      status = "Offline";
    }

    const lastUpdate = vehicle.updatedAt
      ? new Date(vehicle.updatedAt)
          .toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
          .replace(",", "")
      : "N/A";

    const formatted = {
      vehicle_reg_no: vehicle.vehicle_reg_no || "N/A",
      imei: vehicle.imei || "N/A",
      status,
      main_power_status: vehicle.main_power ? "Connected" : "Disconnected",
      speed_kmh: `${vehicle.speed_kmh || 0} km/h`,
      lastLocation,
      lastUpdate,
      latitude: vehicle.latitude || 0,
      longitude: vehicle.longitude || 0,
      ignition: !!vehicle.ignition,
      main_power: !!vehicle.main_power,
      emergency_status: !!vehicle.emergency_status,
      battery_voltage: vehicle.battery_voltage || 0,
      gsm_signal: vehicle.gsm_signal || 0,
      satellites: vehicle.satellites || 0,
      packet_status: vehicle.packet_status || null,
    };

    return res.status(200).json({ success: true, message: "Vehicle retrieved", data: formatted });
  } catch (error) {
    console.error("Error in getVehicleByVehicleNumber:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch vehicle", error: error.message });
  }
};
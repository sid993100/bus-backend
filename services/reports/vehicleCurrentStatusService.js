import TrackingPacket from "../../models/trackingPacketModel.js";

export const getVehicleCurrentStatusWithLocation = async (req, res) => {
  try {
    // Use a group-by + lookup approach to fetch the latest document per vehicle
    // This avoids sorting the entire collection in memory which can exceed the limit.
    const collectionName = TrackingPacket.collection.name; // safe collection name
    const vehicleStatuses = await TrackingPacket.aggregate([
      // only tracking packets with a vehicle registration
      { $match: { packet_type: 'tracking', vehicle_reg_no: { $exists: true, $ne: null, $ne: '' } } },

      // compute latest timestamp per vehicle
      { $group: { _id: '$vehicle_reg_no', latestTimestamp: { $max: '$timestamp' } } },

      // lookup the document that matches vehicle_reg_no + latestTimestamp
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

      // unwind to get the document and replace root
      { $unwind: '$latestData' },
      { $replaceRoot: { newRoot: '$latestData' } },

      // final sort for predictable ordering
      { $sort: { vehicle_reg_no: 1 } }
    ]).allowDiskUse(true);

    if (!vehicleStatuses || vehicleStatuses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No vehicle data found",
        data: [],
      });
    }

    // Function to get address from coordinates
    const getAddressFromCoordinates = async (lat, lng) => {
      try {
        if (!lat || !lng || lat === 0 || lng === 0) {
          return "Location not available";
        }

        const response = await fetch(
          `http://nominatim.locationtrack.in/reverse?format=geocodejson&lat=${lat}&lon=${lng}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch address");
        }

        const data = await response.json();
        return (
          data.features[0]?.properties?.geocoding?.label || "Address not found"
        );
      } catch (error) {
        console.error("Address fetch error:", error);
        return "Could not determine location";
      }
    };

    // Format data with location fetching
    const formattedVehicleStatus = await Promise.all(
      vehicleStatuses.map(async (vehicle) => {
        // Get readable address
        const lastLocation = await getAddressFromCoordinates(
          vehicle.latitude,
          vehicle.longitude
        );

        // Determine status
        let status = "Stopped";
        if (vehicle.ignition && vehicle.main_power && vehicle.speed_kmh > 0) {
          status = "Running";
        } else if (vehicle.ignition && vehicle.main_power) {
          status = "Idle";
        } else if (!vehicle.main_power) {
          status = "Offline";
        }

        // Format last update
        const lastUpdate = vehicle.timestamp
          ? new Date(vehicle.timestamp)
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

        return {
          vehicleNumber: vehicle.vehicle_reg_no || "N/A",
          imeiNumber: vehicle.imei || "N/A",
          status: status,
          batteryStatus: vehicle.main_power ? "Connected" : "Disconnected",
          speed: `${vehicle.speed_kmh || 0} km/h`,
          lastLocation: lastLocation,
          lastUpdate: lastUpdate,
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
    const vehicleNumber = (req.params.vehicleNumber || req.query.vehicleNumber || '').toString().trim();

    if (!vehicleNumber) {
      return res.status(400).json({ success: false, message: 'vehicleNumber is required in params or query' });
    }

    // helper escape to build a safe case-insensitive exact match regex
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escapeRegExp(vehicleNumber)}$`, 'i');

    // Fetch latest tracking packet for this vehicle
    const vehicle = await TrackingPacket.findOne({ packet_type: 'tracking', vehicle_reg_no: regex })
      .sort({ timestamp: -1 })
      .lean();

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found', data: null });
    }

    // resolve address
    const getAddressFromCoordinates = async (lat, lng) => {
      try {
        if (!lat || !lng || lat === 0 || lng === 0) return 'Location not available';
        const response = await fetch(
          `http://nominatim.locationtrack.in/reverse?format=geocodejson&lat=${lat}&lon=${lng}`
        );
        if (!response.ok) throw new Error('Failed to fetch address');
        const data = await response.json();
        return data.features?.[0]?.properties?.geocoding?.label || 'Address not found';
      } catch (err) {
        console.error('Address fetch error:', err);
        return 'Could not determine location';
      }
    };

    const lastLocation = await getAddressFromCoordinates(vehicle.latitude, vehicle.longitude);

    let status = 'Stopped';
    if (vehicle.ignition && vehicle.main_power && vehicle.speed_kmh > 0) {
      status = 'Running';
    } else if (vehicle.ignition && vehicle.main_power) {
      status = 'Idle';
    } else if (!vehicle.main_power) {
      status = 'Offline';
    }

    const lastUpdate = vehicle.timestamp
      ? new Date(vehicle.timestamp)
          .toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })
          .replace(',', '')
      : 'N/A';

    const formatted = {
      vehicle_reg_no: vehicle.vehicle_reg_no || 'N/A',
      imei: vehicle.imei || 'N/A',
      status,
      main_power: vehicle.main_power ? 'Connected' : 'Disconnected',
      speed_kmh: `${vehicle.speed_kmh || 0} km/h`,
      lastLocation,
      lastUpdate,
      latitude: vehicle.latitude || 0,
      longitude: vehicle.longitude || 0,
      ignition: vehicle.ignition || false,
      main_power: vehicle.main_power || false,
      emergency_status: vehicle.emergency_status || false,
      battery_voltage: vehicle.battery_voltage || 0,
      gsm_signal: vehicle.gsm_signal || 0,
      satellites: vehicle.satellites || 0,
    };

    return res.status(200).json({ success: true, message: 'Vehicle retrieved', data: formatted });
  } catch (error) {
    console.error('Error in getVehicleByVehicleNumber:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch vehicle', error: error.message });
  }
};

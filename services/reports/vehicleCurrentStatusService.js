import TrackingPacket from "../../models/trackingPacketModel.js";

export const getVehicleCurrentStatusWithLocation = async (req, res) => {
  try {
    const vehicleStatuses = await TrackingPacket.aggregate([
      {
        $match: {
          packet_type: "tracking",
          vehicle_reg_no: { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: "$vehicle_reg_no",
          latestData: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$latestData" }
      },
      {
        $sort: { vehicle_reg_no: 1 }
      }
    ]);

    if (!vehicleStatuses || vehicleStatuses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No vehicle data found",
        data: []
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
          throw new Error('Failed to fetch address');
        }
        
        const data = await response.json();
        return data.features[0]?.properties?.geocoding?.label || "Address not found";
      } catch (error) {
        console.error('Address fetch error:', error);
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
          ? new Date(vehicle.timestamp).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).replace(',', '')
          : 'N/A';

        return {
          vehicleNumber: vehicle.vehicle_reg_no || 'N/A',
          imeiNumber: vehicle.imei || 'N/A',
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
          satellites: vehicle.satellites || 0
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Vehicle current status retrieved successfully",
      count: formattedVehicleStatus.length,
      data: formattedVehicleStatus
    });

  } catch (error) {
    console.error('Error fetching vehicle current status:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle current status",
      error: error.message
    });
  }
};

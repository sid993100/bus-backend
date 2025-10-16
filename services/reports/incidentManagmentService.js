 import axios from "axios";
import TrackingPacket from "../../models/trackingPacketModel.js";

export const getVehiclesByLocation = async (req, res) => {
  try {
    let { locationName, latitude, longitude, km, direction } = req.query;

    km = parseFloat(km);
    latitude = parseFloat(latitude);
    longitude = parseFloat(longitude);

    if (!km || !direction) {
      return res.status(400).json({
        success: false,
        message: "Both 'km' and 'direction' ('Towards' or 'Beyond') are required.",
      });
    }

    // 1️⃣ Geocode if needed
    if (locationName && (!latitude || !longitude)) {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        locationName
      )}&format=json&limit=1`;

      const { data } = await axios.get(url, {
        headers: { "User-Agent": "VehicleTracker/1.0 (contact@example.com)" },
      });

      if (!data.length) {
        return res.status(404).json({
          success: false,
          message: "Location not found. Please check the name.",
        });
      }

      latitude = parseFloat(data[0].lat);
      longitude = parseFloat(data[0].lon);
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message:
          "Either provide a valid location name or both latitude and longitude.",
      });
    }

    const radiusMeters = km * 1000;

    // 2️⃣ Build $geoNear stage
    const geoNearStage = {
      $geoNear: {
        near: { type: "Point", coordinates: [longitude, latitude] },
        distanceField: "distance", // will be added to docs
        spherical: true,
      },
    };

    // 3️⃣ Add filter depending on direction
    const matchStage =
      direction === "Towards"
        ? { $match: { distance: { $lte: radiusMeters } } }
        : { $match: { distance: { $gt: radiusMeters } } };

    // 4️⃣ Group unique vehicles
    const groupStage = {
      $group: {
        _id: "$vehicle_reg_no",
        imei: { $first: "$imei" },
        lastLocation: { $first: "$location.coordinates" },
        distance: { $first: "$distance" },
        lastUpdated: { $max: "$createdAt" },
        speed_kmh: { $first: "$speed_kmh" },
        main_power: { $first: "$main_power" },
        ignition: { $first: "$ignition" },
      },
    };

    // 5️⃣ Sort by closest first
    const sortStage = { $sort: { distance: 1 } };

    // 6️⃣ Execute pipeline
    const vehicles = await TrackingPacket.aggregate([
      geoNearStage,
      matchStage,
      groupStage,
      sortStage,
    ]);

    res.status(200).json({
      success: true,
      totalVehicles: vehicles.length,
      data: vehicles.map((v) => ({
        vehicle_reg_no: v._id,
        imei: v.imei,
        distance_km: (v.distance / 1000).toFixed(2),
        lastLocation: v.lastLocation,
        lastUpdated: v.lastUpdated,
        speed:v.speed_kmh,
        battery:v.main_power,
        ignition:v.ignition
      })),
    });
  } catch (error) {
    console.error("Error fetching vehicles by location:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching vehicles",
      error: error.message,
    });
  }
};


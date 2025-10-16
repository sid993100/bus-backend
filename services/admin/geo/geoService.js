// controllers/geoFence.controller.js
import mongoose from "mongoose";
import GeoFence from "../../../models/geoFenceModel.js";
const { isValidObjectId } = mongoose;

// Create
export const createGeoFence = async (req, res) => {
  try {
    const { city, longitude, latitude, radius } = req.body;
    if (!city || longitude === undefined || latitude === undefined || radius === undefined) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    const doc = await GeoFence.create({ city: city.toUpperCase(), longitude, latitude, radius });
    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to create geofence", error: err.message });
  }
};

// Get all (with optional city filter)
export const getGeoFences = async (req, res) => {
  try {
    const { city } = req.query;
    const filter = {};
    if (city) filter.city = city.toUpperCase();

    const items = await GeoFence.find(filter).sort({ city: 1, _id: 1 });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch geofences", error: err.message });
  }
};

// Get one
export const getGeoFenceById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid GeoFence ID" });
    const doc = await GeoFence.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "GeoFence not found" });
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch geofence", error: err.message });
  }
};

// Update
export const updateGeoFence = async (req, res) => {
  try {
    const { id } = req.params;
    const { city, longitude, latitude, radius } = req.body;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid GeoFence ID" });

    const payload = {};
    if (city) payload.city = city.toUpperCase();
    if (longitude !== undefined) payload.longitude = longitude;
    if (latitude !== undefined) payload.latitude = latitude;
    if (radius !== undefined) payload.radius = radius;

    const updated = await GeoFence.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: "GeoFence not found" });
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update geofence", error: err.message });
  }
};

// Delete
export const deleteGeoFence = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid GeoFence ID" });
    const deleted = await GeoFence.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "GeoFence not found" });
    return res.status(200).json({ success: true, message: "GeoFence deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to delete geofence", error: err.message });
  }
};

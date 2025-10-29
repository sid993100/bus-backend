// controllers/deviceEvent.controller.js
import mongoose from "mongoose";
import DeviceEvent from "../../models/deviceEventModel.js";


const { isValidObjectId } = mongoose;

// Create
export const createDeviceEvent = async (req, res) => {
  try {
    const { vlt, messageId, eventName, description , category } = req.body;

    if (!vlt || !isValidObjectId(vlt)) {
      return res.status(400).json({ success: false, message: "Valid 'vlt' is required" });
    }
    if (messageId === undefined || messageId === null) {
      return res.status(400).json({ success: false, message: "'messageId' is required" });
    }
    if (!eventName?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, message: "'eventName' and 'description' are required" });
    }

    const created = await DeviceEvent.create({
      vlt,
      messageId: Number(messageId),
      eventName: eventName.trim(),
      description: description.trim(),
      category: category
    });
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to create device event", error: err.message });
  }
};

// Read (list) with pagination, search, sort, and filters
export const getDeviceEvents = async (req, res) => {
  try {
    const {
      page = "1",
      limit = "20",
      sortBy = "createdAt",
      sortOrder = "desc",
      search,        // matches eventName/description
      vlt,           // filter by vlt id
      messageId,     // filter by messageId
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.max(parseInt(limit, 10), 1);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const filter = {};
    if (search) {
      filter.$or = [
        { eventName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (vlt && isValidObjectId(vlt)) filter.vlt = vlt;
    if (messageId !== undefined && messageId !== null) filter.messageId = Number(messageId);

    const [items, total] = await Promise.all([
      DeviceEvent.find(filter)
        .populate({path:"vlt",populate:{path:"manufacturerName" ,select:"manufacturerName shortName"}})
        .populate("category")
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      DeviceEvent.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1,
      },
      filters: { search: search || null, vlt: vlt || null, messageId: messageId ?? null },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch device events", error: err.message });
  }
};

// Read one
export const getDeviceEventById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    const doc = await DeviceEvent.findById(id).populate("vlt", "manufacturerName modelName shortName").populate("category");
    if (!doc) return res.status(404).json({ success: false, message: "Device event not found" });
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch device event", error: err.message });
  }
};

// Update
export const updateDeviceEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    if (payload.vlt && !isValidObjectId(payload.vlt)) {
      return res.status(400).json({ success: false, message: "Invalid vlt id" });
    }
    if (payload.messageId !== undefined && payload.messageId !== null) {
      payload.messageId = Number(payload.messageId);
    }
    if (payload.eventName !== undefined) payload.eventName = String(payload.eventName).trim();
    if (payload.description !== undefined) payload.description = String(payload.description).trim();

    const updated = await DeviceEvent.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate("vlt", "manufacturerName modelName shortName")
    .populate("category");

    if (!updated) return res.status(404).json({ success: false, message: "Device event not found" });
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update device event", error: err.message });
  }
};

export const deleteDeviceEvent = async (req, res) => {
  try {
    const deleted = await DeviceEvent.deleteMany({});
    if (!deleted) return res.status(404).json({ success: false, message: "Device event not found" });
    return res.status(200).json({ success: true, message: "Device event deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to delete device event", error: err.message });
  }
};

// controllers/deviceEvent.controller.js
import mongoose from "mongoose";
import DeviceEvent from "../../models/deviceEventModel.js";

const { isValidObjectId } = mongoose;

// Create
export const createDeviceEvent = async (req, res) => {
  try {
    const { vlt, messageId, eventName, description } = req.body;
    if (!vlt || !isValidObjectId(vlt)) {
      return res.status(400).json({ success: false, message: "Valid 'vlt' is required" });
    }
    if (messageId === undefined || eventName?.trim()?.length === 0 || description?.trim()?.length === 0) {
      return res.status(400).json({ success: false, message: "messageId, eventName, description are required" });
    }

    const created = await DeviceEvent.create({ vlt, messageId, eventName, description });
    const populated = await created.populate("vlt", "manufacturerName modelName shortName");
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to create device event", error: err.message });
  }
};

// List with populate + pagination + search/sort/filter
export const getDeviceEvents = async (req, res) => {
  try {
    const {
      page = "1",
      limit = "20",
      sortBy = "createdAt",
      sortOrder = "desc",
      search,            // matches eventName/description
      vlt,               // optional filter by vlt id
      messageId,         // optional filter
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
    if (messageId !== undefined) filter.messageId = Number(messageId);

    const [items, total] = await Promise.all([
      DeviceEvent.find(filter)
        .populate("vlt", "manufacturerName modelName shortName")
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

// Get one
export const getDeviceEventById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    const doc = await DeviceEvent.findById(id).populate("vlt", "manufacturerName modelName shortName");
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
    if (payload.messageId !== undefined) payload.messageId = Number(payload.messageId);

    const updated = await DeviceEvent.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate("vlt", "manufacturerName modelName shortName");

    if (!updated) return res.status(404).json({ success: false, message: "Device event not found" });
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update device event", error: err.message });
  }
};


// controllers/event.controller.js
import mongoose from "mongoose";
import Event from "../../models/eventModel.js";
import DeviceEvent from "../../models/deviceEventModel.js";


const isValidDate = (d) => !isNaN(new Date(d).getTime());

// Create
export const createEvent = async (req, res) => {
  try {
    const { vehicleNo, imei,eventNumber, dateAndTime, latitude, longitude,vendor_id } = req.body;    
    if (!vehicleNo || !imei  || !eventNumber || !dateAndTime || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }


const eventName = await DeviceEvent
  .findOne({ messageId: eventNumber })
  .populate({
    path: "vlt",
    match: { manufacturerName: vendor_id },
    select: "manufacturerName"
  }).select("-_id");
    const doc = await Event.create({
      vehicleNo: String(vehicleNo).trim(),
      imei: Number(imei),
      eventNumber: Number(eventNumber),
      dateAndTime: new Date(dateAndTime),
      latitude: Number(latitude),
      longitude: Number(longitude),
      eventName: eventName ? eventName._id : ""
    });
    if(!doc) {
        return res.status(500).json({ success: false, message: "Failed to create event" });
    }

    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to create event", error: err.message });
  }
};

// Get list (filters: vehicleNo, imei, eventName, startDay, endDay)
export const getEvents = async (req, res) => {
  try {
    const { vehicleNo, imei, eventName, startDay, endDay, page = "1", limit = "20", sortBy = "dateAndTime", sortOrder = "desc" } = req.query;

    const filter = {};
    if (vehicleNo) filter.vehicleNo = new RegExp(String(vehicleNo).trim(), "i");
    if (imei) filter.imei = Number(imei);

    if (startDay || endDay) {
      const s = startDay ? new Date(startDay) : null;
      const e = endDay ? new Date(endDay) : null;
      if ((s && isNaN(s)) || (e && isNaN(e))) {
        return res.status(400).json({ success: false, message: "Invalid startDay or endDay" });
      }
      filter.dateAndTime = {};
      if (s) filter.dateAndTime.$gte = new Date(s.setHours(0, 0, 0, 0));
      if (e) filter.dateAndTime.$lte = new Date(e.setHours(23, 59, 59, 999));
    }

    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.max(parseInt(limit, 10), 1);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [items, total] = await Promise.all([
      Event.find(filter).sort(sort).skip(skip).limit(limitNum).populate("eventName"),
      Event.countDocuments(filter),
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
      filters: { vehicleNo: vehicleNo || null, imei: imei || null, eventName: eventName || null, startDay: startDay || null, endDay: endDay || null },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch events", error: err.message });
  }
};

// Update by id (partial)
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const payload = { ...req.body };

    if (payload.dateAndTime !== undefined) {
      if (!isValidDate(payload.dateAndTime)) {
        return res.status(400).json({ success: false, message: "Invalid dateAndTime" });
      }
      payload.dateAndTime = new Date(payload.dateAndTime);
    }
    if (payload.imei !== undefined) payload.imei = Number(payload.imei);
    if (payload.latitude !== undefined) payload.latitude = Number(payload.latitude);
    if (payload.longitude !== undefined) payload.longitude = Number(payload.longitude);
    if (payload.vehicleNo !== undefined) payload.vehicleNo = String(payload.vehicleNo).trim();
    if (payload.eventName !== undefined) payload.eventName = String(payload.eventName).trim();

    const updated = await Event.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: "Event not found" });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update event", error: err.message });
  }
};

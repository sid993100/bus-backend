import { isValidObjectId } from "mongoose";
import ContactUs from "../../models/contactUsModel.js";


// Basic validators
function isValidEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isValidPhone(v) {
  return typeof v === "number" || (typeof v === "string" && /^[0-9+\-\s()]+$/.test(v));
}
function normalizeArray(a) {
  return Array.isArray(a) ? a : a !== undefined ? [a] : [];
}
function isValidUrl(v) {
  return typeof v === "string" && /^https?:\/\/[^\s]+$/.test(v);
}
export const createContactUs = async (req, res) => {
  try {
    const { organization, headquarter, phone, email, long, lat, website  } = req.body;

    if (!organization || !headquarter || long === undefined || lat === undefined) {
      return res.status(400).json({ success: false, message: "headquarter, long and lat are required" });
    }

    const phoneArr = normalizeArray(phone);
    const emailArr = normalizeArray(email);
    const websiteArr = normalizeArray(website);
    if (phoneArr.length === 0 || emailArr.length === 0) {
      return res.status(400).json({ success: false, message: "At least one phone and one email are required" });
    }

    // Validate arrays
    if (!phoneArr.every(isValidPhone)) {
      return res.status(400).json({ success: false, message: "One or more phone numbers are invalid" });
    }
    if (!emailArr.every(isValidEmail)) {
      return res.status(400).json({ success: false, message: "One or more emails are invalid" });
    }

    const doc = await ContactUs.create({
      organization,
      headquarter,
      phone: phoneArr.map(p => Number(p)),
      email: emailArr.map(String),
      long: Number(long),
      lat: Number(lat),
      website: websiteArr.map(String)
    });

    return res.status(201).json({ success: true, message: "ContactUs created", data: doc });
  } catch (e) {
    console.error("createContactUs error:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

export const getAllContactUs = async (req, res) => {
  try {
    const items = await ContactUs.find().lean();
    return res.status(200).json({ success: true, data: items });
  } catch (e) {
    console.error("getAllContactUs error:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

export const getContactUsById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    const doc = await ContactUs.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "ContactUs not found" });
    return res.status(200).json({ success: true, data: doc });
  } catch (e) {
    console.error("getContactUsById error:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

export const updateContactUs = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const { organization, headquarter, phone, email, long, lat, website } = req.body;

    const update = {};
    if (organization !== undefined) update.organization = organization;
    if (headquarter !== undefined) update.headquarter = headquarter;
    if (long !== undefined) update.long = Number(long);
    if (lat !== undefined) update.lat = Number(lat);

    if (phone !== undefined) {
      const phoneArr = normalizeArray(phone);
      if (!phoneArr.every(isValidPhone)) {
        return res.status(400).json({ success: false, message: "One or more phone numbers are invalid" });
      }
      update.phone = phoneArr.map(p => Number(p));
    }

    if (email !== undefined) {
      const emailArr = normalizeArray(email);
      if (!emailArr.every(isValidEmail)) {
        return res.status(400).json({ success: false, message: "One or more emails are invalid" });
      }
      update.email = emailArr.map(String);
    }

    if (website !== undefined) {
      const websiteArr = normalizeArray(website);
      if (!websiteArr.every(isValidUrl)) {
        return res.status(400).json({ success: false, message: "One or more websites are invalid" });
      }
      update.website = websiteArr.map(String);
    }
    const doc = await ContactUs.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, message: "ContactUs not found" });

    return res.status(200).json({ success: true, message: "ContactUs updated", data: doc });
  } catch (e) {
    console.error("updateContactUs error:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

export const deleteContactUs = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    const deleted = await ContactUs.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "ContactUs not found" });
    return res.status(200).json({ success: true, message: "ContactUs deleted", data: deleted });
  } catch (e) {
    console.error("deleteContactUs error:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

export const upsertSingleContactUs = async (req, res) => {
  try {
    const { organization, headquarter, phone, email, long, lat } = req.body;

    if (!organization || !headquarter || long === undefined || lat === undefined) {
      return res.status(400).json({ success: false, message: "headquarter, long and lat are required" });
    }

    const phoneArr = normalizeArray(phone);
    const emailArr = normalizeArray(email);

    if (!phoneArr.every(isValidPhone)) {
      return res.status(400).json({ success: false, message: "One or more phone numbers are invalid" });
    }
    if (!emailArr.every(isValidEmail)) {
      return res.status(400).json({ success: false, message: "One or more emails are invalid" });
    }

    const update = {
      organization,
      headquarter,
      phone: phoneArr.map(p => Number(p)),
      email: emailArr.map(String),
      long: Number(long),
      lat: Number(lat)
    };

    const doc = await ContactUs.findOneAndUpdate(
      {}, // the single document
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, message: "ContactUs upserted", data: doc });
  } catch (e) {
    console.error("upsertSingleContactUs error:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

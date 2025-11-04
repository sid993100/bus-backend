import { isValidObjectId } from "mongoose";
import Complaint from "../../models/complaintModel.js";

function parsePaging(req) {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
  const skip = (page - 1) * limit;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = (req.query.sortOrder || "desc").toLowerCase() === "asc" ? 1 : -1;
  const sort = { [sortBy]: sortOrder };
  return { page, limit, skip, sort };
}

export const createComplaint = async (req, res) => {
  try {
    const {  customer, category, subCategory, description } = req.body;

    if ( !customer || !category || !subCategory) {
      return res.status(400).json({ success: false, message: " customer, category, subCategory are required" });
    }

    if (!isValidObjectId(customer) || !isValidObjectId(category) || !isValidObjectId(subCategory)) {
      return res.status(400).json({ success: false, message: "Invalid customer/category/subCategory id" });
    }

    const doc = await Complaint.create({
      customer,
      category,
      subCategory,
      description: description || undefined,
      
    });

    const populated = await Complaint.findById(doc._id)
      .populate("customer", "name email phone")
      .populate("category", "name description")
      .populate("subCategory", "name description");

    return res.status(201).json({ success: true, message: "Complaint created", data: populated });
  } catch (e) {
    console.error("createComplaint error:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

export const getComplaints = async (req, res) => {
  try {
    const { page, limit, skip, sort } = parsePaging(req);
    const { q, status, customer, category, subCategory, fromDate, toDate } = req.query;

    const filter = {};

    // Search by complaintId or description
    if (q && q.trim() !== "") {
      const regex = new RegExp(q.trim(), "i");
      filter.$or = [{ complaintId: regex }, { description: regex }];
    }

    if (status && ["OPEN", "INPROGRESS", "RESOLVED", "CLOSED"].includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    }

    if (customer && isValidObjectId(customer)) filter.customer = customer;
    if (category && isValidObjectId(category)) filter.category = category;
    if (subCategory && isValidObjectId(subCategory)) filter.subCategory = subCategory;

    // Optional createdAt date range filter
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [items, total] = await Promise.all([
      Complaint.find(filter)
        .populate("customer", "name email phone")
        .populate("category", "name description")
        .populate("subCategory", "name description")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Complaint.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        q: q || undefined,
        status: status || undefined,
        customer: customer || undefined,
        category: category || undefined,
        subCategory: subCategory || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      }
    });
  } catch (e) {
    console.error("getComplaints error:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

export const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid complaint id" });
    }

    const doc = await Complaint.findById(id)
      .populate("customer", "name email phone")
      .populate("category", "name description")
      .populate("subCategory", "name description");

    if (!doc) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    return res.status(200).json({ success: true, data: doc });
  } catch (e) {
    console.error("getComplaintById error:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

export const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer, category, subCategory, description ,status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid complaint id" });
    }

    const update = {};
    if (customer) {
      if (!isValidObjectId(customer)) return res.status(400).json({ success: false, message: "Invalid customer id" });
      update.customer = customer;
    }
    if (category) {
      if (!isValidObjectId(category)) return res.status(400).json({ success: false, message: "Invalid category id" });
      update.category = category;
    }
    if (subCategory) {
      if (!isValidObjectId(subCategory)) return res.status(400).json({ success: false, message: "Invalid subCategory id" });
      update.subCategory = subCategory;
    }
    if (description !== undefined) update.description = description;
   
    if (status) {
      const allowed = ["OPEN", "INPROGRESS", "RESOLVED", "CLOSED"];
      const normalized = status.toUpperCase();
      if (!allowed.includes(normalized)) {
        return res.status(400).json({ success: false, message: "Invalid status value" });
      }
      update.status = normalized;
    }

    // Preserve unique complaintId constraint
    if (update.complaintId) {
      const exists = await Complaint.findOne({
        _id: { $ne: id },
        complaintId: update.complaintId
      }).lean();
      if (exists) {
        return res.status(409).json({ success: false, message: "complaintId already in use" });
      }
    }

    const doc = await Complaint.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .populate("customer", "name email phone")
      .populate("category", "name description")
      .populate("subCategory", "name description");

    if (!doc) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    return res.status(200).json({ success: true, message: "Complaint updated", data: doc });
  } catch (e) {
    console.error("updateComplaint error:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

export const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid complaint id" });
    }

    const deleted = await Complaint.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    return res.status(200).json({ success: true, message: "Complaint deleted", data: deleted });
  } catch (e) {
    console.error("deleteComplaint error:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};
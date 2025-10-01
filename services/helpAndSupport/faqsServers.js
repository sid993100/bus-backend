// controllers/faq.controller.js
import { isValidObjectId } from "mongoose";
import FAQ from "../../models/faqModel.js";


// Create FAQ
export const createFAQ = async (req, res) => {
  try {
    const { question, answer, category } = req.body;
    if (!question || !answer || !category) {
      return res.status(400).json({ success: false, message: "question, answer, and category are required" });
    }
    if (!isValidObjectId(category)) {
      return res.status(400).json({ success: false, message: "Invalid category id" });
    }
    const doc = await FAQ.create({ question, answer, category });
    const populated = await doc.populate("category", "name description");
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to create FAQ", error: err.message });
  }
};

// List FAQs with populate + pagination + search
export const getFAQs = async (req, res) => {
  try {
    const { page = "1", limit = "20", search } = req.query;
    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.max(parseInt(limit, 10), 1);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (search) {
      filter.$or = [
        { question: { $regex: search, $options: "i" } },
        { answer: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      FAQ.find(filter)
        .populate("category", "name description")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      FAQ.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch FAQs", error: err.message });
  }
};

// Get one FAQ
export const getFAQById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid FAQ id" });
    }
    const doc = await FAQ.findById(id).populate("category", "name description");
    if (!doc) return res.status(404).json({ success: false, message: "FAQ not found" });
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch FAQ", error: err.message });
  }
};

// Update FAQ (partial)
export const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid FAQ id" });
    }
    if (payload.category && !isValidObjectId(payload.category)) {
      return res.status(400).json({ success: false, message: "Invalid category id" });
    }

    const updated = await FAQ.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
      .populate("category", "name description");
    if (!updated) return res.status(404).json({ success: false, message: "FAQ not found" });
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update FAQ", error: err.message });
  }
};

// Delete FAQ
export const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid FAQ id" });
    }
    const deleted = await FAQ.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "FAQ not found" });
    return res.status(200).json({ success: true, message: "FAQ deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to delete FAQ", error: err.message });
  }
};

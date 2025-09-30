import FAQCategory from "../../models/faqCategoryModel.js";

// Create
export const createFAQCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({ success: false, message: "name and description are required." });
    }
    const doc = await FAQCategory.create({ name, description });
    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to create FAQ category.", error: err.message });
  }
};

// List with pagination
export const getFAQCategories = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "20", 10), 1);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      FAQCategory.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      FAQCategory.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch FAQ categories.", error: err.message });
  }
};

// Get by ID
export const getFAQCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await FAQCategory.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "FAQ category not found." });
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch FAQ category.", error: err.message });
  }
};

// Update (partial)
export const updateFAQCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const doc = await FAQCategory.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!doc) return res.status(404).json({ success: false, message: "FAQ category not found." });
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update FAQ category.", error: err.message });
  }
};

// Delete
export const deleteFAQCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await FAQCategory.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ success: false, message: "FAQ category not found." });
    return res.status(200).json({ success: true, message: "FAQ category deleted.", data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to delete FAQ category.", error: err.message });
  }
};

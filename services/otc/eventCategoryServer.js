
import mongoose from "mongoose";
import EventCategory from "../../models/eventCategoryModel.js";

// ✅ Create a new Event Category
export const createEventCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    // Check if category already exists
    const existing = await EventCategory.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }

    const category = await EventCategory.create({ name, description });

    return res.status(201).json({
      success: true,
      message: "Event category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error creating event category:", error);
    return res.status(500).json({ success: false, message: "Failed to create event category" });
  }
};

// ✅ Get all Event Categories (with optional pagination)
export const getAllEventCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = "name", sortOrder = "asc" } = req.query;

    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.max(parseInt(limit), 1);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [categories, total] = await Promise.all([
      EventCategory.find().sort(sort).skip(skip).limit(limitNum),
      EventCategory.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: categories,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Error fetching event categories:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
};

// ✅ Get single Event Category by ID
export const getEventCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid category ID" });
    }

    const category = await EventCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch category" });
  }
};

// ✅ Update Event Category
export const updateEventCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid category ID" });
    }

    const updatedCategory = await EventCategory.findByIdAndUpdate(
      id,
      { name, description },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ success: false, message: "Failed to update category" });
  }
}

//  ✅ Delete Event Category
// export const deleteEventCategory = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.isValidObjectId(id)) {
//       return res.status(400).json({ success: false, message: "Invalid category ID" });
//     }

//     const deleted = await EventCategory.findByIdAndDelete(id);

//     if (!deleted) {
//       return res.status(404).json({ success: false, message: "Category not found" });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Category deleted successfully",
//     });
//   } catch (error) {
//     console.error("Error deleting category:", error);
//     return res.status(500).json({ success: false, message: "Failed to delete category" });
//   }
// };

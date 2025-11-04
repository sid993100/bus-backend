import ComplaintSubCategory from "../../models/complaintSubCartegoryModel.js";
import mongoose, { isValidObjectId } from 'mongoose';


function parsePaging(req) {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.max(parseInt(req.query.limit || '10', 10), 1);
  const skip = (page - 1) * limit;
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = (req.query.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };
  return { page, limit, skip, sort };
}

// Create
export const createSubCategory = async (req, res) => {
  try {
    const { name, category, description } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'name and category are required' });
    }
    if (!isValidObjectId(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category id' });
    }

    // Optional: prevent duplicate subcategory name under same category
    const existing = await ComplaintSubCategory.findOne({
      name: String(name).toUpperCase().trim(),
      category
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Sub-category already exists for this category' });
    }

    const doc = await ComplaintSubCategory.create({
      name: String(name).toUpperCase().trim(),
      category,
      description: description || undefined
    });

    const populated = await ComplaintSubCategory.findById(doc._id)
      .populate('category', 'name description');

    return res.status(201).json({
      success: true,
      message: 'Complaint sub-category created',
      data: populated
    });
  } catch (e) {
    console.error('createSubCategory error:', e);
    return res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
};

// List with pagination and filters
export const getSubCategories = async (req, res) => {
  try {
    const { page, limit, skip, sort } = parsePaging(req);
    const { q, category } = req.query;

    const filter = {};

    if (q && q.trim() !== '') {
      // Case-insensitive search on name and description
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [{ name: regex }, { description: regex }];
    }

    if (category && isValidObjectId(category)) {
      filter.category = category;
    }

    const [items, total] = await Promise.all([
      ComplaintSubCategory.find(filter)
        .populate('category', 'name description')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      ComplaintSubCategory.countDocuments(filter)
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
        category: category || undefined
      }
    });
  } catch (e) {
    console.error('getSubCategories error:', e);
    return res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
};

// Get by id
export const getSubCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid sub-category id' });
    }

    const doc = await ComplaintSubCategory.findById(id)
      .populate('category', 'name description');

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Sub-category not found' });
    }

    return res.status(200).json({ success: true, data: doc });
  } catch (e) {
    console.error('getSubCategoryById error:', e);
    return res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
};

// Update
export const updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid sub-category id' });
    }

    const update = {};
    if (name) update.name = String(name).toUpperCase().trim();
    if (category) {
      if (!isValidObjectId(category)) {
        return res.status(400).json({ success: false, message: 'Invalid category id' });
      }
      update.category = category;
    }
    if (description !== undefined) update.description = description;

    // Optional: prevent duplicate name-category conflict on update
    if (update.name || update.category) {
      const dup = await ComplaintSubCategory.findOne({
        _id: { $ne: id },
        name: update.name ? update.name : undefined,
        category: update.category ? update.category : undefined
      });
      if (dup) {
        return res.status(409).json({ success: false, message: 'Sub-category already exists for this category' });
      }
    }

    const doc = await ComplaintSubCategory.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true
    }).populate('category', 'name description');

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Sub-category not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Complaint sub-category updated',
      data: doc
    });
  } catch (e) {
    console.error('updateSubCategory error:', e);
    return res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
};

// Delete
export const deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid sub-category id' });
    }

    const deleted = await ComplaintSubCategory.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Sub-category not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Complaint sub-category deleted',
      data: deleted
    });
  } catch (e) {
    console.error('deleteSubCategory error:', e);
    return res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
};

import Contact from "../../models/contactModel.js";


// Create a contact
export const createContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Minimal validation (schema also enforces required fields)
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const doc = await Contact.create({ name, email, phone, subject, message });
    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    // Duplicate key or validation errors bubble up from Mongoose
    return res.status(500).json({ success: false, message: "Failed to create contact.", error: err.message });
  }
};

// Get all contacts (with basic pagination)
export const getContacts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "20", 10), 1);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Contact.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Contact.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch contacts.", error: err.message });
  }
};

// Get a single contact by id
export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Contact.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "Contact not found." });
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch contact.", error: err.message });
  }
};

// Update a contact by id (partial update)
export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const doc = await Contact.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!doc) return res.status(404).json({ success: false, message: "Contact not found." });
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update contact.", error: err.message });
  }
};

// Delete a contact by id
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Contact.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ success: false, message: "Contact not found." });
    return res.status(200).json({ success: true, message: "Contact deleted.", data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to delete contact.", error: err.message });
  }
};

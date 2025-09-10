import Role from "../../../models/roleModel.js";
import consoleManager from "../../../utils/consoleManager.js";


// Utility: Validate MongoDB ObjectId
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// Create a new role
export const addRole = async (req, res) => {
  
  try {
    const { role, department, hierarchy } = req.body;
    consoleManager.log(role)

    // Basic field validations
    if (!role || typeof role !== 'string' || !role.trim()) {
      return res.status(400).json({ success: false, error: 'Role name is required' });
    }
    // if (!hierarchy || !isValidObjectId(hierarchy)) {
    //   return res.status(400).json({ success: false, error: 'Valid hierarchy ID is required' });
    // }
    if (department && !isValidObjectId(department)) {
      return res.status(400).json({ success: false, error: 'Invalid department ID format' });
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ role: role });
    if (existingRole) {
      return res.status(409).json({ success: false, error: 'Role already exists' });
    }

    const newRole = new Role({
      role: role,
      department,
      hierarchy,
    });
    await newRole.save();

    await newRole.populate([
      { path: 'department', select: 'name' },
      { path: 'hierarchy', select: "name" }
    ]);

    res.status(201).json({ success: true, message: 'Role created successfully', data: newRole });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
  }
};

// Get all roles
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('department', 'name')
      .populate('hierarchy', 'name level')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: roles.length, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch roles', details: error.message });
  }
};

// Update a role
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, department, permissions, hierarchy } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid role ID format' });
    }
    if (!role && (!role.trim() || typeof role !== 'string')) {
      return res.status(400).json({ success: false, error: 'Invalid role name' });
    }
    if (!department && !isValidObjectId(department) ) {
      return res.status(400).json({ success: false, error: 'Invalid department ID format' });
    }
    if (!hierarchy && !isValidObjectId(hierarchy)) {
      return res.status(400).json({ success: false, error: 'Invalid hierarchy ID format' });
    }

    // Check if role name already exists for another record
    if (role) {
      const existingRole = await Role.findOne({ role: role.toUpperCase(), _id: { $ne: id } });
      if (existingRole) {
        return res.status(409).json({ success: false, error: 'Role already exists' });
      }
    }

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      {
        ...(role && { role: role.toUpperCase() }),
        ...(department && { department }),
        ...(permissions && { permissions }),
        ...(hierarchy && { hierarchy })
      },
      { new: true, runValidators: true }
    )
      .populate('department', 'name')
      .populate('hierarchy', 'name level');

    if (!updatedRole) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }

    res.json({ success: true, message: 'Role updated successfully', data: updatedRole });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update role', details: error.message });
  }
};

// Delete a role
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid role ID format' });
    }

    const deletedRole = await Role.findByIdAndDelete(id);
    if (!deletedRole) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }

    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete role', details: error.message });
  }
};

// Get role by ID
export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid role ID format' });
    }

    const role = await Role.findById(id)
      .populate('department', 'name')
      .populate('hierarchy', 'name level');

    if (!role) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }

    res.json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch role', details: error.message });
  }
};

// Get role by name
export const getRoleByName = async (req, res) => {
  try {
    const { name } = req.params;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Role name is required' });
    }

    const role = await Role.findOne({ role: name.toUpperCase() })
      .populate('department', 'name')
      .populate('hierarchy', 'name level');

    if (!role) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }

    res.json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch role', details: error.message });
  }
};

// Get all permissions by role name
export const getAllPermissionsByRoleName = async (req, res) => {
  try {
    const { name } = req.params;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Role name is required' });
    }

    const role = await Role.findOne({ role: name.toUpperCase() }, 'permissions');
    if (!role) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }

    res.json({ success: true, data: role.permissions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch permissions', details: error.message });
  }
};

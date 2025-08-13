import Role from "../../../models/roleModel.js";
import mongoose from "mongoose";

export const addRole = async (req, res) => {
  try {
    const { role, account, description, permissions } = req.body;

    // Validate required fields
    if (!role || !account) {
      return res.status(400).json({
        message: "role and account are required"
      });
    }

    // Validate account ObjectId
    if (!mongoose.Types.ObjectId.isValid(account)) {
      return res.status(400).json({
        message: "Invalid account ID format"
      });
    }

    // Create role
    const newRole = await Role.create({
      role,
      account,
      description,
      permissions: permissions || []
    });

    res.status(201).json({
      message: "Role created successfully",
      data: newRole
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Role ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid Role ID format"
      });
    }

    // Check if at least one field is provided
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        message: "At least one field is required to update"
      });
    }

    // If account is provided, validate ObjectId
    if (req.body.account && !mongoose.Types.ObjectId.isValid(req.body.account)) {
      return res.status(400).json({
        message: "Invalid account ID format"
      });
    }

    // Perform update
    const updatedRole = await Role.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    ).populate('account', 'accountCode account description');

    if (!updatedRole) {
      return res.status(404).json({
        message: "Role not found"
      });
    }

    res.status(200).json({
      message: "Role updated successfully",
      data: updatedRole
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};

export const getRoles = async (req, res) => {
  try {

    const roles = await Role.find({})
      .populate('account', 'accountCode account description')
      .sort({ createdAt: -1 });

    if (!roles || roles.length === 0) {
      return res.status(404).json({
        message: "No roles found"
      });
    }

    res.status(200).json({
      message: "Roles retrieved successfully",
      data: roles
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};



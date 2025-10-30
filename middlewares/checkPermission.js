import Role from "../models/roleModel.js";
import User from "../models/userModel.js";
import { MODULE_ACTIONS } from "../utils/moduleActions.js";

export const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if(req.user.hierarchy.level === 1){
            return next()
        }
      // req.user._id should be set by your JWT auth middleware
      const user = await User.findById(req.user._id).populate("roleName");

      if (!user) {
        const customerExists = await Customer.findById(req.user._id);
        if(customerExists){
            return next()
        }else{
          return res.status(404).json({ message: "User not found" });
        }
        
      }

      const role = await Role.findById(user.roleName);

      if (!role) {
        return res.status(403).json({ message: "Role not found" });
      }

      // Validate resource and action against the central MODULE_ACTIONS map first
      const allowedActions = MODULE_ACTIONS[resource];
      if (!allowedActions) {
        return res.status(400).json({ message: `Unknown resource: ${resource}` });
      }
      if (!allowedActions.includes(action)) {
        return res.status(400).json({ message: `Unknown action '${action}' for resource '${resource}'` });
      }

      const resourcePermissions = role.permissions?.[resource];

      if (!resourcePermissions) {
        return res.status(403).json({ message: `No permissions for ${resource}` });
      }

      if (!resourcePermissions[action]) {
        return res.status(403).json({ message: `Permission denied for ${action} on ${resource}` });
      }

      // Permission granted
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };
};

import Role from "../models/roleModel.js";
import User from "../models/userModel.js";

export const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if(req.user.hierarchy.level === 1){
            return next()
        }
      // req.user._id should be set by your JWT auth middleware
      const user = await User.findById(req.user._id).populate("roleName");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const role = await Role.findById(user.roleName);

      if (!role) {
        return res.status(403).json({ message: "Role not found" });
      }

      const resourcePermissions = role.permissions[resource];

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
      res.status(500).json({ message: "Server error" });
    }
  };
};

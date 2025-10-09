import { model, Schema } from "mongoose";
import { MODULE_ACTIONS } from "../utils/moduleActions.js";

// Dynamic permission schema (allows any action)
const permissionSchema = new Schema({}, { strict: false });

const roleSchema = new Schema({
  role: { type: String, required: true, unique: true, uppercase: true },
  department: { type: Schema.Types.ObjectId, ref: "Account" },
  permissions: Object.keys(MODULE_ACTIONS).reduce((acc, module) => {
    acc[module] = { type: permissionSchema }; // removed default
    return acc;
  }, {}),
  hierarchy: { type: Schema.Types.ObjectId, ref: "Hierarchy", required: true },
}, { timestamps: true });

const Role = model("Role", roleSchema);

export default Role;

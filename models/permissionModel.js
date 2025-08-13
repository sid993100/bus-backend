import { Schema, model } from "mongoose";

const permissionSchema = new Schema({
  resource: {
    type: String,
    required: true,
    uppercase: true,
  },
  actions: {
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    // delete: { type: Boolean, default: false }
  }
}, { _id: false });

const Permission = model("Permission", permissionSchema);
export default permissionSchema ;

import { Schema } from "mongoose";

const roleSchema = new Schema({
  role: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  account:{
    type:Schema.Types.ObjectId,
    ref:"Account",
    required:true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [permissionSchema],
//   isActive: {
//     type: Boolean,
//     default: true
//   }
}, {
  timestamps: true
});

const Role = model("Role", roleSchema);
export default Role;

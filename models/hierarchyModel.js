import { model, Schema } from "mongoose";

const hierarchySchma = new Schema({
  hierarchyName: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    enum: ['SUPERADMIN', 'ADMIN', "DEPOT","REGION"]
  },
  description: {
    type: String,
    trim: true
  },
}, {
  timestamps: true
});

const Hierarchy = model("Hierarchy", hierarchySchma);
export default Hierarchy;

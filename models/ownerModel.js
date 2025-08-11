import { model, Schema } from "mongoose";

const ownerTypeSchema = new Schema({
  ownerType: {
    type: String,
    required: true,
    uppercase: true,
    unique: true
  },
  description: {
    type: String,
    required: true,
    uppercase: true
  }
}, {
  timestamps: true
});

const OwnerType = model("OwnerType",ownerTypeSchema)
export default OwnerType
import { model, Schema } from "mongoose";

const simServiceSchema = new Schema({
  serviceProviderName: {
    type: String,
    required: true,
    uppercase: true,
    unique: true
  },
  shortName: {
    type: String,
    required: true,
    uppercase: true,
    unique: true
  }
}, {
  timestamps: true
});

const SimService =model("SimService",simServiceSchema)
export default SimService
import { model, Schema } from "mongoose";

const zoneRegionSchema = new Schema({
  region: {
    type: String,
    required: true,
    uppercase: true,
    unique: true
  },
  communicationAddress: {
    type: String,
    required: true,
    uppercase: true
  },
  location: {
      type: [Number],
      required: true,
      index: '2dsphere'
  }
}, {
  timestamps: true
});

const Region=model("Region",zoneRegionSchema)

export default Region
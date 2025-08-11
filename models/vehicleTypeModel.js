import { Schema } from "mongoose";

const vehicleTypeSchema = new Schema({
  make: {
    type: String,
    required: true,
    uppercase: true
  },
  vehicleType: {
    type: String,
    required: true,
    uppercase: true
  }
}, {
  timestamps: true
});

const VehicleType= module("vehicleType",vehicleTypeSchema)
export default VehicleType
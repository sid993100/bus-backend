import { model, Schema } from "mongoose";

const vehicleTypeSchema = new Schema({
  make: {
    type: String,
    required: true,
  },
  vehicleType: {
    type: String,
    required: true,
    uppercase: true
  }
}, {
  timestamps: true
});

const VehicleType= model("VehicleType",vehicleTypeSchema)
export default VehicleType
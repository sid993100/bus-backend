import { model, Schema } from "mongoose";

const vehicleTypeSchema = new Schema({
  make: {
    type: Schema.Types.ObjectId,
    ref:"VehicleManufacturer",
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
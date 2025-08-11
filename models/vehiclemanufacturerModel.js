import { Schema, model } from "mongoose";

const vehicleManufacturerSchema = new Schema({
  make: {
    type: String,
    required: true,
    uppercase: true,
    unique: true
  },
  shortName: {
    type: String,
    required: true,
    uppercase: true
  }
}, {
  timestamps: true
});

const VehicleManufacturer= model("VehicleManufacturer",vehicleManufacturerSchema)
export default VehicleManufacturer
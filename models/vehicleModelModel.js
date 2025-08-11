import { Schema } from "mongoose";


const vehicleModelSchema = new Schema({
  make: {
    type: String,
    required: true,
    uppercase: true
  },
  vehicleType: {
    type: String,
    required: true,
    uppercase: true
  },
  vehicleModel: {
    type: String,
    required: true,
    uppercase: true
  }
}, {
  timestamps: true
});

const VehicalModel= module("VehicalModel",vehicleModelSchema)

export default VehicalModel
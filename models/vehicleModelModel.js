import { model, Schema } from "mongoose";


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

const VehicalModel= model("VehicalModel",vehicleModelSchema)

export default VehicalModel
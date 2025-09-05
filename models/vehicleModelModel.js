import { model, Schema } from "mongoose";


const vehicleModelSchema = new Schema({
  make: {
     type:Schema.Types.ObjectId,
      ref:"VehicleManufacturer",
    required: true,
 
  },
  vehicleType: {
       type: Schema.Types.ObjectId,
      ref:"VehicleType",
    required: true,
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
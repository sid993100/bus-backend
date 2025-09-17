import { model, Schema } from "mongoose";


const pisModelSchema = new Schema({
  make: {
     type:Schema.Types.ObjectId,
      ref:"PisManufacturer",
    required: true,
 
  },
  vehicleType: {
       type: Schema.Types.ObjectId,
      ref:"PisType",
    required: true,
  },
  vehicleModel: {
    type: String,
    required: true,
    uppercase: true,
  }
}, {
  timestamps: true
});

const PisModel= model("PisModel",pisModelSchema)

export default PisModel
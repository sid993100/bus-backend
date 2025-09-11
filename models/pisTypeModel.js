import { model, Schema } from "mongoose";

const pisTypeSchema = new Schema({
  make: {
    type: Schema.Types.ObjectId,
    ref:"PisManufacturer",
    required: true,

  },
  name: {
    type: String,
    required: true,
    uppercase: true,
    
  }
}, {
  timestamps: true
});

const PisType= model("PisType",pisTypeSchema)
export default PisType
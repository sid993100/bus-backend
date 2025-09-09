import { model, Schema } from "mongoose";

const planSchema = new Schema({
  planName: {
    type: String,
    required: true,
    uppercase: true,
    unique: true
  },
  vltdManufacturer: {
    type: Schema.Types.ObjectId,
    ref:"VltdManufacturer",
    required: true,
    
  },
  vltdModel:{
     type: Schema.Types.ObjectId,
    ref:"VltdModel",
    required: true,
  },
  durationDays: {
    type: Number,
    required: true,
    min: 1
  }
}, {
  timestamps: true
});

const Plan =model("Plan",planSchema)

export default Plan
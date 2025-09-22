
import { model, Schema } from "mongoose";

const pisRegistrationSchema = new Schema({
  stopName: {
   type:Schema.Types.ObjectId,
      ref:"BusStop",
    required: true,
    uppercase: true
  },
  screenId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  serialNumber: {
    type: String,
    required: true,
    uppercase: true
  },
  ipAddress: {
    type: String,
    required: true,
    match: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
  },
  port: {
    type: Number,
    required: true,
    min: 1,
    max: 65535
  },
  pisManufacturer: {
    type: Schema.Types.ObjectId,
    ref:"PisManufacturer",
    required: true,
   
  },
  pisType: {
    type: Schema.Types.ObjectId,
    ref:"PisType",
    required: true,
  },
  pisModel: {
    type: Schema.Types.ObjectId,
    ref:"PisModel",
    required: true,
  },
  recordsFrame: {
    type: Number,
    required: true,
    min: 1
  },
  numberOfServices: {
    type: Number,
    required: true,
    min: 1
  },
  refreshTimeSeconds: {
    type: Number,
    required: true,
    min: 1
  }
}, {
  timestamps: true
});

const PisRegistration=model("PisRegistration",pisRegistrationSchema)
export default PisRegistration
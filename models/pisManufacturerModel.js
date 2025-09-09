import { Schema, model } from "mongoose";

const pisManufacturerSchema = new Schema({
  name: {
    type: String,
    required: true,
    uppercase: true,
    unique: true
  },
  shortName: {
    type: String,
    required: true,
    uppercase: true,
    unique:true
  }
}, {
  timestamps: true
});

const PisManufacturer= model("PisManufacturer",pisManufacturerSchema)
export default PisManufacturer

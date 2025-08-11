import { model, Schema } from "mongoose";


const vltdManufacturerSchema = new Schema({
  manufacturerName: {
    type: String,
    required: true,
    uppercase: true,
    unique: true
  },
  shortName: {
    type: String,
    required: true,
    uppercase: true,
    unique: true
  }
}, {
  timestamps: true
});

const VltdManufacturer=model("VltdManufacturer",vltdManufacturerSchema)

export default VltdManufacturer
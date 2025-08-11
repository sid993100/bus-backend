import { model, Schema } from "mongoose";

const stopGradeSchema = new Schema({
  stopGradeName: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  geoFence: {
    type: String,
    required: true,
    uppercase: true
  }
})
const StopGrade = model("StopGrade", stopGradeSchema)

export default StopGrade
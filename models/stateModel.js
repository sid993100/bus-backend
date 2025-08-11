import { model, Schema } from "mongoose";

const stateSchema = new Schema({
  stateCode: {
    type: String,
    required: true,
    uppercase: true,
    unique: true
  },
  state: {
    type: String,
    required: true,
    uppercase: true
  },
  stateType: {
    type: String,
    required: true,
    uppercase: true
  },
  country: {
    type:Schema.Types.ObjectId,
    ref:"Country"
  }
}, {
  timestamps: true
});

const State=model("State",stateSchema)
export default State
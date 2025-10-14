import { model, Schema } from "mongoose";


const vltdModelSchema = new Schema({
  manufacturerName: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  modelName: {
    type: String,
    required: true,
    uppercase: true
  }
}, {
  timestamps: true
});

const VltdModel =model("VltdModel",vltdModelSchema)

export default VltdModel
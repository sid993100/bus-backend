import { model, Schema } from "mongoose";

const busStopSchema = new Schema({
  stopCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  stopName: {
    type: String,
    required: true,
    uppercase: true,
    unique:true
  },
  fareStage: {
    type: Boolean,
    required: true,
    uppercase: true
  },
  stopArea: {
    type: Schema.Types.ObjectId,
    ref:"Area",
    required: true,
  },
  border: {
    type: Boolean,
    required: true,
    uppercase: true
  },
  country: {
    type: Schema.Types.ObjectId,
    ref:"Country",
    required: true,
  },
  state: {
    type:Schema.Types.ObjectId,
    ref:"State",
    required:true
  },
  district: {
    type: String,
    uppercase: true
  },
  villageTownName: {
    type: String,
    uppercase: true
  },
  pinCode: {
    type: String,
    match: /^[0-9]{6}$/
  },
  busStation: {
    type: Boolean,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    }
  },
  stopGrade: {
   type:Schema.Types.ObjectId,
   ref:"StopGrade",
   required:true
  }
}, {
  timestamps: true
});

const BusStop=model("BusStop",busStopSchema)
export default BusStop
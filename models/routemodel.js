import { model, Schema } from "mongoose";

const routeSchema = new Schema({
  routeCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  routeName: {
    type: String,
    required: true,
    uppercase: true
  },
  routeLength: {
    type: Number,
    required: true,
    min: 0
  },
  source: {
    type: String,
    required: true,
    uppercase: true
  },
  destination: {
    type: String,
    required: true,
    uppercase: true
  },
  via: {
    type: String,
    uppercase: true
  },
  stops: [{ 
    km: {
      type: Number,
      required: true,
      min: 0
    },
    stop:{
      type:Schema.Types.ObjectId,
      ref:"BusStop"
    }
  }]
}, {
  timestamps: true
});

const Route=model("Route",routeSchema)
export default Route
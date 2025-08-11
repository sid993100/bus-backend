import { model, Schema } from "mongoose";

const tripSchema = new Schema({
  tripId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  scheduleLabel: {
    type: String,
    uppercase: true
  },
  depot: {
    type: String,
    required: true,
    uppercase: true
  },
  seatLayout: {
    type: String,
    required: true,
    uppercase: true
  },
  busService: {
    type: String,
    required: true,
    uppercase: true
  },
  route: {
    type: Schema.Types.ObjectId,
    ref:"Route",
    required: true,
  },
  originTime: {
    type: String,
    required: true
  },
  destinationTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['APPROVED', 'PENDING', 'CANCELLED']
  }
}, {
  timestamps: true
});

const Trip =model("Trip",tripSchema)
export default Trip
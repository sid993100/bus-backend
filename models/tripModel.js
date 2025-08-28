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
    type: Schema.Types.ObjectId,
    ref:"DepotCustomer",
    required: true,
  },
  seatLayout: {
    type: Schema.Types.ObjectId,
    ref:"SeatLayout",
    required: true,
  },
  busService: {
    type: Schema.Types.ObjectId,
    ref:"ServiceType",
    required: true,
   
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
    enum: ['APPROVED', 'PENDING', 'CANCELLED'],
    default:"PENDING"
  }
}, {
  timestamps: true
});

const Trip =model("Trip",tripSchema)
export default Trip
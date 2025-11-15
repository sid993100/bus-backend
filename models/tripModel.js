import { model, Schema } from "mongoose";

const configuredStopSchema = new Schema({
  stop: { type: Schema.Types.ObjectId, ref: 'BusStop', required: true },
  halt: { type: Boolean, default: false },
  boarding: { type: Boolean, default: false },
  alighting: { type: Boolean, default: false },
  arrivalTime: { type: String, default: null },
  departureTime: { type: String, default: null },
  arrivalDay: { type: Number, default: 1 }
}, { _id: false });

const tripConfigSchema = new Schema({
  tripId: {
    type: String,
    unique: true,
    uppercase: true,
    index:true
  },
  scheduleLabel: {
    type: String,
    uppercase: true
  },
  depot: {
    type: Schema.Types.ObjectId,
    ref: "DepotCustomer",
    required: true,
  },
  seatLayout: {
    type: Schema.Types.ObjectId,
    ref: "SeatLayout",
    required: true,
  },
  busService: {
    type: String,
    uppercase: true,
    required: true,
  },
  route: {
    type: Schema.Types.ObjectId,
    ref: "Route",
    required: true,
  },
  origin: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  originTime: {
    type: String,
    required: true
  },
  destinationTime: {
    type: String,
    required: true
  },
  arrivalDay: {
    type: Number,
    required: true,
    default: 1
  },
  cycleDay: {
    type: String,
    required: true,
    enum: ['Daily', 'Alternative', 'Weekly'],
    default: 'Daily'
  },
  reservation: {
    type: String,
    required: true,
    enum: ['Yes', 'No'],
    default: 'Yes'
  },
  currentBooking: {
    type: String,
    required: true,
    enum: ['Yes', 'No'],
    default: 'Yes'
  },
  fareType: {
    type: String,
    required: true,
    enum: ['KM BASED', 'STAGE BASED',"MIXED FARE"],
    default: 'KM BASED'
  },
  day: [{
  type: String,
  enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
}],
  configuredStops: [configuredStopSchema],
  status: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['APPROVED', 'PENDING', 'REJECTED', 'CANCELLED'],
    default: "PENDING"
  },
   startDate: {
    type: Date,
   
  },
  endDate: {
    type: Date,
  
  },
  cancel:[{
    type: Date,
  }],
  breakdown: [{ type: Date  }],
  delay:[{
    date: Date,
    delayDuration: Number
  }],
  favorite:[{
     _id: false,
    date:[{
      type: Date,
    }],
    user:{
      type:Schema.Types.ObjectId,
      ref:'User'
    }
  }]
}, {
  timestamps: true
});

const TripConfig = model("TripConfig", tripConfigSchema);
export default TripConfig;

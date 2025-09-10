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
    uppercase: true
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
  configuredStops: [configuredStopSchema],
  status: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['APPROVED', 'PENDING', 'REJECTED', 'CANCELLED'],
    default: "PENDING"
  }
}, {
  timestamps: true
});

tripConfigSchema.pre('save', async function(next) {
  if (this.isNew && !this.tripId) {
    try {
      const depot = await model('DepotCustomer').findById(this.depot);
      let depotCode = 'DEF';
      
      if (depot && depot.depotCustomer) {
        depotCode = depot.depotCustomer.substring(0, 3).toUpperCase();
      }
      
      const lastTrip = await model('TripConfig')
        .findOne({ tripId: { $regex: `^${depotCode}` } })
        .sort({ tripId: -1 })
        .select('tripId');
      
      let nextNumber = 1;
      if (lastTrip && lastTrip.tripId) {
        const lastNumberStr = lastTrip.tripId.replace(depotCode, '');
        if (!isNaN(parseInt(lastNumberStr))) {
            nextNumber = parseInt(lastNumberStr) + 1;
        }
      }
      
      this.tripId = depotCode + nextNumber.toString().padStart(4, '0');
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const TripConfig = model("TripConfig", tripConfigSchema);
export default TripConfig;
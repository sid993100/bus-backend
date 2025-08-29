import { model, Schema } from "mongoose";

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
    enum: ['Daily', 'Weekly', 'Monthly'],
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
    enum: ['KM Based', 'Fixed', 'Distance Based'],
    default: 'KM Based'
  },
  status: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['APPROVED', 'PENDING', 'CANCELLED'],
    default: "PENDING"
  }
}, {
  timestamps: true
});

// Simple pre-save hook to generate tripId
tripConfigSchema.pre('save', async function(next) {
  if (this.isNew && !this.tripId) {
    try {
      // Get depot code from depot reference
      const depot = await model('DepotCustomer').findById(this.depot);
      let depotCode = 'DEF'; // default
      
      if (depot && depot.depotCustomer) {
        // Extract first 3 characters as code
        depotCode = depot.depotCustomer.substring(0, 3).toUpperCase();
      }
      
      // Find highest existing tripId for this depot
      const lastTrip = await model('TripConfig')
        .findOne({ tripId: { $regex: `^${depotCode}` } })
        .sort({ tripId: -1 })
        .select('tripId');
      
      let nextNumber = 1;
      if (lastTrip && lastTrip.tripId) {
        const lastNumber = parseInt(lastTrip.tripId.replace(depotCode, ''));
        nextNumber = lastNumber + 1;
      }
      
      // Generate tripId: depotCode + 4-digit number
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

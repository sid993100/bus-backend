import { model, Schema } from "mongoose";

const routeSchema = new Schema({
  routeCode: {
    type: String,
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
    type: Schema.Types.ObjectId,
    ref: "BusStop",
    required: true,
  },
  destination: {
    type: Schema.Types.ObjectId,
    ref: "BusStop",
    required: true,
  },
  via: {
    type: Schema.Types.ObjectId,
    ref: "BusStop"
  },
  region: [{
    type: Schema.Types.ObjectId,
    ref: "Region"
  }],
  depot: [{
    type: Schema.Types.ObjectId,
    ref: "DepotCustomer"
  }],
  stops: [{ 
    km: {
      type: Number,
      required: true,
      min: 0
    },
    stop: {
      type: Schema.Types.ObjectId,
      ref: "BusStop"
    },
    toll: {
      type: Schema.Types.ObjectId,
      ref: "Toll"
    }
  }]
}, {
  timestamps: true
});

// Simple auto-generate route code: 0001, 0002, 0003...
routeSchema.pre('save', async function(next) {
  try {
    // Only generate routeCode for new documents when not provided
    if (this.isNew && !this.routeCode) {
      // Find the route with the highest numeric route code
      const lastRoute = await this.constructor.findOne(
        {},
        { routeCode: 1 }
      ).sort({ routeCode: -1 }).lean();

      let nextNumber = 1;
      
      if (lastRoute && lastRoute.routeCode) {
        // Convert route code to number and increment
        const lastNumber = parseInt(lastRoute.routeCode);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }

      // Generate 4-digit code: 0001, 0002, 0023, 0024...
      this.routeCode = String(nextNumber).padStart(4, '0');
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Simple static method to get next route code
routeSchema.statics.getNextRouteCode = async function() {
  const lastRoute = await this.findOne({}, { routeCode: 1 }).sort({ routeCode: -1 }).lean();
  
  let nextNumber = 1;
  if (lastRoute && lastRoute.routeCode) {
    const lastNumber = parseInt(lastRoute.routeCode);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }
  
  return String(nextNumber).padStart(4, '0');
};

const Route = model("Route", routeSchema);
export default Route;

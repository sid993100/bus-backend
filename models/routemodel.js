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

// Pre-save middleware to auto-generate routeCode
routeSchema.pre('save', async function(next) {
  try {
    // Only generate routeCode if it's not already set (for new documents)
    if (!this.routeCode || this.isNew) {
      // Find the highest existing routeCode
      const lastRoute = await this.constructor.findOne(
        {},
        { routeCode: 1 },
        { sort: { routeCode: -1 } }
      );

      let nextNumber = 1;
      
      if (lastRoute && lastRoute.routeCode) {
        // Extract number from routeCode (e.g., "0001" -> 1)
        const lastNumber = parseInt(lastRoute.routeCode);
        nextNumber = lastNumber + 1;
      }

      // Format as 4-digit string with leading zeros
      this.routeCode = nextNumber.toString().padStart(4, '0');
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to get next route code (optional utility)
routeSchema.statics.getNextRouteCode = async function() {
  const lastRoute = await this.findOne(
    {},
    { routeCode: 1 },
    { sort: { routeCode: -1 } }
  );

  let nextNumber = 1;
  if (lastRoute && lastRoute.routeCode) {
    const lastNumber = parseInt(lastRoute.routeCode);
    nextNumber = lastNumber + 1;
  }

  return nextNumber.toString().padStart(4, '0');
};

const Route = model("Route", routeSchema);
export default Route;

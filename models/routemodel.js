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

// Simple counter schema for atomic sequence increments
const counterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } });
const Counter = model('Counter', counterSchema);

// Pre-save middleware to auto-generate routeCode using a counter document
routeSchema.pre('save', async function(next) {
  try {
    // Only generate routeCode for new documents when not provided
    if (this.isNew && !this.routeCode) {
      const counterId = 'routeCode';
      const updated = await Counter.findByIdAndUpdate(
        counterId,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const nextNumber = updated.seq || 1;
      this.routeCode = String(nextNumber).padStart(4, '0');
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Static method to get next route code (optional utility)
routeSchema.statics.getNextRouteCode = async function() {
  // Read the counter document to determine the next route code without
  // modifying the counter (so callers can preview). If counter doesn't exist,
  // return '0001'.
  const counterId = 'routeCode';
  const CounterModel = Counter; // already defined above
  const counterDoc = await CounterModel.findById(counterId).lean();
  const seq = counterDoc && typeof counterDoc.seq === 'number' ? counterDoc.seq : 0;
  const nextNumber = seq + 1;
  return String(nextNumber).padStart(4, '0');
};

const Route = model("Route", routeSchema);
export default Route;

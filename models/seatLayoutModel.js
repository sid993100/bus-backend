import { model, Schema } from "mongoose";

const seatSchema = new Schema({
  seatIndex: { type: Number, required: true },
  seatNumber: { type: String, default: '' },
  seatType: { type: String, enum: ['SITTING', 'SLEEPER'], default: 'SITTING' },
  visible: { type: Boolean, default: true },
  isVip: { type: Boolean, default: false },
  isFemale: { type: Boolean, default: false },
  isConductor: { type: Boolean, default: false },
  isEmergencyExit: { type: Boolean, default: false },
  serviceId: { type: String, default: '' }, // Storing the service _id
}, { _id: false });

const layerSchema = new Schema({
  name: { type: String, required: true, enum: ['LOWER', 'UPPER'] },
  rows: { type: Number, required: true, min: 1 },
  columns: { type: Number, required: true, min: 1 },
  seats: [seatSchema]
}, { _id: false });

const floorSchema = new Schema({
  floorNumber: { type: Number, required: true, enum: [1, 2] },
  layers: [layerSchema]
}, { _id: false });

const seatLayoutSchema = new Schema({
  layoutName: {
    type: String,
    required: true,
    uppercase: true,
    unique: true
  },
  seatCapacity: {
    type: Number,
    required: true,
    min: 1
  },
  department: {
    type: String,
    required: true,
    uppercase: true,
    enum: ["PUBLICTRANSPORT", "ENFORCEMENT", "STORE"],
    default: "PUBLICTRANSPORT"
  },
  servicesLinked: [{
    type: Schema.Types.ObjectId,
    ref: 'ServiceType',
    required: true
  }],
  fci: {
    type: Number,
    required: true
  },
  floors: [floorSchema]
}, {
  timestamps: true
});

const SeatLayout = model("SeatLayout", seatLayoutSchema);
export default SeatLayout;
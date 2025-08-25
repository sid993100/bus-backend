import { model, Schema } from "mongoose";

const seatSchema = new Schema({
  seatIndex: { type: Number, required: true },
  visible:   { type: Boolean, default: true },
  seatType:  { type: String },            // "Seater" or "Sleeper"
  seatNumber:{ type: String },            // Custom seat number
  emergency: { type: Boolean, default: false },
  lock:      { type: Boolean, default: false },
  female:    { type: Boolean, default: false },
  serviceCategory: { type: String },      // E.g. "Ordinary", "AC 1X2"
}, { _id: false }); // Disable _id unless you want it for each seat

const layerSchema = new Schema({
  name:    { type: String, required: true },   // "Lower", "Upper"
  rows:    { type: Number, required: true },
  columns: { type: Number, required: true },
  seats:   [ seatSchema ]
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
    enum:["PUBLICTRANSPORT","ENFORCEMENT","STORE"],
    default:"PUBLICTRANSPORT"
  },
  servicesLinked: [{
    type: String,
    uppercase: true
  }],
  fci: {
    type: Number,
    required: true
  },
  // <-- Embed layers and seats directly in the layout document
  layers: [ layerSchema ]
}, {
  timestamps: true
});

const SeatLayout = model("SeatLayout", seatLayoutSchema);
export default SeatLayout;

import { model, Schema } from "mongoose";

const dutySchema = new Schema({
  dutyDate: {
    type: Date,
    required: true,
  },
  vehicleNumber: {
    type: String,
    required: true,
    uppercase: true
  },
  conductorName: {
    type: Schema.Types.ObjectId,
    ref: "Conductor",
    required: true
  },
  driverName: {
    type: Schema.Types.ObjectId,
    ref: "Driver",
    required: true
  },
  supportDriver: {
    type: Schema.Types.ObjectId,
    ref: "Driver"
  },
  dutyType: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['SCHEDULED', 'EXTRA DUTY'],
    default: "SCHEDULED"
  },
  scheduleNumber: {
    type: String,
    uppercase: true
  },
  dutyNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  serviceType: {
    type: String,
    required: true,
    uppercase: true
  },
  scheduledKM: {
    type: Number,
    required: true,
    min: 0
  },
  scheduledTrips: {
    type: Number,
    required: true,
    min: 1
  },
  nightOuts: {
    type: Number,
    required: true,
    min: 0
  },
  accountStatus: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['APPROVED', 'PENDING', 'CANCELLED'],
    default: "PENDING"
  }
}, {
  timestamps: true
});

const Duty = model("Duty", dutySchema);

export default Duty;
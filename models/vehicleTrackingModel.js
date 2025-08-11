import { model, Schema } from "mongoose";

const vehicleTrackingSchema = new Schema({
  vehicleNumber: {
    type: String,
    required: true,
    uppercase: true
  },
  imeiNumber: {
    type: String,
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    }
  },
  locationName: {
    type: String,
    uppercase: true
  },
  ignition: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['ON', 'OFF']
  },
  speed: {
    type: Number,
    required: true,
    min: 0
  },
  mainPower: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['CONNECTED', 'DISCONNECTED']
  },
  batteryStatus: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['CONNECTED', 'DISCONNECTED']
  },
  routeName: {
    type: String,
    uppercase: true
  }
}, {
  timestamps: true
});
const VehicleTracking=model("VehicleTracking",vehicleTrackingSchema)
export default VehicleTracking
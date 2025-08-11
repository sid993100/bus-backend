import { model, Schema } from "mongoose";

const incidentSchema = new Schema({
  vehicleNumber: {
    type: String,
    required: true,
    uppercase: true
  },
  imeiNumber: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['BD', 'TA', 'EA', 'SOS', 'HA', 'HB', 'RT', 'DT']
  },
  eventDescription: {
    type: String,
    required: true,
    uppercase: true
  },
  eventDateTime: {
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
  depotCustomer: {
    type: String,
    required: true,
    uppercase: true
  },
  zoneRegion: {
    type: String,
    required: true,
    uppercase: true
  },
  eventStatus: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['OPEN', 'CLOSED', 'ESCALATED'],
    default: 'OPEN'
  },
  handlerName: {
    type: String,
    uppercase: true
  },
  handledDateTime: {
    type: Date
  }
}, {
  timestamps: true
});

const Incident= model("Incident",incidentSchema)
export default Incident
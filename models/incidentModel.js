import { model, Schema } from "mongoose";

const incidentSchema = new Schema({
  vehicle: {
    type: Schema.Types.ObjectId,
    ref: "Vehicle",
    required: true,
    
  },
  event: {
    type:Schema.Types.ObjectId,
    ref:"DeviceEvent"
  },
  eventStatus: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['OPEN', 'CLOSED', 'ESCALATED'],
    default: 'OPEN'
  },
  remarks: {
    type: String,
    uppercase: true,
  },
  long:Number,
  lat:Number
}, {
  timestamps: true
});

const Incident= model("Incident",incidentSchema)
export default Incident
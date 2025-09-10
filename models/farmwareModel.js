import { model, Schema } from "mongoose";

const firmwareSchema = new Schema({
  imeiNumber: { type: String, required: true, unique: true },
  deviceMake: { type: String, required: true },
  deviceModel: { type: String, required: true },
  firmwareVersion: { type: String, required: true },
  mappedVehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle' }, // Reference to Vehicle
  lastReportedAt: { type: Date }
});

const Firmware= model('Firmware', firmwareSchema);
export default Firmware 
 
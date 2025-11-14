// models/DeviceEventDef.js
import { Schema, model } from "mongoose";

const deviceEventDefSchema = new Schema(
  {
    vlt: {
      type: Schema.Types.ObjectId,
      ref: "VltdModel",
      required: true, trim: true
    },
    messageId: { type: Number, required: true },
    eventName: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "EventCategory",
    }
  },
  { timestamps: true }
);


const DeviceEvent = model("DeviceEvent", deviceEventDefSchema);
export default DeviceEvent;

// models/DeviceEventDef.js
import { Schema, model } from "mongoose";

const deviceEventDefSchema = new Schema(
  {
    vlt: { 
        type:Schema.Types.ObjectId,
        ref:"VltdModel",
         required: true, trim: true },                      
    messageId: { type: Number, required: true, index: true },           
    eventName: { type: String, required: true, trim: true },               
    description: { type: String, required: true, trim: true },             
  },
  { timestamps: true }
);


const DeviceEvent = model("DeviceEvent", deviceEventDefSchema);
export default DeviceEvent;

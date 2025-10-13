import { model, Schema } from "mongoose";
const eventSchema = new Schema({
    vehicleNo:{
        type: String,
        required: true
    },
    imei:{
        type:Number,
        required:true
    },
    eventName:{
        type:Schema.Types.String,
        ref:"DeviceEvent"
    },
    eventNumber:{
        type:Number,
        required:true
    },
    dateAndTime:{
        type:Date,
        required:true
    },
    latitude:{
        type:Number,
        required:true
    },
    longitude:{ 
        type:Number,
        required:true
    },
    location:{
        type:String
    }

})

const Event = model("Event", eventSchema);
export default Event;
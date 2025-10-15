import { model } from "mongoose";
import { Schema } from "mongoose";

const geoFenceSchema = new Schema({
    city:{
        type: String,
        required: true,
        uppercase: true
    },
    longitude:{
        type: Number,
        required: true
    },
    latitude:{
        type: Number,   
        required: true
    },
    radius:{
        type: Number,
        required: true
    }
})
const GeoFence=model("GeoFence",geoFenceSchema)

export default GeoFence
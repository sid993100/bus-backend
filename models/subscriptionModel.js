import { Schema } from "mongoose";

const subscriptionSchema=new Schema({
    vehicleNumber:{
       type: String,
    required: true,
    uppercase: true
    },
    vltdDevice:{
        type:Number,
        required: true,
    },
    plan:{
        type:Schema.Types.ObjectId,
        ref:"Plan"
    },
},{timestamps:true})

const Subscription = module("Subscriptionc",subscriptionSchema)

export default Subscription
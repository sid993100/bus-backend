import { model, Schema } from "mongoose";

const subscriptionSchema=new Schema({
    vehicleNumber:{
       type: String,
    required: true,
    
    },
    vltdDevice:{
        type:Number,
        required: true,
    },
    plan:{
        type:Schema.Types.ObjectId,
        ref:"Plan"
    },
    activePlan:{
         type: Date,
    required: true,
    },
    expiry:{
        type: Date,
    required: true,
    }
},{timestamps:true})

const Subscription = model("Subscriptionc",subscriptionSchema)

export default Subscription
import { model, Schema } from "mongoose";

const vltDeviceSchema=new Schema({
    vlt:{
        type:Schema.Types.ObjectId,
        ref:"VltdModel",
        required:true
    },
    imeiNumber:{
        type:Number,
        required:true,
        unique: true,
    },
    iccid:{
        type:String,
        required:true
    },
    sim:{
        type:Schema.Types.ObjectId,
        ref:"Sim"
    },
    region:{
        type:Schema.Types.ObjectId,
        ref:"Region",
        required:true
    },
    customer:{
        type:Schema.Types.ObjectId,
        ref:"DepotCustomer",
        required:true
    }
},{timestamps:true})

const VltDevice=model("VltDevice",vltDeviceSchema)
export default VltDevice
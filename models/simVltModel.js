import { Schema,model } from "mongoose";

const simVltSchema= new Schema({
    imeiNumber:{
        type:Schema.Types.ObjectId,
        ref:"VltDevice",
        required:true,
    },
    iccid:{
         type:Number,
        required:true,
    },
    sim:{
        type:Schema.Types.ObjectId,
        ref:"SimService",
        required:true
    },
    primeryMSISDN:{
        type:String
    },
    fallbackSim:{
        type:Schema.Types.ObjectId,
        ref:"SimService",
    },
    fallbackMISIDN:{
        type:String
    }
})

const Sim=model("Sim",simVltSchema)
export default Sim
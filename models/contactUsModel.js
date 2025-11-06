import { model, Schema } from "mongoose";

const contactUsSchema = new Schema({
    organization:{
        type:String,
        required:true
    },
    headquarter:{
        type:String,
        required:true
    },
    phone:[{
        type:Number,
        required:true
    }],
    email:[{
        type:String,
        required:true
    }],
    long:{
        type:Number,
        required:true
    },
    lat:{
        type:Number,
        required:true
    }
})

const ContactUs = model("ContactUs",contactUsSchema);

export default ContactUs;
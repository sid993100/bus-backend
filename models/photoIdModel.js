import { Schema,model } from "mongoose";

const PhotoIdCardSchema=new Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        uppercase:true
    }
})
const PhotoIdCard=model("PhotoIdCard",PhotoIdCardSchema)
export default PhotoIdCard
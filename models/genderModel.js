import { Schema,model } from "mongoose";

const genderSchema=new Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        uppercase:true
    }
})
const Gender=model("Gender",genderSchema)
export default Gender
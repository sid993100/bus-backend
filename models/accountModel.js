
import { Schema,model }from "mongoose";

const accountSchema= new Schema({
    accountCode:{
       type:String,
        required:true,
        uppercase: true,
        unique:true
    },
    account:{
         type:String,
        required:true,
        uppercase: true,
        unique:true
    },
    description:{
        type:String,
        uppercase: true
    }
},{timestamps:true})

const Account= model("Account",accountSchema)
export default Account
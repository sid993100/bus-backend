
import { Schema,model }from "mongoose";

const tollTypeSchema= new Schema({
    tollType:{
       type:String,
        required:true,
        uppercase: true,
        unique:true
    },
    description:{
        type:String,
        uppercase:true
    }
},{timestamps:true})

const TollType= model("TollType",tollTypeSchema)
export default TollType
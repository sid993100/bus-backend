import { model, Schema } from "mongoose";

const areaSchema=new Schema({
    area:{
         type: String,
    required: true,
    uppercase: true,
    unique: true
    }
})
const Area= model("Area",areaSchema)
export default Area
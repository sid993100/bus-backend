import { model, Schema } from "mongoose";

const departmentSchema=new Schema({
    name:{
         type: String,
    required: true,
    uppercase: true,
    unique: true
    }
})
const Department= model("Department",departmentSchema)
export default Department
import { model, Schema } from "mongoose";

const empolyTypeSchema= new Schema({
     name:{
          type:String,
        required:true,
        unique:true,
        uppercase: true,
    }
})

const EmpolyType =model("EmpolyType",empolyTypeSchema)
export default EmpolyType
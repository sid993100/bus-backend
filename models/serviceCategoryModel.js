import { Schema,model }from "mongoose";

const serviceCategorySchema= new Schema({
    serviceCategory:{
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

const ServiceCategory= model("ServiceCategory",serviceCategorySchema)
export default ServiceCategory
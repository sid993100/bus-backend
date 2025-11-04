import { model, Schema } from "mongoose";

const complaintCategorySchema = new Schema({
    name:{
        type:String,
        required:true,
        uppercase:true,
        unique:true
    },
    description:{
        type:String,
    }
})
const ComplaintCategory= model("ComplaintCategory",complaintCategorySchema);

export default ComplaintCategory;
import { model, Schema } from "mongoose";

const subCategorySchema= new Schema({
    name:{
        type:String,
        required:true,
        uppercase:true
    },
    category:{
        type:Schema.Types.ObjectId,
        ref:"ComplaintCategory",
        required:true
    },
    description:{
        type:String,
    }
})

const ComplaintSubCategory= model("ComplaintSubCategory",subCategorySchema);

export default ComplaintSubCategory;
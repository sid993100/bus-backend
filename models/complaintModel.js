import { model, Schema } from "mongoose";

const complaintSchema= new Schema({
    complaintId:{
        type:String,
        required:true,
        unique:true
    },
    customer:{
        type:Schema.Types.ObjectId,
        ref:"Customer",
        required:true

    },
    cateory:{
        type:Schema.Types.ObjectId,
        ref:"ComplaintCategory",
        required:true
    },
    subCategory:{
        type:Schema.Types.ObjectId,
        ref:"ComplaintSubCategory",
        required:true
    },
    description:{
        type:String,
    },
    image:[{
        type:String
    }],
    status:{
        type:String,
        enum:["OPEN","INPROGRESS","RESOLVED","CLOSED"],
        default:"OPEN"
    }

})

const Comlaint= model("Complaint",complaintSchema);
export default Comlaint
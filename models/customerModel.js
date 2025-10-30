import { model, Schema } from "mongoose";
import bcrypt from "bcrypt";

const customerSchema= new Schema({
   
    email:{
        type:String,
        required:true,
        unique:true,
        index:true
    },
    password:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        index:true
    },
    address:{
        type:String,
    },
    dateofbirth:{
        type:Date,
    },
})


customerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
const Customer= model("Customer",customerSchema)
export default Customer
import { model, Schema } from "mongoose";
import bcrypt from "bcrypt";

const customerSchema = new Schema({
  fullname:{
    type:String,
    uppercase:true,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
  dateOfBirth: {
    type: Date,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  },
  mobileNumber: {
    type: String,
    unique: true,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
    resetCode: { type: String, default: null },
    resetCodeExpires: { type: Date, default: null },
 
});


customerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const Customer = model("Customer", customerSchema);
export default Customer;
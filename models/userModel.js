import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      uppercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
      unique: true,
    },
    hierarchy: {
      type: Schema.Types.ObjectId,
      ref: "Hierarchy",
      required: true,
    },
    region: {
      type: Schema.Types.ObjectId,
      ref: "Region",
    },
    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
    },
    roleName: {
      type: Schema.Types.ObjectId,
      ref: "Role",
    },
    emergencyContact:{
      type:Number,
     
    },
    aadhar:{
      type:Number,
     
    },  
    address:{
      type:String,
     
    },  
    state:{
      type:String,
      
    },  
    pinCode:{
      type:Number,
     
    }, 
    depot:{
      type: Schema.Types.ObjectId,
      ref: "DepotCustomer",
    } ,
    isActive:{
      type:Boolean,
      default:true
    },

    resetCode: { type: String, default: null },
    resetCodeExpires: { type: Date, default: null },

  },

  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = model("User", UserSchema);
export default User;
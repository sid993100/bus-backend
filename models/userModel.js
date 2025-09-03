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
      uppercase: true,
      unique: true,
    },
    hierarchy: {
      type: Schema.Types.ObjectId,
      ref:"Hierarchy"
    },
    region: {
      type: String,
      uppercase: true,
    },
    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
    },

    roleName: {
      type: Schema.Types.ObjectId,
      ref: "Role",
    },
    resetCode: { type: String, default: null },
    resetCodeExpires: { type: Date, default: null },
    // role:{
    //     type:String,
    //     enum:["DEIVER","CONDUCTOR"]
    // }
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

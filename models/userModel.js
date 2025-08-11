
import {Schema,model} from "mongoose"
import bcrypt from "bcrypt"

const UserSchema = new Schema({
    username:{
        type:String,
        required:true,
        uppercase: true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true, 
    },
    phone:{
        type:Number,
        required:true,
        uppercase: true,
        unique:true
    },
    hierarchy:{
        type:String,
        enum:["SUPERADMIN","ADMIN","CUSTOMER"],
        default:"CUSTOMER"

    },
    region:{
        type:String,
        uppercase: true
    },
    role:{
        type:String,
        enum:["DEIVER","CONDUCTOR"]
    }
},{timestamps:true})

UserSchema.pre("save",async function(next){
    if(!this.isModified("password")){return next()}
    this.password=await bcrypt.hash(this.password,10)
    next()
})


const User =model("User",UserSchema)
export default User

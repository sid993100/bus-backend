import { model, Schema } from "mongoose";

const countrySchema= new Schema({
     countryCode:{
          type:String,
        required:true,
        uppercase: true
    },
     country:{
          type:String,
        required:true,
        uppercase: true
    }
})

const Country =model("Country",countrySchema)
export default Country
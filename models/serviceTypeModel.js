import { Schema, model } from "mongoose";

const serviceTypeSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      unique:true
    },
    name: {
      type: String,
      required: true,
      uppercase: true,
      unique:true
    },
    tollType: {
      type: Schema.Types.ObjectId,
      ref: "TollType",
      required: true,
    },
    fare: {
      type: Number,
      required: true,
    },
    sleeperCharges: {
      type: Number,
      required: true,
    },
    reservationCharges:{
        type: Number,
      required: true,
    },
    resCharge:{
         type: Number,
      required: true,
    },
    childDiscount:{
        type: Number,
        required: true,
    },
    perKmFare:{
          type: Number,
        required: true,
    },
    account:{
        type:Schema.Types.ObjectId,
        ref:"Account"
    },
    category:{
      type:Schema.Types.ObjectId,
      ref:"ServiceCategory"
    }
  },
  { timestamps: true }
);

const ServiceType = model("ServiceType", serviceTypeSchema);
export default ServiceType;

import { model, Schema } from "mongoose";

const depotCustomerSchema = new Schema({
  depotCustomer: {
    type: String,
    required: true,
    uppercase: true,
    unique: true
  },
  code:{
    type: String,
    required: true,
    uppercase: true,
    unique: true
  },
  region: {
    type: Schema.Types.ObjectId,
    ref: "Region",
    required: true,
  },
}, {
  timestamps: true
});

const DepotCustomer = model("DepotCustomer",depotCustomerSchema)

export default DepotCustomer
import { model, Schema } from "mongoose";

const depotCustomerSchema = new Schema({
  depotCustomer: {
    type: String,
    required: true,
    uppercase: true,
    unique: true
  },
  region: {
    type: String,
    required: true,
    uppercase: true
  },
  communicationAddress: {
    type: String,
    uppercase: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    }
  }
}, {
  timestamps: true
});

const DepotCustomer = model("DepotCustomer",depotCustomerSchema)

export default DepotCustomer
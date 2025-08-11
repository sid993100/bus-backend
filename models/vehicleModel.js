import {  model, Schema } from "mongoose";

// Vehicle Schema
const vehicleSchema = new Schema({
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  seatLayout: {
    type: Schema.Types.ObjectId,
    ref:"SeatLayout",
    required: true,
    
  },
  hierarchy: {
    type: String,
    required: true,
    uppercase: true
  },
  regionZone: {
    type: String,
    required: true,
    uppercase: true
  },
  depotCustomer: {
    type: String,
    required: true,
    uppercase: true
  },
  serviceType: {
    type: String,
    required: true,
    uppercase: true
  },
  seatCapacity: {
    type: Number,
    required: true
  },
  registrationDate: {
    type: Date,
    required: true
  },
  vehicleManufacturer: {
    type: String,
    required: true,
    uppercase: true
  },
  vehicleType: {
    type: String,
    required: true,
    uppercase: true
  },
  vehicleModel: {
    type: String,
    required: true,
    uppercase: true
  },
  ownerType: {
    type: String,
    enum:["OWNED","HIRED"]
  },
  engineNumber: {
    type: String,
    uppercase: true
  },
  chassisNumber: {
    type: String,
    uppercase: true
  },
  manufacturingYear: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear()
  },
  purchaseDate: {
    type: Date
  },
  permitName: {
    type: String,
    uppercase: true
  },
  permitDueDate: {
    type: Date
  },
  pucDate: {
    type: Date
  },
  pucExpiryDate: {
    type: Date
  },
  fitness: {
    type: String,
    uppercase: true
  },
  vltdDevice: {
    type: String
  }
}, {
  timestamps: true
});

const Vehicle= model("Vehicle",vehicleSchema)

export default Vehicle
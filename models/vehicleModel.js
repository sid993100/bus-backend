import { model, Schema } from "mongoose";

// Vehicle Schema
const vehicleSchema = new Schema(
  {
    department:{
      type:Schema.Types.ObjectId,
      ref:"Account"
    },
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    seatLayout: {
      type: Schema.Types.ObjectId,
      ref: "SeatLayout",
      required: true,
    },
    hierarchy: {
      type: Schema.Types.ObjectId,
      ref:"Hierarchy"
    },
    regionZone: {
     type: Schema.Types.ObjectId,
      ref:"Region"
    },
    depotCustomer: {
      type: Schema.Types.ObjectId,
      ref:"DepotCustomer"
    },
    serviceType: {
      type: Schema.Types.ObjectId,
      ref:"ServiceType",
    },
    seatCapacity: {
      type: Number,
    },
    registrationDate: {
      type: Date,
    },
    vehicleManufacturer: {
      type:Schema.Types.ObjectId,
      ref:"VehicleManufacturer"
    
    },
    vehicleType: {
      type: Schema.Types.ObjectId,
      ref:"VehicleType"
    },
    vehicleModel: {
      type:Schema.Types.ObjectId,
      ref:"VehicalModel"
    },
    ownerType: {
      type: String,
      uppercase:true,
      enum: ["OWNED", "HIRED"],
      required: true,
    },
    engineNumber: {
      type: String,
      uppercase: true,
    },
    chassisNumber: {
      type: String,
      uppercase: true,
    },
    manufacturingYear: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear(),
    },
    purchaseDate: {
      type: Date,
    },
    permitName: {
      type: String,
      uppercase: true,
    },
    permitDueDate: {
      type: Date,
    },
    pucDate: {
      type: Date,
    },
    pucExpiryDate: {
      type: Date,
    },
    fitness: {
      type: String,
      uppercase: true,
    },
    vltdDevice: {
      type: Schema.Types.ObjectId,
      ref: "VltDevice",
    },
  },
  {
    timestamps: true,
  }
);

const Vehicle = model("Vehicle", vehicleSchema);

export default Vehicle;

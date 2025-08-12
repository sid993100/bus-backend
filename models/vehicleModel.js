import { model, Schema } from "mongoose";

// Vehicle Schema
const vehicleSchema = new Schema(
  {
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
      type: String,
      uppercase: true,
    },
    regionZone: {
      type: String,

      uppercase: true,
    },
    depotCustomer: {
      type: String,

      uppercase: true,
    },
    serviceType: {
      type: String,

      uppercase: true,
    },
    seatCapacity: {
      type: Number,
    },
    registrationDate: {
      type: Date,
    },
    vehicleManufacturer: {
      type: String,

      uppercase: true,
    },
    vehicleType: {
      type: String,
      uppercase: true,
    },
    vehicleModel: {
      type: String,
      uppercase: true,
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
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Vehicle = model("Vehicle", vehicleSchema);

export default Vehicle;

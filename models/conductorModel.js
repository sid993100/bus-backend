import { model, Schema } from "mongoose";

const ConductorSchema = new Schema({
  payrollId: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  departmentSection: {
    type: Schema.Types.ObjectId,
    ref:"Account"
  },
  zoneRegion: {
    type: Schema.Types.ObjectId,
    ref: "Region",
  },
  depotCustomer: {
    type: Schema.Types.ObjectId,
    ref: "DepotCustomer",
  },
  driverName: {
    type: String,
    required: true,
    uppercase: true
  },
  gender: {
    type: String,
    enum: ["MALE", "FEMALE", "OTHER"], // enum values must match uppercase
    required: true,
    uppercase: true
  },
  mobileNumber: {
    type: String,
    required: true,
    match: /^[0-9]{10,15}$/,
    uppercase: true
  },
  employment: {
    type: Schema.Types.ObjectId,
    ref: "EmpolyType",
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  fatherName: {
    type: String,
    required: true,
    uppercase: true
  },
  photoIdCard: {
    type: Schema.Types.ObjectId,
    ref:"PhotoIdCard"
  },
  idCardNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  localAddress: {
    type: String,
    trim: true,
    uppercase: true
  },
  permanentAddress: {
    type: String,
    trim: true,
    uppercase: true
  },
  clNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  clExpiryDate: {
    type: Date
  },
  emergencyContactNumber: {
    type: String,
    match: /^[0-9]{10,15}$/,
    uppercase: true
  }
}, {
  timestamps: true
});

const Conductor = model("Conductor", ConductorSchema);
export default Conductor;

import  { model, Schema } from "mongoose";


const DriverSchema = new Schema(
  {
    payrollId: {
      type: String,
      required: true,
      unique: true, // Ensures unique Payroll ID
      trim: true,
      index: true
    },
    departmentSection: { type:Schema.Types.ObjectId,ref:"Account" }, // Department / Section
    zoneRegion: {type:Schema.Types.ObjectId,ref:"Region" },        // Zone / Region
    depotCustomer: {type:Schema.Types.ObjectId,ref:"DepotCustomer" },     // Depot / Customer

    driverName: { type:String, required: true },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    mobileNumber: { type: String, required: true, trim: true },
    employment: { type:Schema.Types.ObjectId,ref:"EmpolyType" },

    dateOfBirth: { type: Date, required: true },
    fatherName: { type: String, required: true, trim: true },

    photoIdCardType: { type:Schema.Types.ObjectId, ref:"PhotoIdCard" }, // Aadhar / Passport / VoterID
    idCardNumber: { type: String, trim: true },

    localAddress: { type: String, trim: true },
    permanentAddress: { type: String, trim: true },

    dlNumber: { type: String, trim: true },
    dlExpiryDate: { type: Date },

    emergencyContactNumber: { type: String, trim: true }
  },
  {
    timestamps: true
  }
);

// Validate Mobile Numbers
DriverSchema.path('mobileNumber').validate(function (v) {
  return !v || /^\+?[0-9\s-]{7,15}$/.test(v);
}, 'Invalid mobile number format');

// Validate Emergency Contact Numbers
DriverSchema.path('emergencyContactNumber').validate(function (v) {
  return !v || /^\+?[0-9\s-]{7,15}$/.test(v);
}, 'Invalid emergency contact number format');

const Driver = model('Driver', DriverSchema);

export default Driver
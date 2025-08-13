import mongoose, { model, Schema } from "mongoose";


const DriverSchema = new Schema(
  {
    payrollId: {
      type: String,
      required: true,
      unique: true, // Ensures unique Payroll ID
      trim: true,
      index: true
    },
    departmentSection: { type: String, trim: true }, // Department / Section
    zoneRegion: { type: String, trim: true },        // Zone / Region
    depotCustomer: { type: String, trim: true },     // Depot / Customer

    driverName: { type:mongoose.Types.ObjectId,ref:"User", required: true },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    mobileNumber: { type: String, required: true, trim: true },
    employment: { type: String, required: true, trim: true },

    dateOfBirth: { type: Date, required: true },
    fatherName: { type: String, required: true, trim: true },

    photoIdCardType: { type: String, trim: true }, // Aadhar / Passport / VoterID
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
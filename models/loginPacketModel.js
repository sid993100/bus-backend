import { Schema, model } from 'mongoose';

const loginPacketSchema = new Schema({
  startCharacter: {
    type: String,
    required: true,
    maxlength: 1,
    default: '$'
  },
  header: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  vendorID: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  vehicleRegNo: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  imei: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{15}$/.test(v);
      },
      message: 'IMEI must be exactly 15 digits'
    },
    unique: true,
    index: true
  },
  firmwareVersion: {
    type: String,
    required: true,
    trim: true
  },
  protocolVersion: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  latitude: {
    type: String,
    required: true,
    trim: true
  },
  latitudeDirection: {
    type: String,
    required: true,
    enum: ['N', 'S'],
    uppercase: true
  },
  longitude: {
    type: String,
    required: true,
    trim: true
  },
  longitudeDirection: {
    type: String,
    required: true,
    enum: ['E', 'W'],
    uppercase: true
  },
  checksumSeparator: {
    type: String,
    required: true,
    maxlength: 1,
    default: '*'
  },
  checksum: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'PENDING'
  }
}, {
  timestamps: true
});

// Indexes
loginPacketSchema.index({ imei: 1, createdAt: -1 });
loginPacketSchema.index({ vehicleRegNo: 1, createdAt: -1 });

const LoginPacket = model('LoginPacket', loginPacketSchema);
export default LoginPacket;

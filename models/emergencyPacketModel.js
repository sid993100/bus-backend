import { Schema, model } from 'mongoose';

const emergencyPacketSchema = new Schema({
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
  protocolName: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  deviceID: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  packetType: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  date: {
    type: String,
    required: true,
    trim: true
  },
  gpsValidity: {
    type: String,
    required: true,
    enum: ['A', 'V'], // A = Active, V = Void
    uppercase: true
  },
  latitude: {
    type: String,
    required: true,
    trim: true
  },
  latitudeDir: {
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
  longitudeDir: {
    type: String,
    required: true,
    enum: ['E', 'W'],
    uppercase: true
  },
  altitude: {
    type: String,
    required: true,
    trim: true
  },
  speed: {
    type: String,
    required: true,
    trim: true
  },
  distance: {
    type: String,
    required: true,
    trim: true
  },
  provider: {
    type: String,
    required: true,
    trim: true
  },
  vehicleRegNo: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  replyNumber: {
    type: String,
    required: true,
    trim: true
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
  // Additional fields
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  emergencyType: {
    type: String,
    enum: ['PANIC', 'ACCIDENT', 'BREAKDOWN', 'MEDICAL', 'OTHER'],
    default: 'PANIC'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'CRITICAL'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'],
    default: 'ACTIVE'
  },
  acknowledgedAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  responseTeam: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  isProcessed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
emergencyPacketSchema.index({ vehicleRegNo: 1, createdAt: -1 });
emergencyPacketSchema.index({ deviceID: 1, createdAt: -1 });
emergencyPacketSchema.index({ status: 1, priority: -1 });
emergencyPacketSchema.index({ location: '2dsphere' });

// Pre-save middleware to parse location
emergencyPacketSchema.pre('save', function(next) {
  try {
    // Parse location if GPS is valid
    if (this.gpsValidity === 'A' && this.latitude && this.longitude) {
      let lat = parseFloat(this.latitude);
      let lng = parseFloat(this.longitude);
      
      if (this.latitudeDir === 'S') lat = -Math.abs(lat);
      if (this.longitudeDir === 'W') lng = -Math.abs(lng);
      
      this.location = {
        type: 'Point',
        coordinates: [lng, lat]
      };
    }
  } catch (error) {
    console.error('Error parsing emergency packet location:', error);
  }
  next();
});

const EmergencyPacket = model('EmergencyPacket', emergencyPacketSchema);
export default EmergencyPacket;

import { Schema, model } from 'mongoose';

const gpsDataSchema = new Schema({
  startCharacter: {
    type: String,
    required: true,
    default: '$',
    maxlength: 1
  },
  packetHeader: {
    type: String,
    required: true,
    uppercase: true
  },
  vendorId: {
    type: String,
    required: true,
    uppercase: true
  },
  vehicleRegistrationNo: {
    type: String,
    required: true,
    uppercase: true,
    index: true // For faster queries by vehicle
  },
  imei: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{15}$/.test(v); // Exactly 15 digits
      },
      message: 'IMEI must be exactly 15 digits'
    },
    unique: true,
    index: true
  },
  firmwareVersion: {
    type: String,
    required: true
  },
  protocolVersion: {
    type: String,
    required: true,
    uppercase: true
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  latitudeDir: {
    type: String,
    required: true,
    enum: ['N', 'S'],
    uppercase: true
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  longitudeDir: {
    type: String,
    required: true,
    enum: ['E', 'W'],
    uppercase: true
  },
  checksumSeparator: {
    type: String,
    required: true,
    default: '*',
    maxlength: 1
  },
  checksum: {
    type: String,
    required: true,
    uppercase: true
  },
  // Additional useful fields for tracking
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
  speed: {
    type: Number,
    min: 0,
    default: 0
  },
  heading: {
    type: Number,
    min: 0,
    max: 360
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'ALARM'],
    default: 'ACTIVE'
  },
  isProcessed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
gpsDataSchema.index({ vehicleRegistrationNo: 1, createdAt: -1 });
gpsDataSchema.index({ imei: 1, createdAt: -1 });
gpsDataSchema.index({ location: '2dsphere' });
gpsDataSchema.index({ createdAt: -1 });

// Pre-save middleware to set GeoJSON location
gpsDataSchema.pre('save', function(next) {
  if (this.latitude && this.longitude) {
    // Convert to proper longitude/latitude for GeoJSON
    let lng = this.longitude;
    let lat = this.latitude;
    
    // Apply direction modifiers
    if (this.latitudeDir === 'S') lat = -Math.abs(lat);
    if (this.longitudeDir === 'W') lng = -Math.abs(lng);
    
    this.location = {
      type: 'Point',
      coordinates: [lng, lat]
    };
  }
  next();
});

// Method to get formatted coordinates
gpsDataSchema.methods.getFormattedLocation = function() {
  return {
    latitude: this.latitudeDir === 'S' ? -Math.abs(this.latitude) : Math.abs(this.latitude),
    longitude: this.longitudeDir === 'W' ? -Math.abs(this.longitude) : Math.abs(this.longitude)
  };
};

// Static method to parse GPS message string
gpsDataSchema.statics.parseGPSMessage = function(messageString) {
  // Example: $Header,iTriangle,KA01IG1234,864495034476850,1_37T02B0164MAIS_6,AIS140,12.976347,N,77.549400,E,*,1C
  const parts = messageString.split(',');
  
  if (parts.length < 13) {
    throw new Error('Invalid GPS message format');
  }
  
  return {
    startCharacter: parts[0].charAt(0),
    packetHeader: parts.substring(1),
    vendorId: parts[1],
    vehicleRegistrationNo: parts[2],
    imei: parts[3],
    firmwareVersion: parts[4],
    protocolVersion: parts[5],
    latitude: parseFloat(parts[6]),
    latitudeDir: parts[7],
    longitude: parseFloat(parts[8]),
    longitudeDir: parts[9],
    checksumSeparator: parts[10],
    checksum: parts[11]
  };
};

const GPSData = model('GPSData', gpsDataSchema);

export default GPSData;

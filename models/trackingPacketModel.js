import { Schema, model } from 'mongoose';

const trackingPacketSchema = new Schema({
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
  firmwareVersion: {
    type: String,
    required: true,
    trim: true
  },
  packetType: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  messageID: {
    type: String,
    required: true,
    trim: true
  },
  packetStatus: {
    type: String,
    required: true,
    trim: true
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
    index: true
  },
  vehicleRegNo: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  gpsFix: {
    type: String,
    required: true,
    enum: ['A', 'V'], // A = Active, V = Void
    uppercase: true
  },
  date: {
    type: String,
    required: true,
    trim: true
  },
  time: {
    type: String,
    required: true,
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
  speed: {
    type: String,
    required: true,
    trim: true
  },
  heading: {
    type: String,
    required: true,
    trim: true
  },
  numOfSatellites: {
    type: String,
    required: true,
    trim: true
  },
  altitude: {
    type: String,
    required: true,
    trim: true
  },
  pdop: {
    type: String,
    required: true,
    trim: true
  },
  hdop: {
    type: String,
    required: true,
    trim: true
  },
  networkOperator: {
    type: String,
    required: true,
    trim: true
  },
  ignitionStatus: {
    type: String,
    required: true,
    enum: ['ON', 'OFF'],
    uppercase: true
  },
  mainPowerStatus: {
    type: String,
    required: true,
    trim: true
  },
  mainInputVoltage: {
    type: String,
    required: true,
    trim: true
  },
  internalBattery: {
    type: String,
    required: true,
    trim: true
  },
  checksum: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  emergencyStatus: {
    type: String,
    required: true,
    trim: true
  },
  tamperAlert: {
    type: String,
    required: true,
    trim: true
  },
  gsmSignalStrength: {
    type: String,
    required: true,
    trim: true
  },
  mcc: {
    type: String,
    required: true,
    trim: true
  },
  mnc: {
    type: String,
    required: true,
    trim: true
  },
  lac: {
    type: String,
    required: true,
    trim: true
  },
  cellID: {
    type: String,
    required: true,
    trim: true
  },
  gsmSignalStrengthNMR1Neighbour: {
    type: String,
    required: true,
    trim: true
  },
  lacNMR1Neighbour: {
    type: String,
    required: true,
    trim: true
  },
  cellIDNMR1stNeighbour: {
    type: String,
    required: true,
    trim: true
  },
  gsmSignalStrengthNMR2ndNeighbour: {
    type: String,
    required: true,
    trim: true
  },
  lacNMR2Neighbour: {
    type: String,
    required: true,
    trim: true
  },
  cellIDNMR2Neighbour: {
    type: String,
    required: true,
    trim: true
  },
  gsmSignalStrengthNMR3Neighbour: {
    type: String,
    required: true,
    trim: true
  },
  lacNMR3Neighbour: {
    type: String,
    required: true,
    trim: true
  },
  cellIDNMR3Neighbour: {
    type: String,
    required: true,
    trim: true
  },
  gsmSignalStrengthNMR4Neighbour: {
    type: String,
    required: true,
    trim: true
  },
  lacNMR4Neighbour: {
    type: String,
    required: true,
    trim: true
  },
  cellIDNMR4Neighbour: {
    type: String,
    required: true,
    trim: true
  },
  digitalInputStatus: {
    type: String,
    required: true,
    trim: true
  },
  digitalOutputStatus: {
    type: String,
    required: true,
    trim: true
  },
  frameNumber: {
    type: String,
    required: true,
    trim: true
  },
  analogInput1: {
    type: String,
    required: true,
    trim: true
  },
  analogInput2: {
    type: String,
    required: true,
    trim: true
  },
  deltaDistance: {
    type: String,
    required: true,
    trim: true
  },
  otaResponse: {
    type: String,
    required: true,
    trim: true
  },
  endCharacter: {
    type: String,
    required: true,
    maxlength: 1
  },
  checkSum: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  // Additional processing fields
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
  parsedDateTime: {
    type: Date,
    index: true
  },
  isProcessed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
trackingPacketSchema.index({ vehicleRegNo: 1, createdAt: -1 });
trackingPacketSchema.index({ imei: 1, createdAt: -1 });
trackingPacketSchema.index({ parsedDateTime: -1 });
trackingPacketSchema.index({ location: '2dsphere' });

// Pre-save middleware to parse location and datetime
trackingPacketSchema.pre('save', function(next) {
  try {
    // Parse location if GPS fix is valid
    if (this.gpsFix === 'A' && this.latitude && this.longitude) {
      let lat = parseFloat(this.latitude);
      let lng = parseFloat(this.longitude);
      
      if (this.latitudeDirection === 'S') lat = -Math.abs(lat);
      if (this.longitudeDirection === 'W') lng = -Math.abs(lng);
      
      this.location = {
        type: 'Point',
        coordinates: [lng, lat]
      };
    }

    // Parse date and time
    if (this.date && this.time) {
      // Assuming date format: DDMMYY and time format: HHMMSS
      const dateStr = this.date;
      const timeStr = this.time;
      
      if (dateStr.length === 6 && timeStr.length === 6) {
        const day = dateStr.substring(0, 2);
        const month = dateStr.substring(2, 4);
        const year = '20' + dateStr.substring(4, 6);
        const hour = timeStr.substring(0, 2);
        const minute = timeStr.substring(2, 4);
        const second = timeStr.substring(4, 6);
        
        this.parsedDateTime = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
      }
    }
  } catch (error) {
    console.error('Error parsing tracking packet data:', error);
  }
  next();
});

const TrackingPacket = model('TrackingPacket', trackingPacketSchema);
export default TrackingPacket;

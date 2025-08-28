import { Schema, model } from 'mongoose';

const loginPacketSchema = new Schema({
  protocol: {
    type: String,
    default: 'BHARAT_101'
  },
  packet_type: {
    type: String,
    default: 'login'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  raw_data: String,

  start_character: {
    type: String,
    default: '$'
  },
  header: {
    type: String,
    required: true
  },
  vendor_id: {
    type: String,
    required: true
  },
  vehicle_reg_no: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  },
  imei: {
    type: String,
    required: true,
    index: true
  },
  firmware_version: {
    type: String,
    required: true
  },
  protocol_version: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90,
    default: 0
  },
  latitude_dir: {
    type: String,
    enum: ['N', 'S'],
    default: 'N'
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180,
    default: 0
  },
  longitude_dir: {
    type: String,
    enum: ['E', 'W'],
    default: 'E'
  },
  checksum_separator: {
    type: String,
    default: '*'
  },
  checksum: {
    type: String
  },

  // Computed location for geospatial queries
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number]
    }
  }
}, {
  timestamps: true
});

// Pre-save middleware to compute location
loginPacketSchema.pre('save', function(next) {
  try {
    const lat = this.latitude;
    const lng = this.longitude;

    const haveValidCoords = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);

    if (haveValidCoords) {
      let outLat = lat;
      let outLng = lng;
      if (this.latitude_dir === 'S') outLat = -Math.abs(outLat);
      if (this.longitude_dir === 'W') outLng = -Math.abs(outLng);

      this.location = {
        type: 'Point',
        coordinates: [outLng, outLat]
      };
    } else {
      // Remove any partial location so we don't attempt to insert an invalid GeoJSON object
      if (this.location && (this.location.coordinates == null || this.location.coordinates.length === 0)) {
        this.location = undefined;
      }
    }
  } catch (error) {
    console.error('Error computing location:', error);
  }
  next();
});

const LoginPacket = model('LoginPacket', loginPacketSchema);
export default LoginPacket;

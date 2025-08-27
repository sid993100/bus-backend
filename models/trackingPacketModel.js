import { Schema, model } from 'mongoose';

const trackingPacketSchema = new Schema({
  // Top-level fields
  protocol: {
    type: String,
    default: 'BHARAT_101'
  },
  packet_type: {
    type: String,
    default: 'tracking'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  raw_data: String,

  // All parsed fields at the same level (flat structure)
  header: String,
  vendor_id: String,
  firmware_version: String,
  message_type: String,
  message_id: Number,
  message_description: String,
  packet_status: String,

  // Device info
  imei: {
    type: String,
    index: true
  },
  vehicle_reg_no: {
    type: String,
    index: true
  },

  // GPS info
  fix_status: Boolean,
  date: String,
  time: String,
  formatted_datetime: String,
  latitude: {
    type: Number,
    default: 0
  },
  latitude_dir: {
    type: String,
    default: 'N'
  },
  longitude: {
    type: Number,
    default: 0
  },
  longitude_dir: {
    type: String,
    default: 'E'
  },
  speed_kmh: {
    type: Number,
    default: 0
  },
  heading: {
    type: Number,
    default: 0
  },
  satellites: {
    type: Number,
    default: 0
  },
  altitude_m: {
    type: Number,
    default: 0
  },
  pdop: {
    type: Number,
    default: 0
  },
  hdop: {
    type: Number,
    default: 0
  },

  // Vehicle status
  operator_name: String,
  ignition: Boolean,
  main_power: Boolean,
  main_voltage: {
    type: Number,
    default: 0
  },
  battery_voltage: {
    type: Number,
    default: 0
  },
  emergency_status: Boolean,
  tamper_alert: String,

  // Network info
  gsm_signal: {
    type: Number,
    default: 0
  },
  mcc: Number,
  mnc: Number,
  lac: String,
  cell_id: String,

  // Neighbor cells (flat)
  neighbor_cell_1_signal: {
    type: Number,
    default: 0
  },
  neighbor_cell_1_lac: String,
  neighbor_cell_1_cell_id: String,
  neighbor_cell_2_signal: {
    type: Number,
    default: 0
  },
  neighbor_cell_2_lac: String,
  neighbor_cell_2_cell_id: String,
  neighbor_cell_3_signal: {
    type: Number,
    default: 0
  },
  neighbor_cell_3_lac: String,
  neighbor_cell_3_cell_id: String,
  neighbor_cell_4_signal: {
    type: Number,
    default: 0
  },
  neighbor_cell_4_lac: String,
  neighbor_cell_4_cell_id: String,

  // IO status
  digital_inputs: {
    type: String,
    default: '0000'
  },
  digital_outputs: {
    type: String,
    default: '00'
  },
  frame_number: {
    type: String,
    default: '0'
  },
  analog_input_1: {
    type: Number,
    default: 0
  },
  analog_input_2: {
    type: Number,
    default: 0
  },

  // Additional info
  delta_distance: {
    type: String,
    default: '0'
  },
  ota_response: String,
  checksum: String,

  // Location for geospatial queries
  location: {
    type: {
      type: String,
      enum: ['Point'],
      // no default - only set when coordinates are available
    },
    coordinates: {
      type: [Number]
    } // [longitude, latitude]
  }
}, {
  timestamps: true
});

// Create location from GPS data
trackingPacketSchema.pre('save', function(next) {
  try {
    const latVal = this.latitude;
    const lngVal = this.longitude;
    if (Number.isFinite(Number(latVal)) && Number.isFinite(Number(lngVal)) && (latVal !== 0 || lngVal !== 0)) {
      let lat = Number(latVal);
      let lng = Number(lngVal);
      if (this.latitude_dir === 'S') lat = -Math.abs(lat);
      if (this.longitude_dir === 'W') lng = -Math.abs(lng);
      this.location = {
        type: 'Point',
        coordinates: [lng, lat]
      };
    } else {
      // ensure we don't save an incomplete location object
      if (this.location) delete this.location;
    }
  } catch (err) {
    console.error('Error in pre-save middleware:', err);
  }
  next();
});

// Add geospatial index
trackingPacketSchema.index({ location: '2dsphere' });

const TrackingPacket = model('TrackingPacket', trackingPacketSchema);
export default TrackingPacket;

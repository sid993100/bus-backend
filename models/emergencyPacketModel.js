import { Schema, model } from 'mongoose';

const emergencyPacketSchema = new Schema({
  // Top level fields
  protocol: {
    type: String,
    default: 'BHARAT_101'
  },
  packet_type: {
    type: String,
    default: 'emergency'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  raw_data: String,

  // Flat emergency packet fields
  header: {
    type: String,
    
    default: '$EPB'
  },
  message_type: {
    type: String,
    
    enum: ['EMR', 'SEM'], // EMR=Emergency Message, SEM=Stop Message
    default: 'EMR'
  },
  device_id: {
    type: String,
    
    index: true
  },
  packet_status: {
    type: String,
    
    enum: ['NM', 'SP'], // NM=Normal, SP=Stored
    default: 'NM'
  },
  datetime: {
    type: String,
    
  },
  gps_validity: {
    type: String,
    
    enum: ['A', 'V'], // A=Active/Valid, V=Void/Invalid
    default: 'A'
  },
  latitude: {
    type: Number,
    
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
    
    min: -180,
    max: 180,
    default: 0
  },
  longitude_dir: {
    type: String,
    
    enum: ['E', 'W'],
    default: 'E'
  },
  altitude: {
    type: Number,
    
    default: 0
  },
  speed: {
    type: Number,
    
    min: 0,
    default: 0
  },
  distance: {
    type: Number,
    
    min: 0,
    default: 0
  },
  provider: {
    type: String,
    
    enum: ['G', 'N'], // G=GPS, N=Network
    default: 'G'
  },
  vehicle_reg_no: {
    type: String,
    
    uppercase: true,
    trim: true,
    index: true
  },
  emergency_contact: {
    type: String,
    
    trim: true
  },
  checksum: {
    type: String,
    trim: true
  },

  // Computed location field for geospatial queries
  location: {
    type: {
      type: String,
     
    },
    coordinates: {
      type: [Number] // [longitude, latitude]
    }
  },

  // Emergency management fields
  emergency_type: {
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
  acknowledged_at: Date,
  resolved_at: Date,
  response_team: String,
  notes: String,
  is_processed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
emergencyPacketSchema.index({ vehicle_reg_no: 1, createdAt: -1 });
emergencyPacketSchema.index({ device_id: 1, createdAt: -1 });
emergencyPacketSchema.index({ status: 1, priority: -1 });
emergencyPacketSchema.index({ location: '2dsphere' });
emergencyPacketSchema.index({ createdAt: -1 }); // For latest emergencies

// Pre-save middleware to compute location
emergencyPacketSchema.pre('save', function(next) {
  try {
    // Only set location when GPS validity is 'A' and lat/lng are finite numbers
    const lat = this.latitude;
    const lng = this.longitude;

    const haveValidCoords = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);

    if (this.gps_validity === 'A' && haveValidCoords) {
      let outLat = lat;
      let outLng = lng;

      if (this.latitude_dir === 'S') outLat = -Math.abs(outLat);
      if (this.longitude_dir === 'W') outLng = -Math.abs(outLng);

      this.location = {
        type: 'Point',
        coordinates: [outLng, outLat]
      };
    } else {
      // Remove any partial location so we don't insert an invalid GeoJSON object
      if (this.location && (this.location.coordinates == null || this.location.coordinates.length === 0)) {
        this.location = undefined;
      }
    }
  } catch (error) {
    console.error('Error parsing emergency packet location:', error);
  }
  next();
});

// Static methods for emergency management
emergencyPacketSchema.statics.findActiveEmergencies = function(limit = 50) {
  return this.find({ status: 'ACTIVE' })
    .sort({ createdAt: -1 })
    .limit(limit);
};

emergencyPacketSchema.statics.findByVehicle = function(vehicleRegNo) {
  return this.find({ vehicle_reg_no: vehicleRegNo })
    .sort({ createdAt: -1 });
};

emergencyPacketSchema.statics.findNearLocation = function(longitude, latitude, radiusInMeters = 5000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusInMeters
      }
    }
  });
};

const EmergencyPacket = model('EmergencyPacket', emergencyPacketSchema);
export default EmergencyPacket;

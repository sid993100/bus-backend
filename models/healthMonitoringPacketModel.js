import { Schema, model } from 'mongoose';

const healthMonitoringPacketSchema = new Schema({
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
  batteryPercentage: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        const num = parseInt(v);
        return !isNaN(num) && num >= 0 && num <= 100;
      },
      message: 'Battery percentage must be between 0-100'
    }
  },
  lowBatteryThresholdPercentage: {
    type: String,
    required: true,
    trim: true
  },
  memoryPercentage1: {
    type: String,
    required: true,
    trim: true
  },
  memoryPercentage2: {
    type: String,
    required: true,
    trim: true
  },
  dataIgnitionOn: {
    type: String,
    required: true,
    trim: true
  },
  dataUpdateRateWhenIgnitionOff: {
    type: String,
    required: true,
    trim: true
  },
  analogInput1Status: {
    type: String,
    required: true,
    trim: true
  },
  analogInput2Status: {
    type: String,
    required: true,
    trim: true
  },
  digitalInputStatus: {
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
  healthStatus: {
    type: String,
    enum: ['GOOD', 'WARNING', 'CRITICAL'],
    default: 'GOOD'
  },
  isProcessed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
healthMonitoringPacketSchema.index({ imei: 1, createdAt: -1 });
healthMonitoringPacketSchema.index({ createdAt: -1 });

// Pre-save middleware to determine health status
healthMonitoringPacketSchema.pre('save', function(next) {
  try {
    const batteryLevel = parseInt(this.batteryPercentage);
    const lowBatteryThreshold = parseInt(this.lowBatteryThresholdPercentage);
    
    if (batteryLevel <= lowBatteryThreshold) {
      this.healthStatus = 'CRITICAL';
    } else if (batteryLevel <= 20) {
      this.healthStatus = 'WARNING';
    } else {
      this.healthStatus = 'GOOD';
    }
  } catch (error) {
    console.error('Error determining health status:', error);
  }
  next();
});

const HealthMonitoringPacket = model('HealthMonitoringPacket', healthMonitoringPacketSchema);
export default HealthMonitoringPacket;

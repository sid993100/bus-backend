import { Schema, model } from 'mongoose';

const healthMonitoringPacketSchema = new Schema({
  // Top level fields
  protocol: {
    type: String,
    default: 'BHARAT_101'
  },
  packet_type: {
    type: String,
    default: 'health'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  raw_data: String,

  // Flat health packet fields
  header: {
    type: String,
    required: true,
    default: '$Header'
  },
  vendor_id: {
    type: String,
    required: true,
    default: 'iTriangle'
  },
  firmware_version: {
    type: String,
    required: true
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
  battery_percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  low_battery_threshold: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 20
  },
  server1_memory_percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  server2_memory_percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  ignition_on_interval: {
    type: Number,
    required: true,
    min: 5,
    max: 300,
    default: 60
  },
  ignition_off_interval: {
    type: Number,
    required: true,
    min: 1,
    max: 600,
    default: 300
  },
  digital_inputs: {
    type: String,
    required: true,
    default: '0000'
  },
  analog_input_1: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  analog_input_2: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  checksum: {
    type: String,
    trim: true
  },

  // Health status fields
  health_status: {
    type: String,
    enum: ['EXCELLENT', 'GOOD', 'WARNING', 'CRITICAL'],
    default: 'GOOD'
  },
  battery_status: {
    type: String,
    enum: ['FULL', 'GOOD', 'LOW', 'CRITICAL'],
    default: 'GOOD'
  },
  memory_status: {
    type: String,
    enum: ['NORMAL', 'HIGH', 'FULL'],
    default: 'NORMAL'
  },
  device_temperature: {
    type: Number,
    default: 25 // Celsius
  },
  last_maintenance: {
    type: Date
  },
  maintenance_alert: {
    type: Boolean,
    default: false
  },
  is_processed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
healthMonitoringPacketSchema.index({ imei: 1, createdAt: -1 });
healthMonitoringPacketSchema.index({ health_status: 1, createdAt: -1 });
healthMonitoringPacketSchema.index({ battery_percentage: 1 });
healthMonitoringPacketSchema.index({ createdAt: -1 });

// Pre-save middleware to determine health status
healthMonitoringPacketSchema.pre('save', function(next) {
  try {
    const batteryLevel = this.battery_percentage;
    const lowBatteryThreshold = this.low_battery_threshold;
    const server1Memory = this.server1_memory_percentage;
    const server2Memory = this.server2_memory_percentage;

    // Determine battery status
    if (batteryLevel <= lowBatteryThreshold) {
      this.battery_status = 'CRITICAL';
    } else if (batteryLevel <= 20) {
      this.battery_status = 'LOW';
    } else if (batteryLevel <= 50) {
      this.battery_status = 'GOOD';
    } else {
      this.battery_status = 'FULL';
    }

    // Determine memory status
    const maxMemoryUsage = Math.max(server1Memory, server2Memory);
    if (maxMemoryUsage >= 90) {
      this.memory_status = 'FULL';
    } else if (maxMemoryUsage >= 70) {
      this.memory_status = 'HIGH';
    } else {
      this.memory_status = 'NORMAL';
    }

    // Determine overall health status
    if (this.battery_status === 'CRITICAL' || this.memory_status === 'FULL') {
      this.health_status = 'CRITICAL';
    } else if (this.battery_status === 'LOW' || this.memory_status === 'HIGH') {
      this.health_status = 'WARNING';
    } else if (this.battery_status === 'GOOD' && this.memory_status === 'NORMAL') {
      this.health_status = 'GOOD';
    } else {
      this.health_status = 'EXCELLENT';
    }

    // Set maintenance alert if needed
    if (this.health_status === 'CRITICAL' || this.battery_percentage <= 10) {
      this.maintenance_alert = true;
    }

  } catch (error) {
    console.error('Error determining health status:', error);
  }
  next();
});

// Static methods for health monitoring
healthMonitoringPacketSchema.statics.findCriticalDevices = function(limit = 20) {
  return this.find({ health_status: 'CRITICAL' })
    .sort({ createdAt: -1 })
    .limit(limit);
};

healthMonitoringPacketSchema.statics.findLowBatteryDevices = function(threshold = 20) {
  return this.find({ battery_percentage: { $lte: threshold } })
    .sort({ battery_percentage: 1 });
};

healthMonitoringPacketSchema.statics.findByImei = function(imei, limit = 10) {
  return this.find({ imei: imei })
    .sort({ createdAt: -1 })
    .limit(limit);
};

healthMonitoringPacketSchema.statics.getHealthSummary = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$health_status',
        count: { $sum: 1 },
        avgBattery: { $avg: '$battery_percentage' },
        avgMemory: { $avg: { $max: ['$server1_memory_percentage', '$server2_memory_percentage'] } }
      }
    }
  ]);
};

const HealthMonitoringPacket = model('HealthMonitoringPacket', healthMonitoringPacketSchema);
export default HealthMonitoringPacket;

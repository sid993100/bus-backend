import { model, Schema } from "mongoose";

const scheduleConfigurationSchema = new Schema({

  depot: {
    type: Schema.Types.ObjectId,
    ref: "DepotCustomer",
    required: true,

  },
  scheduleLabel: {
    type: String,
    required: true,
    uppercase: true
  },
  seatLayout: {
    type: Schema.Types.ObjectId,
    ref: "SeatLayout",
    required: true,

  },
  scheduleKm:{
    type:Number,
  },
  busService: {
    type: Schema.Types.ObjectId,
    ref: "ServiceType",
    required: true,

  },
  trips: [{
    trip:{
    type:Schema.Types.ObjectId,
    ref:"TripConfig",
    required: true,
  },
  nightOut: {
    type: Boolean,
    default: false,
    required:true
  },
  day:{
    type:Number,
    required:true,
  }
 }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  cycleDay: {
    type: String,
    // required: true,
    enum: ['Daily', 'Alternative', 'Weekly'],
    default: 'Daily'
  },
}, {
  timestamps: true
});

// Auto-generate serial number
scheduleConfigurationSchema.pre('save', async function(next) {
  if (this.isNew && !this.sNo) {
    const lastSchedule = await this.constructor.findOne().sort({ sNo: -1 });
    this.sNo = lastSchedule ? lastSchedule.sNo + 1 : 1;
  }
  next();
});

const ScheduleConfiguration = model("ScheduleConfiguration", scheduleConfigurationSchema);
export default ScheduleConfiguration;

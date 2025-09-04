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
  busService: {
    type: Schema.Types.ObjectId,
    ref: "BusStop",
    required: true,

  },
  scheduledTrips: {
    type: Number,
    required: true
  },
  scheduledKM: {
    type: Number,
    required: true
  },
  nightOut: {
    type: Number,
    default: 0
  },
  routeName: {
    type: Schema.Types.ObjectId,
    ref: "Route",
    required: true,
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  }
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

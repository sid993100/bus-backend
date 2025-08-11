import { Schema } from "mongoose";

const passengerBookingSchema = new Schema({
  pnr: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  vehicleNumber: {
    type: String,
    uppercase: true
  },
  depot: {
    type: String,
    required: true,
    uppercase: true
  },
  tripLabel: {
    type: String,
    required: true,
    uppercase: true
  },
  journeyDate: {
    type: Date,
    required: true
  },
  departureFromOrigin: {
    type: String,
    required: true
  },
  departureBoardingPoint: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true,
    uppercase: true
  },
  destination: {
    type: String,
    required: true,
    uppercase: true
  },
  routeName: {
    type: String,
    required: true,
    uppercase: true
  },
  passengerName: {
    type: String,
    required: true,
    uppercase: true
  },
  passengerMobile: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/
  },
  seatNumbers: [{
    type: String,
    required: true
  }],
  totalFare: {
    type: Number,
    required: true,
    min: 0
  },
  bookingStatus: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['CONFIRMED', 'CANCELLED', 'TRIP_CANCELLED'],
    default: 'CONFIRMED'
  },
  paymentStatus: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['PAID', 'PENDING', 'REFUNDED'],
    default: 'PENDING'
  }
}, {
  timestamps: true
});

const PassengerBooking= model("passengerBooking",passengerBookingSchema)
export default PassengerBooking
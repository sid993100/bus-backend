import { model, Schema } from "mongoose";


const seatLayoutSchema = new Schema({
  layoutName: {
    type: String,
    required: true,
    uppercase: true,
    unique: true
  },
  seatCapacity: {
    type: Number,
    required: true,
    min: 1
  },
  department: {
    type: String,
    required: true,
    uppercase: true,
    enum:["PUBLICTRANSPORT","ENFORCEMENT","STORE"],
    default:"PUBLICTRANSPORT"
  },
  servicesLinked: [{
    type: String,
    uppercase: true
  }],
  fci: {
    type: Number,
    required: true
  },
//   layout: {
//     type: Schema.Types.Mixed // For storing the seat layout configuration
//   }
}, {
  timestamps: true
});

const SeatLayout= model("SeatLayout",seatLayoutSchema)
export default SeatLayout
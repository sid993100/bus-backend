import { Schema, model } from 'mongoose';

const tollSchema = new Schema({
  code: {
    type: String,
    required: true,
    uppercase: true,
    unique: true,
    trim: true,
    maxlength: 10,
    index: true
  },
  tollName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true,
    uppercase:true
  },
  typeA: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'Type A must be an integer'
    }
  },
  typeB: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'Type B must be an integer'
    }
  },
  state: {
    type: String,
    required: true,
  
  },
  country: {
    type:String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      
    }
  }
}, {
  timestamps: true,
});
const Toll = model('Toll', tollSchema);
export default Toll;
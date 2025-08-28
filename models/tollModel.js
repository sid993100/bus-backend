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
    index: true
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
   type:Schema.Types.ObjectId,
   ref:"Strate"
  },
  country: {
   type:Schema.Types.ObjectId,
   ref:"Country"
  },
  isActive: {
    type: Boolean,
    default: true
  },
  latitude:{
    type:Number
    },
    longitude:Number
}, {
  timestamps: true,
});
const Toll = model('Toll', tollSchema);
export default Toll;
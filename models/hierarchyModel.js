import { Schema, model } from 'mongoose';

const hierarchySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50,
    uppercase: true
  },
  level: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 4
  },
 
 
}, {
  timestamps: true
});

// Compound index for performance
hierarchySchema.index({ level: 1, isActive: 1 });

const Hierarchy = model('Hierarchy', hierarchySchema);
export default Hierarchy;

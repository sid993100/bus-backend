import {model, Schema } from 'mongoose';

const eventCategorySchema = new Schema({
    name: { type: String, required: true, unique: true,index: true },   
    description: { type: String },
})

const EventCategory =model('EventCategory', eventCategorySchema);
export default  EventCategory;
import { model, Schema } from "mongoose";

const faqCategorySchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
}, { timestamps: true });

const FAQCategory = model("FAQCategory", faqCategorySchema);

export default FAQCategory;

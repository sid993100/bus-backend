import { model, Schema } from "mongoose";

const faqSchema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: {
     type: Schema.Types.ObjectId,
      ref: "FAQCategory",
      required: true
    },
}, { timestamps: true});

const FAQ = model("FAQ", faqSchema);

export default FAQ;

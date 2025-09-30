import { model, Schema } from "mongoose";

const contactSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone:{ type: Number, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
});

const Contact=model("Contact",contactSchema)

export default Contact;

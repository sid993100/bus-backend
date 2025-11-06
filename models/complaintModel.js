import { model, Schema } from "mongoose";

// Counter schema to manage sequences safely
const counterSchema = new Schema(
  {
    key: { type: String, required: true, unique: true }, // e.g., "complaint"
    left: { type: Number, default: 1 },                  // left block (1..9999)
    right: { type: Number, default: 0 }                  // right block (0..9999)
  },
  { timestamps: true }
);

const Counter = model("Counter", counterSchema);

// Helper to zero-pad
function pad4(n) {
  return String(n).padStart(4, "0");
}

// Reserve next id atomically
async function reserveNextComplaintId(session = null) {
  // Try to increment right; if it hits 9999, roll left and reset right
  const opts = { new: true, upsert: true, setDefaultsOnInsert: true };
  if (session) opts.session = session;

  // First attempt: increment right
  let doc = await Counter.findOneAndUpdate(
    { key: "complaint", right: { $lt: 9999 } },
    { $inc: { right: 1 } },
    opts
  );

  // If no doc returned (right already 9999), roll over to next left
  if (!doc) {
    doc = await Counter.findOneAndUpdate(
      { key: "complaint" },
      {
        $inc: { left: 1 },
        $set: { right: 1 }
      },
      { ...opts }
    );
  }

  const leftBlock = doc.left;
  const rightBlock = doc.right;

  return `C${pad4(leftBlock)}-${pad4(rightBlock)}`;
}

const complaintSchema = new Schema(
  {
    complaintId: {
    type: String,
    unique: true,
    index: true
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "ComplaintCategory",
      required: true
    },
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: "ComplaintSubCategory",
      required: true
    },
    description: { type: String },
    image: [{ type: String }],
    status: {
      type: String,
      enum: [ "INPROGRESS", "CLOSED"],
      default: "INPROGRESS"
    }
  },
  { timestamps: true }
);

// Pre-validate hook to set complaintId if missing
complaintSchema.pre("validate", async function (next) {
  try {
    if (!this.complaintId) {
      // Optionally use a transaction if you're already in one; otherwise simple call
      this.complaintId = await reserveNextComplaintId();
    }
    next();
  } catch (err) {
    next(err);
  }
});

const Complaint = model("Complaint", complaintSchema);
export default Complaint;

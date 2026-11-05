const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String, index: true },
    plan: { type: String, enum: ["pro", "premium"], required: true },
    billing: { type: String, enum: ["monthly", "yearly"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
      index: true,
    },
    failureReason: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

module.exports.Payment = mongoose.model("Payment", paymentSchema);

const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },
    plan: { type: String, enum: ["free", "pro", "premium"], default: "free" },
    billing: { type: String, enum: ["monthly", "yearly"] },
    status: { type: String, enum: ["active", "expired"], default: "active" },
    expiresAt: Date,
  },
  { timestamps: true },
);

/** Plan the user can actually use right now (expired paid plans fall back to free). */
subscriptionSchema.statics.effective = async function (userId) {
  const sub = await this.findOne({ user: userId }).lean();
  if (!sub || sub.plan === "free") return { plan: "free", status: "active" };
  if (!sub.expiresAt || sub.expiresAt < new Date())
    return { ...sub, plan: "free", status: "expired" };
  return sub;
};

module.exports = mongoose.model("Subscription", subscriptionSchema);

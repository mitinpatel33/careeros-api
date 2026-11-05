const Razorpay = require("razorpay");
const { Payment } = require("../models/Payment");
const Subscription = require("../models/Subscription");
const { BILLING_DAYS, PLANS } = require("../config/plans");
const { verifyCheckoutSignature } = require("../utils/signature");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const DAY = 24 * 60 * 60 * 1000;

/** Marks the payment paid (once) and extends / starts the subscription. Safe to call twice. */
const activate = async (orderId, paymentId) => {
  const payment = await Payment.findOneAndUpdate(
    { orderId, status: { $ne: "paid" } },
    {
      $set: { status: "paid", paymentId, paidAt: new Date() },
      $unset: { failureReason: "" },
    },
    { new: true },
  );
  if (!payment) return Payment.findOne({ orderId }); // already processed (verify + webhook race)

  const current = await Subscription.findOne({ user: payment.user });
  const stillActive =
    current &&
    current.expiresAt &&
    current.expiresAt > new Date() &&
    current.plan === payment.plan;
  const start = stillActive ? current.expiresAt : new Date();

  await Subscription.findOneAndUpdate(
    { user: payment.user },
    {
      plan: payment.plan,
      billing: payment.billing,
      status: "active",
      expiresAt: new Date(
        start.getTime() + BILLING_DAYS[payment.billing] * DAY,
      ),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return payment;
};

// POST /api/payments/order   { planId, billing }
exports.createOrder = async (req, res) => {
  try {
    const { planId, billing } = req.body;
    const plan = PLANS[planId];
    if (
      !plan ||
      planId === "free" ||
      !["monthly", "yearly"].includes(billing)
    ) {
      return res.status(400).json({ message: "Invalid plan or billing cycle" });
    }

    const amount = plan.price[billing] * 100; // paise
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `cos_${String(req.user.id).slice(-8)}_${Date.now()}`.slice(
        0,
        40,
      ),
      notes: { userId: String(req.user.id), planId, billing },
    });

    await Payment.create({
      user: req.user.id,
      orderId: order.id,
      plan: planId,
      billing,
      amount,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      description: `Career OS ${plan.name} (${billing})`,
    });
  } catch (err) {
    console.error("createOrder:", err);
    res
      .status(500)
      .json({ message: "Could not start the payment. Please try again." });
  }
};

// POST /api/payments/verify   { razorpay_order_id, razorpay_payment_id, razorpay_signature }
exports.verify = async (req, res) => {
  try {
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = req.body;

    const payment = await Payment.findOne({ orderId, user: req.user.id });
    if (!payment) return res.status(404).json({ message: "Order not found" });

    const ok = verifyCheckoutSignature({
      orderId,
      paymentId,
      signature,
      secret: process.env.RAZORPAY_KEY_SECRET,
    });
    if (!ok) {
      if (payment.status !== "paid") {
        await Payment.updateOne(
          { _id: payment._id },
          { status: "failed", failureReason: "Signature mismatch" },
        );
      }
      return res.status(400).json({ message: "Payment verification failed" });
    }

    await activate(orderId, paymentId);
    const sub = await Subscription.effective(req.user.id);
    res.json({
      plan: sub.plan,
      billing: sub.billing,
      expiresAt: sub.expiresAt,
    });
  } catch (err) {
    console.error("verify:", err);
    res.status(500).json({ message: "Verification error" });
  }
};

// POST /api/payments/webhook  (mounted with express.raw – see app.js)
exports.webhook = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const ok = verifyWebhookSignature({
    rawBody: req.body, // Buffer
    signature,
    secret: process.env.RAZORPAY_WEBHOOK_SECRET,
  });
  if (!ok) return res.status(400).send("Invalid signature");

  try {
    const event = JSON.parse(req.body.toString("utf8"));
    const entity = event?.payload?.payment?.entity;

    if (event.event === "payment.captured" && entity?.order_id) {
      await activate(entity.order_id, entity.id);
    } else if (event.event === "payment.failed" && entity?.order_id) {
      await Payment.updateOne(
        { orderId: entity.order_id, status: "created" },
        {
          status: "failed",
          paymentId: entity.id,
          failureReason: entity.error_description,
        },
      );
    }
    res.json({ received: true });
  } catch (err) {
    console.error("webhook:", err);
    res.status(500).send("Webhook error");
  }
};

// GET /api/payments/me
exports.me = async (req, res) => {
  const [subscription, payments] = await Promise.all([
    Subscription.effective(req.user.id),
    Payment.find({ user: req.user.id, status: { $ne: "created" } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("orderId paymentId plan billing amount status paidAt createdAt")
      .lean(),
  ]);
  res.json({
    subscription: {
      plan: subscription.plan,
      billing: subscription.billing,
      status: subscription.status,
      expiresAt: subscription.expiresAt,
    },
    payments,
  });
};

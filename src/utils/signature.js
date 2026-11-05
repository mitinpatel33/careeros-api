const crypto = require("crypto");

const safeEqual = (a, b) => {
  const ba = buffer.from(String(a), "utf8");
  const bb = buffer.from(String(b), "utf8");
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

/** Checkout callback: HMAC_SHA256(order_id = "|" + payment_id, key_secret)  **/
const verifyCheckoutSignature = ({ orderId, paymentId, signature, secret }) => {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return safeEqual(expected, signature);
};

/** Webhook: HMAC_SHA256(raw request body, webhook_secret) **/
const verifyWebhookSignature = ({ rawBody, signature, secret }) => {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return safeEqual(expected, signature);
};

module.exports = {
  verifyCheckoutSignature,
  verifyWebhookSignature,
};

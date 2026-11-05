const Subscription = require("../models/Subscription");
const { PLANS } = require("../config/plans");

/** Usage: router.post("/publish", auth, requirePlan("pro"), publishHandler) */
module.exports = (minPlan) => async (req, res, next) => {
  try {
    const sub = await Subscription.effective(req.user.id);
    if (PLANS[sub.plan].rank >= PLANS[minPlan].rank) {
      req.subscription = sub;
      return next();
    }
    res.status(402).json({
      code: "UPGRADE_REQUIRED",
      requiredPlan: minPlan,
      message: `This needs the ${PLANS[minPlan].name} plan`,
    });
  } catch (err) {
    next(err);
  }
};

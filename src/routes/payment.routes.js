const router = require("express").Router();
const {
  createOrder,
  verify,
  me,
} = require("../controllers/payment.controller");
const { authorize } = require("../middlewares/auth.middleware");

router.post("/order", authorize, createOrder);
router.post("/verify", authorize, verify);
router.get("/me", authorize, me);

module.exports = router;

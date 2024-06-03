// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Define routes
router.post("/place-order", orderController.placeOrder);
router.put("/:orderId/status", orderController.updateOrderStatusById);
router.get("/order-history/:customerId", orderController.getOrderHistory);
router.get("/", orderController.getOrders);
router.get("/counts", orderController.getOrdersCounts);
router.get("/checkout-session", orderController.getCheckoutSession);
// router.post(
//   "/webhook",
//   bodyParser.raw({ type: "application/json" }),
//   orderController.handleStripeWebhook
// );
module.exports = router;

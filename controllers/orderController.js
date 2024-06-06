// controllers/orderController.js
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const User = require("../models/User");
const notificationController = require("./notificationController");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const endpointSecret = "whsec_omar";
//Get Order Counts

const getCheckoutSession = async (req, res) => {
  try {
    //1) Get the Cart item
    const customer = req.user.userId;

    const cart = await Cart.findOne({ user: customer }).populate(
      "items.product"
    );
    for (const item of cart.items) {
      if (item.quantity > item.product.quantity) {
        return res.status(400).json({
          message: `Requested quantity for ${item.productName} is not available.`,
        });
      }
    }
    //2) Create Chechout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: cart.items.map((item) => ({
        price_data: {
          currency: "inr",
          product_data: {
            name: item.productName,
          },
          unit_amount: item.product.price * 100,
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `http://localhost:8080/api/v1/orders/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get("host")}/api/v1/cart/`,
      metadata: { customerId: customer || req.user.userId },
    });

    //3) Create Session as Response
    res.json({
      message: "Session Created successfully",
      session,
      id: session.id,
    });
  } catch (error) {
    console.error("Create Session Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const handleSuccess = async (req, res) => {
  console.log(req.query);
  const sessionId = req.query.session_id;
  console.log("sessionId", sessionId);
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  console.log("session", session);
  if (session.payment_status) {
    const customerId = session.metadata.customerId;
    const cart = await Cart.findOne({ user: customerId }).populate(
      "items.product"
    );

    if (!cart) {
      console.error("Cart not found for customer:", customerId);
      return res.status(400).send("Cart not found");
    }

    const totalPrice = cart.items.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);

    const newOrder = new Order({
      customer: customerId,
      items: cart.items,
      totalPrice,
    });
    await newOrder.save();

    await Cart.findOneAndUpdate({ user: customerId }, { $set: { items: [] } });

    var productId = cart.items[0].product._id;
    var product = await Product.findById(productId);
    await notificationController.createNotification(
      customerId,
      productId,
      product.owner,
      "Create new Order successfully",
      "success"
    );

    console.log("Order placed successfully:", newOrder);
    res.redirect("http://localhost:3000/");
  } else {
    res.send("Payment not completed.");
  }
};
//Handle Webhook Stripe
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error("Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    console.log("event", event);

    try {
      const session = event.data.object;
      console.log("session", session);

      const customerId = session.metda_data.customerId;
      const cart = await Cart.findOne({ user: customerId }).populate(
        "items.product"
      );

      if (!cart) {
        console.error("Cart not found for customer:", customerId);
        return res.status(400).send("Cart not found");
      }

      const totalPrice = cart.items.reduce((total, item) => {
        return total + item.product.price * item.quantity;
      }, 0);

      const newOrder = new Order({
        customer: customerId,
        items: cart.items,
        totalPrice,
      });
      await newOrder.save();

      await Cart.findOneAndUpdate(
        { user: customerId },
        { $set: { items: [] } }
      );

      var productId = cart.items[0].product._id;
      var product = await Product.findById(productId);
      await notificationController.createNotification(
        customerId,
        productId,
        product.owner,
        "Create new Order successfully",
        "success"
      );

      console.log("Order placed successfully:", newOrder);
      return res.status(200).send("Received webhook");
    } catch (err) {
      console.log("Failed to create order:", err);
      return res.status(500).send();
    }
  } else {
    return res.status(200).send();
  }
};

// Place a new order
const placeOrder = async (req, res) => {
  try {
    const customer = req.user.userId;

    const cart = await Cart.findOne({ user: customer }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message:
          "Cart is empty. Add items to the cart before placing an order.",
      });
    }

    const totalPrice = cart.items.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);

    const newOrder = new Order({ customer, items: cart.items, totalPrice });
    await newOrder.save();

    await Cart.findOneAndUpdate({ user: customer }, { $set: { items: [] } });

    var productId = cart.items[0].product._id;
    console.log(productId);
    var product = await Product.findById(productId);
    console.log(product);
    await notificationController.createNotification(
      customer,
      productId,
      product.owner,
      "Create new Order successfully",
      "success"
    );
    res
      .status(201)
      .json({ message: "Order placed successfully", order: newOrder });
  } catch (error) {
    console.error("Place Order Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getOrdersCounts = async (req, res) => {
  try {
    try {
      const counts = await Order.countDocuments();
      return res.status(201).json({ counts });
    } catch (validationError) {
      console.log(validationError);
      let message = "Validation error";
      for (let key in validationError.errors) {
        message = validationError.errors[key].message;
      }
      return res.status(400).json({ message });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get order history for a customer
const getOrderHistory = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const orders = await Order.find({ customer: customerId }).sort({
      createdAt: "desc",
    });

    res.status(200).json({ orders });
  } catch (error) {
    console.error("Get Order History Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getOrders = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const user = await User.findById(ownerId);
    if (user == null) {
      res.status(403).json({ message: "User not found" });
    }
    let orders = {};
    if (user.is_owner) {
      const products = await Product.find({ owner: ownerId });
      const productIds = products.map((product) => product._id);

      // Find orders with products owned by the specified owner
      orders = await Order.find({ "items.product": { $in: productIds } })
        .populate({
          path: "customer",
          model: "User",
          select: "username",
        })
        .exec();
    } else {
      orders = await Order.find({ customer: ownerId })
        .populate({
          path: "customer",
          model: "User",
          select: "username",
        })
        .exec();
    }

    res.status(200).json({ orders, count: orders.length });
  } catch (error) {
    console.error("Get Order History Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateOrderStatusById = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res
      .status(200)
      .json({ message: "Order updated successfully", Order: updatedOrder });
  } catch (error) {
    console.error("Update Order by ID Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
module.exports = {
  placeOrder,
  getOrderHistory,
  getOrders,
  updateOrderStatusById,
  getOrdersCounts,
  getCheckoutSession,
  handleStripeWebhook,
  handleSuccess,
};

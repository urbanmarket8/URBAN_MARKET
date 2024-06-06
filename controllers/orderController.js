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
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message:
          "Cart is empty. Add items to your cart before proceeding to checkout.",
      });
    }

    for (const item of cart.items) {
      if (item.quantity > item.product.quantity) {
        return res.status(400).json({
          message: `Requested quantity for ${item.productName} is not available.`,
        });
      }
    }
    const lineItems = cart.items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.productName,
        },
        unit_amount: item.product.price * 100,
      },
      quantity: item.quantity,
    }));

    if (!lineItems) {
      return res.status(400).json({
        message: "No items to be paid in the cart",
      });
    }
    const totalAmountInRupees = cart.items.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);

    // Convert total amount from INR to USD
    const totalAmountInUSD = totalAmountInRupees / 74;

    if (totalAmountInUSD < 0.5) {
      return res.status(400).json({
        message:
          "Total amount for checkout must be at least 50 cents (INR 37.50).",
      });
    }

    //2) Create Chechout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.API_URL}/api/v1/orders/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get("host")}/api/v1/cart/`,
      metadata: {
        customerId: customer || req.user.userId,
        token: req?.headers?.authorization,
      },
    });

    if (!session) {
      return res.status(402).json({
        message: "Something wrong during checkout..",
      });
    }
    //3) Create Session as Response
    res.json({
      message: "Session Created successfully",
      id: session.id,
    });
  } catch (error) {
    console.error("Create Session Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const handleSuccess = async (req, res) => {
  try {
    const sessionId = req.query.session_id;

    const session = await stripe.checkout.sessions.retrieve(sessionId);
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
      const token = session.token;

      res.header("Authorization", token);
      res.redirect(process.env.CUSTOMER_URL);
    } else {
      res.send("Payment not completed.");
    }
  } catch (error) {
    console.error("Handle Success Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
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
    var product = await Product.findById(productId);
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
  handleSuccess,
};

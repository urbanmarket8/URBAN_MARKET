// controllers/orderController.js
const Order = require('../models/Order');
const Cart = require('../models/Cart');

// Place a new order
const placeOrder = async (req, res) => {
    try {
        const { customer } = req.body;

        // Find the user's cart
        const cart = await Cart.findOne({ user: customer }).populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty. Add items to the cart before placing an order.' });
        }

        // Calculate total price based on cart items
        const totalPrice = cart.items.reduce((total, item) => {
            return total + item.product.price * item.quantity;
        }, 0);

        // Create a new order
        const newOrder = new Order({ customer, items: cart.items, totalPrice });
        await newOrder.save();

        // Clear the user's cart after placing the order
        await Cart.findOneAndUpdate({ user: customer }, { $set: { items: [] } });

        res.status(201).json({ message: 'Order placed successfully', order: newOrder });
    } catch (error) {
        console.error('Place Order Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Get order history for a customer
const getOrderHistory = async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const orders = await Order.find({ customer: customerId }).sort({ createdAt: 'desc' });

        res.status(200).json({ orders });
    } catch (error) {
        console.error('Get Order History Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    placeOrder,
    getOrderHistory,
};

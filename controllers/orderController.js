// controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const notificationController = require('./notificationController');

// Place a new order
const placeOrder = async (req, res) => {
    try {
        const customer = req.user.userId;

        const cart = await Cart.findOne({ user: customer }).populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty. Add items to the cart before placing an order.' });
        }

        const totalPrice = cart.items.reduce((total, item) => {
            return total + item.product.price * item.quantity;
        }, 0);

        const newOrder = new Order({ customer, items: cart.items, totalPrice });
        await newOrder.save();

        await Cart.findOneAndUpdate({ user: customer }, { $set: { items: [] } });

        var productId = cart.items[0].product._id;
        console.log(productId);
        var product = await Product.findById(productId)
        console.log(product);
        await notificationController.createNotification(customer, productId, product.owner, "Create new Order successfully", "success");
        res.status(201).json({ message: 'Order placed successfully', order: newOrder });
    } catch (error) {
        console.error('Place Order Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getOrdersCounts = async (req, res) => {
    try {
        try {
            const counts = await Order.countDocuments();
            return res.status(201).json({ counts });
        } catch (validationError) {
            console.log(validationError)
            let message = "Validation error";
            for (let key in validationError.errors) {
                message = validationError.errors[key].message;
            }
            return res.status(400).json({ message });
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Internal Server Error' });
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

const getOrders = async (req, res) => {
    try {
        const ownerId = req.user.userId;
        const user = await User.findById(ownerId);
        if (user == null) {
            res.status(403).json({ message: 'User not found' });
        }
        let orders = {};
        if (user.is_owner) {
            const products = await Product.find({ owner: ownerId });
            const productIds = products.map(product => product._id);

            // Find orders with products owned by the specified owner
            orders = await Order.find({ 'items.product': { $in: productIds } })
                .populate({
                    path: 'customer',
                    model: 'User',
                    select: 'username',
                })
                .exec();
        }
        else {
            orders = await Order.find({ 'customer': ownerId })
                .populate({
                    path: 'customer',
                    model: 'User',
                    select: 'username',
                })
                .exec();
        }


        res.status(200).json({ orders, count: orders.length });
    } catch (error) {
        console.error('Get Order History Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
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
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json({ message: 'Order updated successfully', Order: updatedOrder });
    } catch (error) {
        console.error('Update Order by ID Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
module.exports = {
    placeOrder,
    getOrderHistory,
    getOrders,
    updateOrderStatusById,
    getOrdersCounts
};

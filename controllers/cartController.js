// controllers/cartController.js
const Cart = require('../models/Cart');

// Add a product to the cart
const addToCart = async (req, res) => {
    try {
        const { user, product, quantity } = req.body;

        let cart = await Cart.findOne({ user });

        if (!cart) {
            cart = new Cart({ user, items: [] });
        }

        // Check if the product is already in the cart
        const existingItemIndex = cart.items.findIndex(item => item.product.equals(product));

        if (existingItemIndex !== -1) {
            // Update quantity if the product is already in the cart
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add a new item to the cart
            cart.items.push({ product, quantity });
        }

        await cart.save();

        res.status(201).json({ message: 'Product added to the cart successfully', cart });
    } catch (error) {
        console.error('Add to Cart Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Get the user's cart
const getCart = async (req, res) => {
    try {
        const userId = req.params.userId;
        const cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price');

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        res.status(200).json({ cart });
    } catch (error) {
        console.error('Get Cart Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Delete a product from the cart
const deleteFromCart = async (req, res) => {
    try {
        const { userId, productId } = req.params;

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Filter out the item to be deleted
        cart.items = cart.items.filter(item => !item.product.equals(productId));

        await cart.save();

        res.status(200).json({ message: 'Product deleted from the cart successfully', cart });
    } catch (error) {
        console.error('Delete from Cart Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


module.exports = {
    addToCart,
    getCart,
    deleteFromCart
};

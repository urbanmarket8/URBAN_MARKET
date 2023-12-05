// controllers/shopController.js
const Shop = require('../models/shop');

// Create a new shop
const createShop = async (req, res) => {
    try {
        const { name, description, owner } = req.body;
        const newShop = new Shop({ name, description, owner });
        await newShop.save();
        res.status(201).json({ message: 'Shop created successfully', shop: newShop });
    } catch (error) {
        console.error('Create Shop Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Get all shops
const getAllShops = async (req, res) => {
    try {
        const shops = await Shop.find();
        res.status(200).json({ shops });
    } catch (error) {
        console.error('Get Shops Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Get a single shop by ID
const getShopById = async (req, res) => {
    try {
        const shopId = req.params.id;
        const shop = await Shop.findById(shopId).populate('owner', 'name email'); // Populate owner details
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }
        res.status(200).json({ shop });
    } catch (error) {
        console.error('Get Shop by ID Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Update a shop by ID
const updateShopById = async (req, res) => {
    try {
        const shopId = req.params.id;
        const { name, description } = req.body;
        const updatedShop = await Shop.findByIdAndUpdate(
            shopId,
            { name, description },
            { new: true } // Return the updated document
        );
        if (!updatedShop) {
            return res.status(404).json({ message: 'Shop not found' });
        }
        res.status(200).json({ message: 'Shop updated successfully', shop: updatedShop });
    } catch (error) {
        console.error('Update Shop by ID Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Delete a shop by ID
const deleteShopById = async (req, res) => {
    try {
        const shopId = req.params.id;
        const deletedShop = await Shop.findByIdAndDelete(shopId);
        if (!deletedShop) {
            return res.status(404).json({ message: 'Shop not found' });
        }
        res.status(200).json({ message: 'Shop deleted successfully', shop: deletedShop });
    } catch (error) {
        console.error('Delete Shop by ID Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    createShop,
    getAllShops,
    getShopById,
    updateShopById,
    deleteShopById,
};

const Shop = require('../models/Shop');

// Create a new shop
const createShop = async (req, res) => {
    try {
        const { name, description, owner, address, socialMedia } = req.body;
        const newShop = new Shop({ name, description, owner, address, socialMedia });
        await newShop.save();
        res.status(201).json({ message: 'Shop created successfully', shop: newShop });
    } catch (error) {
        console.error('Create Shop Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Get a single shop by ID
const getShopById = async (req, res) => {
    try {
        let owner = req.user.userId;
        const shop = await Shop.find({ owner: owner }).populate('owner', 'first_name last_name email phone_number') // Populate owner details
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }
        res.status(200).json({ shop });
    } catch (error) {
        console.error('Get Shop by ID Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Get a single shop by ID
const getAllShop = async (req, res) => {
    try {
        const shop = await Shop.find() // Populate owner details
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }
        res.status(200).json({ shop });
    } catch (error) {
        console.error('Get Shop by ID Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getShopByOwnerId = async (owner) => {
    try {
        const shop = await Shop.findOne({ owner: owner });
        if (!shop) {
            return null;
        }
        return shop;
    } catch (error) {
        return null;
    }
};

const updateShopById = async (req, res) => {
    try {
        let owner = req.user.userId;
        let { name, description, shop_location, socialMedia } = req.body;
        const { lat, lng } = JSON.parse(shop_location);
        socialMedia = JSON.parse(socialMedia);
        const updatedShop = await Shop.findOneAndUpdate(
            { owner: owner },
            { name, description, "address.location": { type: "Point", coordinates: [lng, lat] }, socialMedia },
            { new: true }
        );
        console.log(updatedShop);
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
    getShopById,
    updateShopById,
    deleteShopById,
    getShopByOwnerId,
    getAllShop
};

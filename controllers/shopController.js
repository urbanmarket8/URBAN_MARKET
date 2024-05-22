const Shop = require('../models/Shop');
const User = require('../models/User');
const Product = require('../models/Product');

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

const checkAdminStatus = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) return false;
        return user.isAdmin;
    } catch (err) {
        console.error('Error checking admin status:', err);
        return false;
    }
};

const getAllShopsForAdmin = async (req, res) => {
    const isAdmin = await checkAdminStatus(req.user.userId);
    if (!isAdmin)
        return res.status(403).send({ success: false, message: 'User is not an admin' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;

    try {
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
            ];
        }

        const shops = await Shop.find(query)
            .skip((page - 1) * limit)
            .limit(limit);

        const count = await Shop.countDocuments(query);

        res.json({
            success: true,
            data: shops,
            total: count,
            pages: Math.ceil(count / limit),
            current_page: page
        });
    } catch (error) {
        res.status(500).send({ success: false, message: 'Server Error', error: error.message });
    }
};

// Get a single shop by ID
const getAllShop = async (req, res) => {
    try {
        const latitude = req.headers['x-user-latitude'];
        const longitude = req.headers['x-user-longitude'];
        if (latitude && longitude) {
            const nearestShops = await Shop.find({
                'address.location': {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(longitude), parseFloat(latitude)]
                        },
                        $maxDistance: 5000
                    }
                }
            }).limit(5);
            res.status(200).json({ shop: nearestShops });
        }
        const shop = await Shop.find() // Populate owner details
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }
        res.status(200).json({ shop });
    } catch (error) {
        console.error('Get Shop by ID Error:', error);
        // res.status(500).json({ message: 'Internal Server Error' });
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
        const { lat, lng } = shop_location;
        socialMedia = socialMedia;
        const updatedShop = await Shop.findOneAndUpdate(
            { owner: new Object(owner) },
            { name, description, "address.location": { type: "Point", coordinates: [lng, lat] }, socialMedia },
            { new: true }
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


const deleteShopById = async (req, res) => {
    try {
        const shopId = req.params.id;

        const shop = await Shop.findById(shopId).populate('owner products');
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        // Delete the shop's owner (user)
        await User.findByIdAndDelete(shop.owner._id);

        // Delete all products associated with the shop
        for (const product of shop.products) {
            await Product.findByIdAndDelete(product._id);
        }

        // Finally, delete the shop itself
        const deletedShop = await Shop.findByIdAndDelete(shopId);

        res.status(200).json({ message: 'Shop deleted successfully', shop: deletedShop });
    } catch (error) {
        console.error('Delete Shop by ID Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const approveShop = async (req, res) => {
    try {
        const shop = await Shop.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
        res.status(200).json(shop);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
module.exports = {
    createShop,
    getShopById,
    updateShopById,
    deleteShopById,
    getShopByOwnerId,
    getAllShop,
    getAllShopsForAdmin,
    approveShop
};

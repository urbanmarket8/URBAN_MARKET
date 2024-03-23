const Notification = require('../models/Notification');
const User = require('../models/User');

// Get a single shop by ID
const getShopNotification = async (req, res) => {
    try {
        let owner = req.user.userId;
        const notifications = await Notification.find();
        console.log(notifications);
        res.json(notifications);
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const createNotification = async (userId, productId, shopId, message, type) => {
    try {
        console.log(productId)
        console.log(shopId)
        const newNotification = new Notification({
            userId,
            productId,
            shopId,
            message,
            type,
        });

        const savedNotification = await newNotification.save();

        return savedNotification;
    } catch (error) {
        console.error('Create Notification Error:', error);
        throw error;
    }
};

module.exports = {
    getShopNotification,
    createNotification
};

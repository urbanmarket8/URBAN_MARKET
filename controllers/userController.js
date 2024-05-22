// controllers/authController.js
const User = require('../models/User');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const getUsersCounts = async (req, res) => {
    try {
        try {
            const counts = await User.countDocuments();
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

const getAllUsers = async (req, res) => {
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
                { email: { $regex: search, $options: "i" } },
                { first_name: { $regex: search, $options: "i" } },
                { last_name: { $regex: search, $options: "i" } }
            ];
        }

        const users = await User.find(query)
            .skip((page - 1) * limit)
            .limit(limit);

        const count = await User.countDocuments(query);

        res.json({
            success: true,
            data: users,
            total: count,
            pages: Math.ceil(count / limit),
            current_page: page
        });
    } catch (error) {
        res.status(500).send({ success: false, message: 'Server Error', error: error.message });
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

async function hashPassword(password) {
    return bcrypt.hash(password, 8);
}

const createUser = async (req, res) => {
    const isAdmin = await checkAdminStatus(req.user.userId);
    if (!isAdmin)
        return res.status(403).send({ success: false, message: 'User is not an admin' });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { phone_number, first_name, middle_name, last_name, publishing_name, email, password, status } = req.body;
        // Hash the password
        const hashedPassword = await hashPassword(password);
        const newUser = new User({
            email: email.toLowerCase(),
            password: hashedPassword,
            phone_number,
            first_name,
            middle_name,
            last_name,
            middle_name,
            publishing_name,
            status,
            is_author_completed: 0,
            created_at: new Date(),
            updated_at: new Date()
        });
        await newUser.save();
        res.status(201).json({
            success: true
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const deleteUser = async (req, res) => {
    const isAdmin = await checkAdminStatus(req.user.userId);
    if (!isAdmin)
        return res.status(403).send({ success: false, message: 'User is not an admin' });

    const userId = req.params.userId;
    try {
        if (userId == undefined)
            return res.status(400).json({ success: false, message: 'Id not found' });
        await User.findByIdAndDelete(userId);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const makeUserAdmin = async (req, res) => {
    const userId = req.params.userId;
    try {
        await User.findByIdAndUpdate(userId, { isAdmin: true });
        res.json({ success: true, message: 'User is now an admin' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getUserProfile = async (req, res) => {
    const userId = req.user.userId;
    try {
        if (userId == undefined)
            return res.status(400).json({ success: false, message: 'Id not found' });
        var user = await User.findById(userId);
        res.json({
            success: true,
            data: user,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllUsers,
    checkAdminStatus,
    createUser,
    deleteUser,
    makeUserAdmin,
    getUserProfile,
    getUsersCounts
};

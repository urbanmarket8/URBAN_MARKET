// controllers/authController.js
const User = require('../models/User');
const Shop = require('../models/Shop');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const crypto = require('crypto');
const sendVerificationEmail = require("../utils/emailConnection")
const generateVerifyToken = () => {
    return crypto.randomBytes(16).toString('hex');
};

const register = async (req, res) => {
    try {
        const { email, password, first_name, last_name, phone_number, is_owner } = req.body.data.attributes;
        const user = new User({ email, username: email, password, first_name, last_name, phone_number, is_owner });

        try {
            user.verify_token = generateVerifyToken();
            await user.save();
            sendVerificationEmail(email, user.verify_token);
            return res.status(201).json({ message: 'User registered successfully' });
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

const login = async (req, res) => {
    try {
        const { email, password } = req.body.data.attributes;
        console.log(email)
        const user = await User.findOne({ email: email });
        console.log(user)
        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({
                errors: [{ detail: "Invalid password..." }],
            });
        }

        if (!user.isVerified) {
            return res.status(400).json({
                errors: [{ detail: "Please verify your account..." }],
            });
        }

        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7h' });
        return res.json({
            token_type: "Bearer",
            expires_in: "7h",
            access_token: token,
            refresh_token: token,
        });
    } catch (error) {
        return res.status(400).json({
            errors: [{ detail: "Internal Server Error" }],
        });
    }
};

const logout = async (req, res) => {
    return res.sendStatus(204);
};

const verify = async (req, res) => {
    const { token } = req.params;
    try {
        const user = await User.findOne({ verify_token: token });

        if (!user) {
            return res.status(404).json({ message: 'User not found or token is invalid' });
        }

        user.isVerified = true;
        await user.save();
        if (user.is_owner) {
            const newShop = new Shop({
                name: `${user.first_name + ' ' + user.last_name}'s Shop`, // You can customize the shop name
                owner: user._id,
            });
            await newShop.save();
        }

        return res.redirect('http://localhost:3000/auth/login');
    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
module.exports = { register, login, logout, verify };

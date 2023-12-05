// controllers/authController.js
const User = require('../models/User');
const sendVerificationEmail = require('../utils/emailConnection');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const crypto = require('crypto');

const generateVerifyToken = () => {
    return crypto.randomBytes(16).toString('hex');
};

const register = async (req, res) => {
    try {
        const { email, username, password, first_name, last_name, phone_number } = req.body;
        const user = new User({ email, username, password, first_name, last_name, phone_number });

        try {
            user.verify_token = generateVerifyToken();
            await user.save();
            sendVerificationEmail(email, user.verify_token);
            res.status(201).json({ message: 'User registered successfully' });
        } catch (validationError) {
            console.log(validationError)
            const errors = [];
            for (let key in validationError.errors) {
                errors.push(validationError.errors[key].message);
            }
            res.status(400).json({ errors });
        }
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7h' });
        res.json({ token });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const verify = async (req, res) => {
    const { token } = req.params;
    try {
        // Find the user by the verification token
        const user = await User.findOne({ verify_token: token });

        if (!user) {
            return res.status(404).json({ message: 'User not found or token is invalid' });
        }

        user.isVerified = true;
        user.verify_token = null;
        await user.save();

        return res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
module.exports = { register, login, verify };

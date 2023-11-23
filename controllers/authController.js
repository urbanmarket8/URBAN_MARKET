// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

const register = async (req, res) => {
    try {
        const { email, username, password, first_name, last_name, phone_number } = req.body;
        const user = new User({ email, username, password, first_name, last_name, phone_number });

        try {
            await user.save();
            res.status(201).json({ message: 'User registered successfully' });
        } catch (validationError) {
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

module.exports = { register, login };

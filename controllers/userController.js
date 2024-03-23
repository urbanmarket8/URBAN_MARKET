// controllers/authController.js
const User = require('../models/User');

exports.getUsersCounts = async (req, res) => {
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
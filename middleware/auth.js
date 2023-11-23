// middleware/auth.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

const authenticate = (req, res, next) => {
    const authToken = req.headers.authorization;

    if (!authToken) {
        return res.status(401).json({ message: 'Unauthorized - Missing Authorization Header' });
    }

    try {
        const decoded = jwt.verify(authToken, JWT_SECRET);
        req.user = decoded; // Attach user information to the request object
        next();
    } catch (error) {
        console.error('JWT Verification Error:', error);
        res.status(401).json({ message: 'Unauthorized - Invalid Token' });
    }
};

module.exports = { authenticate };

require('dotenv').config();
const express = require('express');
const connectDB = require('./db/connection');
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRouter = require('./routes/auth'); // New line
app.use('/api/v1/auth', authRouter);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

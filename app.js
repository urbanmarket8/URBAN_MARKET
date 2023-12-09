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
const authRouter = require('./routes/auth');
const productRouter = require('./routes/products');
const shopRouter = require('./routes/shops');
const orderRouter = require('./routes/order');
const cartRouter = require('./routes/cart');

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/product', productRouter);
app.use('/api/v1/shop', shopRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/cart', cartRouter);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

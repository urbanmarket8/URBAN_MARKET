require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const express = require('express');
const { authenticate } = require('./middleware/auth');

const connectDB = require('./db/connection');
const app = express();

const corsOptions = {
    origin: function (origin, callback) {
        callback(null, true)
        // if (!origin || whitelist.indexOf(origin) !== -1) {
        //   callback(null, true);
        // } else {
        //   callback(new Error("Not allowed by CORS"));
        // }
    },
    credentials: true,
};

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ type: "application/vnd.api+json", strict: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRouter = require('./routes/auth');
const userRouter = require('./routes/users');
const productRouter = require('./routes/products');
const shopRouter = require('./routes/shops');
const orderRouter = require('./routes/order');
const cartRouter = require('./routes/cart');
const notificationRouter = require('./routes/notification');

app.use('/api/v1/auth', authRouter);

app.use(authenticate);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/product', productRouter);
app.use('/api/v1/shop', shopRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/notification', notificationRouter);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// controllers/productController.js
const Product = require('../models/product');

// Create a new product
const createProduct = async (req, res) => {
    try {
        const { name, description, price, quantity, category } = req.body;
        const newProduct = new Product({ name, description, price, quantity, category });
        newProduct.owner = req.user;
        try {
            await newProduct.save();
            res.status(201).json({ message: 'Product created successfully', product: newProduct });

        } catch (validationError) {
            console.log(validationError)
            const errors = [];
            for (let key in validationError.errors) {
                errors.push(validationError.errors[key].message);
            }
            res.status(400).json({ errors });
        }
    } catch (error) {
        console.error('Create Product Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Get all products
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json({ products });
    } catch (error) {
        console.error('Get Products Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Get a single product by ID
const getProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ product });
    } catch (error) {
        console.error('Get Product by ID Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Update a product by ID
const updateProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, description, price, quantity, category } = req.body;
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { name, description, price, quantity, category },
            { new: true }
        );
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
        console.error('Update Product by ID Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Delete a product by ID
const deleteProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        const deletedProduct = await Product.findByIdAndDelete(productId);
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully', product: deletedProduct });
    } catch (error) {
        console.error('Delete Product by ID Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProductById,
    deleteProductById,
};

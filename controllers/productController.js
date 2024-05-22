// controllers/productController.js
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Cart = require('../models/Cart');
const { ObjectId } = require('mongodb');

// Create a new product
// const createProduct = async (req, res) => {
//     try {
//         const { name, description, price, quantity, category } = req.body;
//         const newProduct = new Product({ name, description, price, quantity, category });
//         newProduct.owner = req.user.userId;
//         try {
//             await newProduct.save();
//             res.status(201).json({ message: 'Product created successfully', product: newProduct });

//         } catch (validationError) {
//             console.log(validationError)
//             const errors = [];
//             for (let key in validationError.errors) {
//                 errors.push(validationError.errors[key].message);
//             }
//             res.status(400).json({ errors });
//         }
//     } catch (error) {
//         console.error('Create Product Error:', error);
//         res.status(500).json({ message: 'Internal Server Error' });
//     }
// };

// Get a single product by ID
const getAllShopProducts = async (req, res) => {
    try {
        const owner = req.user.userId;
        const products = await Product.find({ owner: new ObjectId(owner) });
        res.status(200).json({ products });
    } catch (error) {
        console.error('Get Product by ID Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getProductCounts = async (req, res) => {
    try {
        try {
            const counts = await Product.countDocuments();
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

const getAllProducts = async (req, res) => {
    try {
        let query = {};
        const latitude = req.headers['x-user-latitude'];
        const longitude = req.headers['x-user-longitude'];
        const { searchText, category, shopId, page = 1, limit = 10, Nearby } = req.body;

        if (searchText && searchText != "") {
            query.name = { $regex: searchText, $options: 'i' };
        }
        if (category && category != "") {
            query.category = category;
        }
        if (shopId && shopId != "") {
            const shop = await Shop.findById(shopId);
            const ownerId = shop?.owner;
            query.owner = new ObjectId(ownerId);
        }
        if (latitude && longitude) {
            const nearestShops = await Shop.find({
                'address.location': {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(longitude), parseFloat(latitude)]
                        },
                        $maxDistance: 5000
                    }
                }
            }).limit(5);

            if (nearestShops.length > 0) {
                const ownerIds = nearestShops.map(shop => shop.owner.toString());
                query.owner = { $in: ownerIds };
            } else {
                return res.json({ products: [] });
            }
        }
        const skip = (page - 1) * limit;
        const products = await Product.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .exec();

        if (products.length === 0) {
            return res.status(404).json({ message: 'No products found with the specified criteria' });
        }

        // Get cart items for the user
        const userId = req.user.userId;
        const userCart = await Cart.findOne({ user: userId }).populate('items.product');

        // Add product quantity to each product in the response
        const productsWithQuantity = products.map(product => {
            const cartItem = userCart?.items.find(item => item.product._id.equals(product._id));
            const quantity = cartItem ? cartItem.quantity : 0;
            return { ...product._doc, quantity };
        });

        res.status(200).json({ products: productsWithQuantity });
    } catch (error) {
        console.error('Get Products Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


const createProduct = async (req, res) => {
    try {
        const { name, description, quantity, category, price } = req.body;

        let product;
        let owner = req.user.userId;
        let image = [];

        if (req.files && req.files.length > 0) {
            image = req.files.map(file => file.path); // Map each file to its path
        }

        if (req.params.id) {
            product = await Product.findByIdAndUpdate(
                req.params.id,
                { name, description, quantity, category, price, image, owner },
                { new: true }
            );
        } else {
            // Create new product
            product = new Product({ name, description, quantity, category, price, image, owner });
            console.log(product)

            await product.save();
        }

        res.status(200).json({ product });
    } catch (error) {
        console.error('Error creating/updating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
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
        console.log("updatedProduct")
        console.log(updatedProduct)
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

        // If the product is deleted successfully, remove it from all carts
        await Cart.updateMany(
            { 'items.product': productId },
            { $pull: { items: { product: productId } } }
        );

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
    getAllShopProducts,
    getProductCounts
};

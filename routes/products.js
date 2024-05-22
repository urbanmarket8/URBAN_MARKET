const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Specify the destination folder for images
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

// Define routes
router.post('/', upload.array('images', 10), productController.createProduct);
router.post('/search', productController.getAllProducts);
router.get('/', productController.getAllShopProducts);
router.get('/:id', productController.getProductById);
router.get('/all/counts', productController.getProductCounts);
router.put('/:id', upload.none(), productController.updateProductById);
router.delete('/:id', productController.deleteProductById);


module.exports = router;

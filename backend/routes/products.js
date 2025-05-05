const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET all products
router.get('/', async (req, res) => {
  try {
    const { category, featured, featuredProduct, limit = 10, page = 1 } = req.query;
    
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    // Support both parameter names for backwards compatibility
    if (featuredProduct === 'true' || featured === 'true') {
      filter.featuredProduct = true;
    }
    
    console.log('Product filter:', filter); // Debug log
    
    const count = await Product.countDocuments(filter);
    const products = await Product.find(filter, { 
      limit: parseInt(limit), 
      skip: (parseInt(page) - 1) * parseInt(limit),
      sort: 'created_at DESC'
    });
    
    console.log(`Found ${products.length} products with featured status:`, 
      products.map(p => ({ id: p.id, name: p.name, featured: p.featuredProduct }))
    ); // Debug log
    
    res.status(200).json({
      products,
      page: parseInt(page),
      pages: Math.ceil(count / parseInt(limit)),
      total: count
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET featured products
router.get('/featured', async (req, res) => {
  try {
    console.log('GET /api/products/featured - Fetching featured products');
    
    // First, check all products to debug
    const allProducts = await Product.find({}, { limit: 10 });
    console.log('GET /api/products/featured - All products with featured status:',
      allProducts.map(p => ({ id: p.id, name: p.name, featured: p.featuredProduct }))
    );
    
    // Now specifically query for featured products
    const products = await Product.find({ featuredProduct: true }, { limit: 6 });
    
    console.log(`GET /api/products/featured - Found ${products.length} featured products:`, 
      products.map(p => ({ id: p.id, name: p.name, featured: p.featuredProduct }))
    );
    
    // Return only the featured products
    res.json(products);
  } catch (error) {
    console.error('Error getting featured products:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST create a new product (admin only)
router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      images,
      materials,
      dimensions,
      weight,
      colors,
      inStock,
      featuredProduct,
      customizationOptions,
      printTime
    } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      images: images || [],
      materials: materials || [],
      dimensions,
      weight,
      colors: colors || [],
      inStock,
      featuredProduct,
      customizationOptions,
      printTime
    });

    if (!product) {
      return res.status(400).json({ message: 'Invalid product data' });
    }

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT update a product (admin only)
router.put('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    console.log('PUT /api/products/:id - Request body:', req.body);
    console.log('PUT /api/products/:id - Current product state:', {
      id: product.id,
      name: product.name,
      featuredProduct: product.featuredProduct
    });
    
    const {
      name,
      description,
      price,
      category,
      images,
      materials,
      dimensions,
      weight,
      colors,
      inStock,
      featuredProduct,
      customizationOptions,
      printTime
    } = req.body;
    
    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = price;
    if (category) product.category = category;
    if (images) product.images = images;
    if (materials) product.materials = materials;
    if (dimensions) product.dimensions = dimensions;
    if (weight) product.weight = weight;
    if (colors) product.colors = colors;
    if (inStock !== undefined) product.inStock = inStock;
    if (featuredProduct !== undefined) {
      console.log(`PUT /api/products/:id - Setting featuredProduct from ${product.featuredProduct} to ${featuredProduct}`);
      product.featuredProduct = featuredProduct;
    }
    if (customizationOptions) product.customizationOptions = customizationOptions;
    if (printTime !== undefined) product.printTime = printTime;
    
    console.log('PUT /api/products/:id - Product after updates:', {
      id: product.id,
      name: product.name,
      featuredProduct: product.featuredProduct
    });
    
    const updated = await product.save();
    
    if (!updated) {
      return res.status(400).json({ message: 'Could not update product' });
    }
    
    const refreshedProduct = await Product.findById(req.params.id);
    
    console.log('PUT /api/products/:id - Refreshed product after save:', {
      id: refreshedProduct.id,
      name: refreshedProduct.name,
      featuredProduct: refreshedProduct.featuredProduct
    });
    
    res.status(200).json(refreshedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE a product (admin only)
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const deleted = await product.delete();
    
    if (!deleted) {
      return res.status(400).json({ message: 'Could not delete product' });
    }
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
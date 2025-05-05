const { getPool } = require('../config/db');

class Product {
  constructor(productData) {
    this.id = productData.id;
    this.name = productData.name;
    this.description = productData.description;
    this.price = productData.price;
    this.category = productData.category;
    this.inStock = productData.in_stock === 1;
    // Make sure we convert any boolean-like values correctly
    this.featuredProduct = productData.featured_product === 1 || productData.featured_product === true;
    this.printTime = productData.print_time;
    this.createdAt = productData.created_at;
    this.updatedAt = productData.updated_at;
    
    // These will be populated by related tables
    this.images = [];
    this.materials = [];
    this.colors = [];
    this.dimensions = null;
    this.weight = null;
    this.customizationOptions = null;
  }

  // Find all products with optional filtering
  static async find(filter = {}, options = {}) {
    try {
      const pool = getPool();
      if (!pool) return [];

      let query = 'SELECT * FROM products WHERE 1=1';
      const params = [];

      // Apply filters
      if (filter.category) {
        query += ' AND category = ?';
        params.push(filter.category);
      }

      if (filter.featuredProduct) {
        query += ' AND featured_product = 1';
      }

      if (filter.inStock !== undefined) {
        query += ' AND in_stock = ?';
        params.push(filter.inStock ? 1 : 0);
      }

      // Apply sorting
      query += ' ORDER BY ' + (options.sort || 'created_at DESC');

      // Apply pagination
      const limit = options.limit ? parseInt(options.limit) : 100;
      const skip = options.skip ? parseInt(options.skip) : 0;
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, skip);

      const [rows] = await pool.query(query, params);
      
      // Create product objects with populated data
      const products = [];
      for (const row of rows) {
        const product = new Product(row);
        await product.populate();
        products.push(product);
      }
      
      return products;
    } catch (error) {
      console.error('Error finding products:', error);
      return [];
    }
  }

  // Find a product by ID
  static async findById(id) {
    try {
      const pool = getPool();
      if (!pool) return null;

      const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const product = new Product(rows[0]);
      
      // Populate product data
      await product.populate();
      
      return product;
    } catch (error) {
      console.error('Error finding product by ID:', error);
      return null;
    }
  }

  // Count products with optional filtering
  static async countDocuments(filter = {}) {
    try {
      const pool = getPool();
      if (!pool) return 0;

      let query = 'SELECT COUNT(*) as count FROM products WHERE 1=1';
      const params = [];

      // Apply filters
      if (filter.category) {
        query += ' AND category = ?';
        params.push(filter.category);
      }

      if (filter.featuredProduct) {
        query += ' AND featured_product = 1';
      }

      if (filter.inStock !== undefined) {
        query += ' AND in_stock = ?';
        params.push(filter.inStock ? 1 : 0);
      }

      const [result] = await pool.query(query, params);
      return result[0].count;
    } catch (error) {
      console.error('Error counting products:', error);
      return 0;
    }
  }

  // Create a new product
  static async create(productData) {
    try {
      const pool = getPool();
      if (!pool) return null;

      // Start a transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Insert the product
        const [productResult] = await connection.query(
          `INSERT INTO products (
            name, description, price, category, in_stock,
            featured_product, print_time
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            productData.name,
            productData.description,
            productData.price,
            productData.category,
            productData.inStock !== false ? 1 : 0,
            productData.featuredProduct ? 1 : 0,
            productData.printTime || null
          ]
        );

        const productId = productResult.insertId;

        // Insert product images
        if (productData.images && productData.images.length > 0) {
          for (const imageUrl of productData.images) {
            await connection.query(
              'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)',
              [productId, imageUrl]
            );
          }
        }

        // Insert product materials
        if (productData.materials && productData.materials.length > 0) {
          for (const material of productData.materials) {
            await connection.query(
              'INSERT INTO product_materials (product_id, name, price) VALUES (?, ?, ?)',
              [productId, material.name, material.price || 0]
            );
          }
        }

        // Insert product colors
        if (productData.colors && productData.colors.length > 0) {
          for (const color of productData.colors) {
            await connection.query(
              'INSERT INTO product_colors (product_id, color) VALUES (?, ?)',
              [productId, color]
            );
          }
        }

        // Insert product dimensions
        if (productData.dimensions) {
          await connection.query(
            `INSERT INTO product_dimensions (
              product_id, width, height, depth, unit
            ) VALUES (?, ?, ?, ?, ?)`,
            [
              productId,
              productData.dimensions.width || null,
              productData.dimensions.height || null,
              productData.dimensions.depth || null,
              productData.dimensions.unit || 'cm'
            ]
          );
        }

        // Insert product weight
        if (productData.weight) {
          await connection.query(
            `INSERT INTO product_weight (
              product_id, value, unit
            ) VALUES (?, ?, ?)`,
            [
              productId,
              productData.weight.value || null,
              productData.weight.unit || 'g'
            ]
          );
        }

        // Insert product customization options
        if (productData.customizationOptions) {
          await connection.query(
            `INSERT INTO product_customization_options (
              product_id, can_customize_size, can_customize_color,
              can_customize_material, can_customize_design
            ) VALUES (?, ?, ?, ?, ?)`,
            [
              productId,
              productData.customizationOptions.canCustomizeSize ? 1 : 0,
              productData.customizationOptions.canCustomizeColor ? 1 : 0,
              productData.customizationOptions.canCustomizeMaterial ? 1 : 0,
              productData.customizationOptions.canCustomizeDesign ? 1 : 0
            ]
          );
        }

        // Commit the transaction
        await connection.commit();
        connection.release();

        // Return the newly created product
        return await Product.findById(productId);
      } catch (error) {
        // Rollback in case of error
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error creating product:', error);
      return null;
    }
  }

  // Update a product
  async save() {
    try {
      const pool = getPool();
      if (!pool) return false;

      // Start a transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Update the product
        await connection.query(
          `UPDATE products SET
            name = ?, description = ?, price = ?,
            category = ?, in_stock = ?, featured_product = ?,
            print_time = ?
          WHERE id = ?`,
          [
            this.name,
            this.description,
            this.price,
            this.category,
            this.inStock ? 1 : 0,
            this.featuredProduct ? 1 : 0,
            this.printTime,
            this.id
          ]
        );

        // Delete existing related data
        await connection.query('DELETE FROM product_images WHERE product_id = ?', [this.id]);
        await connection.query('DELETE FROM product_materials WHERE product_id = ?', [this.id]);
        await connection.query('DELETE FROM product_colors WHERE product_id = ?', [this.id]);
        await connection.query('DELETE FROM product_dimensions WHERE product_id = ?', [this.id]);
        await connection.query('DELETE FROM product_weight WHERE product_id = ?', [this.id]);
        await connection.query('DELETE FROM product_customization_options WHERE product_id = ?', [this.id]);

        // Insert updated images
        if (this.images && this.images.length > 0) {
          for (const imageUrl of this.images) {
            await connection.query(
              'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)',
              [this.id, imageUrl]
            );
          }
        }

        // Insert updated materials
        if (this.materials && this.materials.length > 0) {
          for (const material of this.materials) {
            await connection.query(
              'INSERT INTO product_materials (product_id, name, price) VALUES (?, ?, ?)',
              [this.id, material.name, material.price || 0]
            );
          }
        }

        // Insert updated colors
        if (this.colors && this.colors.length > 0) {
          for (const color of this.colors) {
            await connection.query(
              'INSERT INTO product_colors (product_id, color) VALUES (?, ?)',
              [this.id, color]
            );
          }
        }

        // Insert updated dimensions
        if (this.dimensions) {
          await connection.query(
            `INSERT INTO product_dimensions (
              product_id, width, height, depth, unit
            ) VALUES (?, ?, ?, ?, ?)`,
            [
              this.id,
              this.dimensions.width || null,
              this.dimensions.height || null,
              this.dimensions.depth || null,
              this.dimensions.unit || 'cm'
            ]
          );
        }

        // Insert updated weight
        if (this.weight) {
          await connection.query(
            `INSERT INTO product_weight (
              product_id, value, unit
            ) VALUES (?, ?, ?)`,
            [
              this.id,
              this.weight.value || null,
              this.weight.unit || 'g'
            ]
          );
        }

        // Insert updated customization options
        if (this.customizationOptions) {
          await connection.query(
            `INSERT INTO product_customization_options (
              product_id, can_customize_size, can_customize_color,
              can_customize_material, can_customize_design
            ) VALUES (?, ?, ?, ?, ?)`,
            [
              this.id,
              this.customizationOptions.canCustomizeSize ? 1 : 0,
              this.customizationOptions.canCustomizeColor ? 1 : 0,
              this.customizationOptions.canCustomizeMaterial ? 1 : 0,
              this.customizationOptions.canCustomizeDesign ? 1 : 0
            ]
          );
        }

        // Commit the transaction
        await connection.commit();
        connection.release();

        return true;
      } catch (error) {
        // Rollback in case of error
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error saving product:', error);
      return false;
    }
  }

  // Delete a product
  async delete() {
    try {
      const pool = getPool();
      if (!pool) return false;

      // Delete the product (cascade delete will remove related data)
      await pool.query('DELETE FROM products WHERE id = ?', [this.id]);

      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }

  // Populate product with related data
  async populate() {
    try {
      const pool = getPool();
      if (!pool) return this;

      // Populate images
      const [imageRows] = await pool.query(
        'SELECT image_url FROM product_images WHERE product_id = ?',
        [this.id]
      );
      
      this.images = imageRows.map(row => row.image_url);

      // Populate materials
      const [materialRows] = await pool.query(
        'SELECT name, price FROM product_materials WHERE product_id = ?',
        [this.id]
      );
      
      this.materials = materialRows.map(row => ({
        name: row.name,
        price: row.price
      }));

      // Populate colors
      const [colorRows] = await pool.query(
        'SELECT color FROM product_colors WHERE product_id = ?',
        [this.id]
      );
      
      this.colors = colorRows.map(row => row.color);

      // Populate dimensions
      const [dimensionRows] = await pool.query(
        'SELECT width, height, depth, unit FROM product_dimensions WHERE product_id = ?',
        [this.id]
      );
      
      if (dimensionRows.length > 0) {
        this.dimensions = {
          width: dimensionRows[0].width,
          height: dimensionRows[0].height,
          depth: dimensionRows[0].depth,
          unit: dimensionRows[0].unit
        };
      }

      // Populate weight
      const [weightRows] = await pool.query(
        'SELECT value, unit FROM product_weight WHERE product_id = ?',
        [this.id]
      );
      
      if (weightRows.length > 0) {
        this.weight = {
          value: weightRows[0].value,
          unit: weightRows[0].unit
        };
      }

      // Populate customization options
      const [optionRows] = await pool.query(
        `SELECT 
          can_customize_size, can_customize_color,
          can_customize_material, can_customize_design
        FROM product_customization_options
        WHERE product_id = ?`,
        [this.id]
      );
      
      if (optionRows.length > 0) {
        this.customizationOptions = {
          canCustomizeSize: optionRows[0].can_customize_size === 1,
          canCustomizeColor: optionRows[0].can_customize_color === 1,
          canCustomizeMaterial: optionRows[0].can_customize_material === 1,
          canCustomizeDesign: optionRows[0].can_customize_design === 1
        };
      }

      return this;
    } catch (error) {
      console.error('Error populating product:', error);
      return this;
    }
  }
}

module.exports = Product;
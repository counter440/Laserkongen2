const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// MySQL connection pool
let pool = null;

const connectDB = async () => {
  try {
    // Check if we already have a pool
    if (pool) {
      console.log('Using existing MySQL connection pool');
      return pool;
    }
    
    console.log('Creating new MySQL connection pool with these parameters:');
    console.log({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'laserkongen',
      database: process.env.MYSQL_DATABASE || 'laserkongen',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'laserkongen',
      password: process.env.MYSQL_PASSWORD || 'password',
      database: process.env.MYSQL_DATABASE || 'laserkongen',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
    
    // Verify connection
    const connection = await pool.getConnection();
    console.log('MySQL Connected Successfully');
    
    // Test the connection with a simple query
    const [result] = await connection.query('SELECT 1 as test');
    console.log('Database test query result:', result);
    
    connection.release();
    
    // Register connection error handler
    pool.on('error', (err) => {
      console.error('MySQL pool error:', err);
      // Attempt to reconnect
      setTimeout(() => {
        console.log('Attempting to reconnect to MySQL...');
        connectDB();
      }, 5000); // Try again after 5 seconds
    });
    
    // Initialize database structure
    await initializeDatabase();
    
    // Check if we need to seed the database
    await seedDatabaseIfEmpty();
    
    return pool;
  } catch (error) {
    console.error(`Error connecting to MySQL: ${error.message}`);
    console.error('Database connection failed - application will not function correctly without database!');
    console.error('Please check your database configuration and ensure MySQL server is running.');
    
    // Attempt to reconnect
    console.log('Will attempt to reconnect in 5 seconds...');
    setTimeout(() => {
      connectDB();
    }, 5000); // Try again after 5 seconds
    
    return null;
  }
};

// Function to check if database connection is alive
const pingDatabase = async () => {
  if (!pool) return false;
  
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database ping failed:', error);
    return false;
  }
};

// Function to initialize database tables
const initializeDatabase = async () => {
  try {
    if (!pool) {
      console.error('Cannot initialize database: No pool available');
      return;
    }
    
    const connection = await pool.getConnection();
    
    console.log('Initializing database tables...');
    
    // Create settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY category_name (category, name)
      )
    `);
    
    // Create contact_forms table to store form submissions
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contact_forms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        status ENUM('new', 'in-progress', 'completed', 'read', 'replied', 'archived') DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('customer', 'admin') DEFAULT 'customer',
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create address table for users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        street VARCHAR(255),
        city VARCHAR(255),
        state VARCHAR(255),
        postal_code VARCHAR(50),
        country VARCHAR(100),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category ENUM('3d-printing', 'laser-engraving', 'custom', 'ready-made') NOT NULL,
        in_stock BOOLEAN DEFAULT TRUE,
        featured_product BOOLEAN DEFAULT FALSE,
        print_time DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create product_images table for multiple images per product
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT,
        image_url VARCHAR(255),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    
    // Create product_materials table for multiple materials per product
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT,
        name VARCHAR(100),
        price DECIMAL(10, 2),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    
    // Create product_colors table for multiple colors per product
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_colors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT,
        color VARCHAR(50),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    
    // Create product_dimensions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_dimensions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT,
        width DECIMAL(10, 2),
        height DECIMAL(10, 2),
        depth DECIMAL(10, 2),
        unit VARCHAR(10) DEFAULT 'cm',
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    
    // Create product_weight table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_weight (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT,
        value DECIMAL(10, 2),
        unit VARCHAR(10) DEFAULT 'g',
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    
    // Create product_customization_options table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_customization_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT,
        can_customize_size BOOLEAN DEFAULT FALSE,
        can_customize_color BOOLEAN DEFAULT FALSE,
        can_customize_material BOOLEAN DEFAULT FALSE,
        can_customize_design BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    
    // Create orders table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        payment_method ENUM('credit-card', 'paypal', 'stripe', 'bank-transfer'),
        items_price DECIMAL(10, 2) DEFAULT 0,
        tax_price DECIMAL(10, 2) DEFAULT 0,
        shipping_price DECIMAL(10, 2) DEFAULT 0,
        total_price DECIMAL(10, 2) DEFAULT 0,
        status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        is_paid BOOLEAN DEFAULT FALSE,
        paid_at TIMESTAMP NULL,
        is_delivered BOOLEAN DEFAULT FALSE,
        delivered_at TIMESTAMP NULL,
        tracking_number VARCHAR(100),
        estimated_delivery_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    
    // Create order_items table for multiple items per order
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        product_id INT,
        name VARCHAR(255) NOT NULL,
        quantity INT DEFAULT 1,
        price DECIMAL(10, 2) NOT NULL,
        image TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);
    
    // Create uploaded_files table first (before it's referenced)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_name VARCHAR(255) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        path VARCHAR(255) NOT NULL,
        file_url VARCHAR(255) NOT NULL,
        thumbnail_url VARCHAR(255),
        size INT NOT NULL,
        mimetype VARCHAR(100) NOT NULL,
        user_id INT,
        file_type ENUM('3d-model', 'image', 'other') NOT NULL,
        processing_complete BOOLEAN DEFAULT FALSE,
        order_id INT,
        status ENUM('pending', 'processed', 'ordered', 'error') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    
    // Create order_custom_options table for custom items in order
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_custom_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_item_id INT,
        type ENUM('3d-printing', 'laser-engraving'),
        material VARCHAR(100),
        color VARCHAR(50),
        quality VARCHAR(50),
        infill INT,
        notes TEXT,
        file_url VARCHAR(255),
        uploaded_file_id INT,
        FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL
      )
    `);
    
    // Create order_shipping_address table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_shipping_address (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        full_name VARCHAR(255),
        address VARCHAR(255),
        city VARCHAR(255),
        postal_code VARCHAR(50),
        country VARCHAR(100),
        phone VARCHAR(50),
        email VARCHAR(255),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);
    
    // Create order_payment_results table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_payment_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        payment_id VARCHAR(100),
        status VARCHAR(50),
        update_time VARCHAR(50),
        email_address VARCHAR(255),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);
    
    // Update the uploaded_files table with order_id foreign key
    await connection.query(`
      ALTER TABLE uploaded_files 
      ADD FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    `);
    
    // Create model_data table for 3D model files
    await connection.query(`
      CREATE TABLE IF NOT EXISTS model_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_id INT,
        volume DECIMAL(10, 2),
        weight DECIMAL(10, 2),
        x DECIMAL(10, 2),
        y DECIMAL(10, 2),
        z DECIMAL(10, 2),
        print_time DECIMAL(10, 2),
        FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE
      )
    `);
    
    // Create saved_designs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS saved_designs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255),
        file_url VARCHAR(255),
        thumbnail_url VARCHAR(255),
        category ENUM('3d-printing', 'laser-engraving'),
        width DECIMAL(10, 2),
        height DECIMAL(10, 2),
        depth DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create wishlist table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        product_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    
    connection.release();
    console.log('Database tables initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Function to seed the database with initial data if it's empty
const seedDatabaseIfEmpty = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Check if we have any users
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    
    if (users[0].count === 0) {
      console.log('Seeding database with initial data...');
      
      // Create admin user with hashed password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const [adminResult] = await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin User', 'admin@laserkongen.no', hashedPassword, 'admin']
      );
      
      const adminId = adminResult.insertId;
      console.log('Admin user created with ID:', adminId);
      
      // Create sample products
      const [phoneStandResult] = await connection.query(
        'INSERT INTO products (name, description, price, category, in_stock, featured_product, print_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['Custom Phone Stand', 'A customizable phone stand that can be adjusted to any angle.', 24.99, '3d-printing', true, true, 3.5]
      );
      
      const phoneStandId = phoneStandResult.insertId;
      
      // Add phone stand image
      await connection.query(
        'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)',
        [phoneStandId, '/images/phone-stand.jpg']
      );
      
      // Add phone stand materials
      await connection.query(
        'INSERT INTO product_materials (product_id, name, price) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)',
        [phoneStandId, 'PLA', 0, phoneStandId, 'ABS', 2, phoneStandId, 'PETG', 3]
      );
      
      // Add phone stand colors
      await connection.query(
        'INSERT INTO product_colors (product_id, color) VALUES (?, ?), (?, ?), (?, ?), (?, ?)',
        [phoneStandId, 'Black', phoneStandId, 'White', phoneStandId, 'Blue', phoneStandId, 'Red']
      );
      
      // Add phone stand dimensions
      await connection.query(
        'INSERT INTO product_dimensions (product_id, width, height, depth, unit) VALUES (?, ?, ?, ?, ?)',
        [phoneStandId, 10, 15, 8, 'cm']
      );
      
      // Add phone stand weight
      await connection.query(
        'INSERT INTO product_weight (product_id, value, unit) VALUES (?, ?, ?)',
        [phoneStandId, 50, 'g']
      );
      
      // Add phone stand customization options
      await connection.query(
        'INSERT INTO product_customization_options (product_id, can_customize_size, can_customize_color, can_customize_material, can_customize_design) VALUES (?, ?, ?, ?, ?)',
        [phoneStandId, true, true, true, false]
      );
      
      // Create another sample product
      const [keychainResult] = await connection.query(
        'INSERT INTO products (name, description, price, category, in_stock, featured_product) VALUES (?, ?, ?, ?, ?, ?)',
        ['Personalized Keychain', 'Custom laser engraved keychain with your name or initials.', 14.99, 'laser-engraving', true, true]
      );
      
      const keychainId = keychainResult.insertId;
      
      // Add keychain image
      await connection.query(
        'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)',
        [keychainId, '/images/keychain.jpg']
      );
      
      // Add keychain materials
      await connection.query(
        'INSERT INTO product_materials (product_id, name, price) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)',
        [keychainId, 'Wood', 0, keychainId, 'Acrylic', 2, keychainId, 'Metal', 5]
      );
      
      // Add keychain colors
      await connection.query(
        'INSERT INTO product_colors (product_id, color) VALUES (?, ?), (?, ?), (?, ?), (?, ?), (?, ?)',
        [keychainId, 'Natural Wood', keychainId, 'Black', keychainId, 'Blue', keychainId, 'Red', keychainId, 'Green']
      );
      
      // Add keychain dimensions
      await connection.query(
        'INSERT INTO product_dimensions (product_id, width, height, depth, unit) VALUES (?, ?, ?, ?, ?)',
        [keychainId, 5, 2, 0.3, 'cm']
      );
      
      // Add keychain weight
      await connection.query(
        'INSERT INTO product_weight (product_id, value, unit) VALUES (?, ?, ?)',
        [keychainId, 15, 'g']
      );
      
      // Add keychain customization options
      await connection.query(
        'INSERT INTO product_customization_options (product_id, can_customize_size, can_customize_color, can_customize_material, can_customize_design) VALUES (?, ?, ?, ?, ?)',
        [keychainId, false, true, true, true]
      );
      
      console.log('Sample products created');
      
      // Create sample orders
      for (let i = 1; i <= 5; i++) {
        // Create order
        const isPaid = Math.random() > 0.5;
        const isDelivered = Math.random() > 0.7;
        const status = ['pending', 'processing', 'shipped', 'delivered'][Math.floor(Math.random() * 4)];
        
        const [orderResult] = await connection.query(
          `INSERT INTO orders 
          (user_id, payment_method, items_price, tax_price, shipping_price, total_price, status, is_paid, paid_at, is_delivered, delivered_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            i <= 3 ? adminId : null,
            'credit-card',
            24.99,
            6.25,
            10,
            41.24,
            status,
            isPaid,
            isPaid ? new Date() : null,
            isDelivered,
            isDelivered ? new Date() : null
          ]
        );
        
        const orderId = orderResult.insertId;
        
        // Add order item
        const [orderItemResult] = await connection.query(
          'INSERT INTO order_items (order_id, product_id, name, quantity, price, image) VALUES (?, ?, ?, ?, ?, ?)',
          [orderId, phoneStandId, 'Custom Phone Stand', Math.floor(Math.random() * 3) + 1, 24.99, '/images/phone-stand.jpg']
        );
        
        // Add shipping address
        await connection.query(
          `INSERT INTO order_shipping_address 
          (order_id, full_name, address, city, postal_code, country, phone, email) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, 'Test User', 'Test Street 123', 'Oslo', '0123', 'Norway', '12345678', 'test@example.com']
        );
      }
      
      console.log('Sample orders created');
      
      // Add default email settings
      await connection.query(`
        INSERT INTO settings (category, name, value) VALUES 
        ('email', 'contact_recipients', 'admin@laserkongen.no'),
        ('email', 'smtp_host', 'smtp.example.com'),
        ('email', 'smtp_port', '587'),
        ('email', 'smtp_user', 'user@example.com'),
        ('email', 'smtp_password', 'password'),
        ('email', 'smtp_from_email', 'noreply@laserkongen.no'),
        ('email', 'smtp_from_name', 'Laserkongen'),
        ('email', 'smtp_secure', 'false'),
        ('site', 'site_title', 'Laserkongen'),
        ('site', 'site_description', 'Din partner for 3D-printing og lasergravering'),
        ('site', 'company_name', 'Laserkongen AS'),
        ('site', 'company_address', 'Industriveien 42, 1482 Nittedal'),
        ('site', 'company_phone', '+47 123 45 678'),
        ('site', 'company_email', 'kontakt@laserkongen.no')
      `);
      
      console.log('Default settings created');
      
      connection.release();
      console.log('Database seeded successfully');
    } else {
      console.log('Database already has data, skipping seed');
      connection.release();
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

// A more robust getPool function that will attempt to reconnect if needed
const getPoolWithRetry = async () => {
  if (!pool) {
    console.log('No database pool available, attempting to connect...');
    await connectDB();
  }
  
  if (!pool) {
    console.error('Failed to establish database connection after retry');
    throw new Error('Database connection unavailable');
  }
  
  return pool;
};

// The synchronous version of getPool for backwards compatibility
const getPoolSync = () => {
  if (!pool) {
    console.error('No database pool available and cannot connect synchronously');
    console.error('This will likely cause errors. Please ensure connectDB() was called during server startup');
    return null;
  }
  return pool;
};

// Export the connection and helper functions
module.exports = {
  connectDB,
  getPool: getPoolSync,
  getPoolWithRetry,
  pingDatabase
};
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, getPoolWithRetry, pingDatabase } = require('../config/db');

// For debugging
const DEBUG = process.env.NODE_ENV === 'development';

class User {
  constructor(userData) {
    this.id = userData.id;
    this.name = userData.name;
    this.email = userData.email;
    this.password = userData.password;
    this.role = userData.role || 'customer';
    this.phone = userData.phone;
    this.createdAt = userData.created_at;
    this.updatedAt = userData.updated_at;
  }

  // Find user by ID
  static async findById(id) {
    try {
      if (DEBUG) {
        console.log('User.findById called with ID:', id);
      }
      
      // Use getPoolWithRetry to ensure we have a connection
      const pool = await getPoolWithRetry();

      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        if (DEBUG) {
          console.log(`No user found with ID: ${id}`);
        }
        return null;
      }
      
      if (DEBUG) {
        console.log(`Found user with ID ${id}:`, rows[0].email);
      }
      
      const user = new User(rows[0]);
      
      try {
        // Get address
        const [addressRows] = await pool.query('SELECT * FROM addresses WHERE user_id = ?', [id]);
        if (addressRows.length > 0) {
          user.address = {
            street: addressRows[0].street,
            city: addressRows[0].city,
            state: addressRows[0].state,
            postalCode: addressRows[0].postal_code,
            country: addressRows[0].country,
            phone: addressRows[0].phone
          };
          
          if (DEBUG) {
            console.log(`Found address for user ${id}:`, user.address);
          }
        }
        
        // Get orders
        const [orderRows] = await pool.query('SELECT id FROM orders WHERE user_id = ?', [id]);
        user.orders = orderRows.map(order => order.id);
        
        // Get saved designs
        const [designRows] = await pool.query('SELECT * FROM saved_designs WHERE user_id = ?', [id]);
        user.savedDesigns = designRows.map(design => ({
          id: design.id,
          name: design.name,
          fileUrl: design.file_url,
          thumbnailUrl: design.thumbnail_url,
          category: design.category,
          dimensions: {
            width: design.width,
            height: design.height,
            depth: design.depth
          },
          createdAt: design.created_at
        }));
        
        // Get wishlist
        const [wishlistRows] = await pool.query('SELECT product_id FROM wishlist WHERE user_id = ?', [id]);
        user.wishlist = wishlistRows.map(item => item.product_id);
      } catch (relatedDataError) {
        // Don't fail if we can't get related data, just log it
        console.error('Error getting related data for user:', relatedDataError);
      }
      
      return user;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error; // Throw the error to be handled by the caller
    }
  }

  // Find user by email
  static async findOne(criteria = {}) {
    try {
      if (DEBUG) {
        console.log('User.findOne called with criteria:', criteria);
      }
      
      // Use getPoolWithRetry to ensure we have a connection
      const pool = await getPoolWithRetry();

      let query = 'SELECT * FROM users WHERE 1 = 1';
      const params = [];
      
      if (criteria.email) {
        query += ' AND email = ?';
        params.push(criteria.email.toLowerCase());
        
        if (DEBUG) {
          console.log(`Searching for user with email: ${criteria.email.toLowerCase()}`);
        }
      }
      
      if (criteria.id) {
        query += ' AND id = ?';
        params.push(criteria.id);
        
        if (DEBUG) {
          console.log(`Searching for user with ID: ${criteria.id}`);
        }
      }
      
      const [rows] = await pool.query(query, params);
      
      if (rows.length === 0) {
        if (DEBUG) {
          console.log('No user found with the given criteria');
        }
        return null;
      }
      
      if (DEBUG) {
        console.log(`Found user:`, rows[0].email);
      }
      
      const user = new User(rows[0]);
      
      try {
        // Get address
        const [addressRows] = await pool.query('SELECT * FROM addresses WHERE user_id = ?', [user.id]);
        if (addressRows.length > 0) {
          user.address = {
            street: addressRows[0].street,
            city: addressRows[0].city,
            state: addressRows[0].state,
            postalCode: addressRows[0].postal_code,
            country: addressRows[0].country,
            phone: addressRows[0].phone
          };
          
          if (DEBUG) {
            console.log(`Found address for user ${user.id}:`, user.address);
          }
        }
        
        // Get orders
        const [orderRows] = await pool.query('SELECT id FROM orders WHERE user_id = ?', [user.id]);
        user.orders = orderRows.map(order => order.id);
      } catch (relatedDataError) {
        // Don't fail if we can't get related data, just log it
        console.error('Error getting related data for user:', relatedDataError);
      }
      
      return user;
    } catch (error) {
      console.error('Error finding user:', error);
      throw error; // Throw the error to be handled by the caller
    }
  }

  // Create new user
  static async create(userData) {
    try {
      if (DEBUG) {
        console.log('User.create called with:', { 
          name: userData.name, 
          email: userData.email,
          role: userData.role || 'customer',
          hasAddress: !!userData.address 
        });
      }
      
      // Use getPoolWithRetry to ensure we have a connection
      const pool = await getPoolWithRetry();

      // Hash password before saving
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Insert user
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
        [
          userData.name,
          userData.email.toLowerCase(),
          hashedPassword,
          userData.role || 'customer',
          userData.phone || null
        ]
      );
      
      const userId = result.insertId;
      
      if (DEBUG) {
        console.log(`Created new user with ID: ${userId}`);
      }
      
      // Insert address if provided
      if (userData.address) {
        await pool.query(
          'INSERT INTO addresses (user_id, street, city, state, postal_code, country, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            userId,
            userData.address.street || null,
            userData.address.city || null,
            userData.address.state || null,
            userData.address.postalCode || null,
            userData.address.country || null,
            userData.address.phone || null
          ]
        );
        
        if (DEBUG) {
          console.log(`Added address for user ${userId}`);
        }
      }
      
      // Return the new user
      return await User.findById(userId);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  async save() {
    try {
      if (DEBUG) {
        console.log(`User.save called for user ${this.id}`);
      }
      
      // Use getPoolWithRetry to ensure we have a connection
      const pool = await getPoolWithRetry();

      // Check if password needs to be hashed
      if (this.isModifiedPassword) {
        console.log(`User.save - Hashing password for user ${this.email} (${this.id})`);
        
        // Make sure we're not trying to hash an already hashed password
        // Bcrypt hashed passwords always start with $2a$, $2b$ or $2y$
        if (!this.password.startsWith('$2')) {
          const salt = await bcrypt.genSalt(10);
          this.password = await bcrypt.hash(this.password, salt);
          console.log(`User.save - Password hashed for user ${this.email}`);
        } else {
          console.log(`User.save - Password already appears to be hashed, skipping hash operation`);
        }
        
        delete this.isModifiedPassword;
      }
      
      // Update user
      await pool.query(
        'UPDATE users SET name = ?, email = ?, password = ?, role = ?, phone = ? WHERE id = ?',
        [this.name, this.email.toLowerCase(), this.password, this.role, this.phone, this.id]
      );
      
      if (DEBUG) {
        console.log(`Updated user record for ${this.id}`);
      }
      
      // Update or insert address
      if (this.address) {
        if (DEBUG) {
          console.log(`Updating address for user ${this.id}:`, this.address);
        }
        
        try {
          const [addressRows] = await pool.query('SELECT * FROM addresses WHERE user_id = ?', [this.id]);
          
          if (addressRows.length > 0) {
            if (DEBUG) {
              console.log(`Found existing address for user ${this.id}, updating it`);
            }
            
            await pool.query(
              'UPDATE addresses SET street = ?, city = ?, state = ?, postal_code = ?, country = ?, phone = ? WHERE user_id = ?',
              [
                this.address.street || null,
                this.address.city || null,
                this.address.state || null,
                this.address.postalCode || null,
                this.address.country || null,
                this.address.phone || null,
                this.id
              ]
            );
          } else {
            if (DEBUG) {
              console.log(`No existing address for user ${this.id}, creating new one`);
            }
            
            await pool.query(
              'INSERT INTO addresses (user_id, street, city, state, postal_code, country, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [
                this.id,
                this.address.street || null,
                this.address.city || null,
                this.address.state || null,
                this.address.postalCode || null,
                this.address.country || null,
                this.address.phone || null
              ]
            );
          }
          
          if (DEBUG) {
            console.log(`Address saved successfully for user ${this.id}`);
          }
        } catch (addressError) {
          console.error(`Error handling address for user ${this.id}:`, addressError);
          throw addressError;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error saving user:', error);
      throw error; // Throw the error to be handled by the caller
    }
  }

  // Check password
  async matchPassword(enteredPassword) {
    try {
      // Add debugging to track password matching
      console.log(`Checking password for user ${this.email} (${this.id})`);
      
      // Make sure the stored password is a bcrypt hash (should start with $2)
      if (!this.password.startsWith('$2')) {
        console.error(`WARNING: Stored password for ${this.email} is not a bcrypt hash`);
        return false;
      }
      
      const isMatch = await bcrypt.compare(enteredPassword, this.password);
      console.log(`Password match result for ${this.email}: ${isMatch}`);
      return isMatch;
    } catch (error) {
      console.error(`Error matching password for ${this.email}:`, error);
      return false;
    }
  }

  // Generate JWT token
  generateToken() {
    return jwt.sign(
      { 
        id: this.id, 
        role: this.role,
        email: this.email,
        // Add unique identifier to prevent token reuse after password change
        tokenVersion: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET || 'laserkongen_jwt_secret_key',
      { 
        expiresIn: '30d', // Increase expiration to 30 days for better user experience
        algorithm: 'HS256'
      }
    );
  }

  // Find users with pagination
  static async find(criteria = {}, options = {}) {
    try {
      const pool = getPool();
      if (!pool) return [];

      const limit = options.limit || 10;
      const offset = options.offset || 0;
      
      let query = 'SELECT * FROM users WHERE 1 = 1';
      const params = [];
      
      // Add criteria to query
      if (criteria.role) {
        query += ' AND role = ?';
        params.push(criteria.role);
      }
      
      // Add sorting
      query += ' ORDER BY created_at DESC';
      
      // Add pagination
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const [rows] = await pool.query(query, params);
      
      return rows.map(row => new User(row));
    } catch (error) {
      console.error('Error finding users:', error);
      return [];
    }
  }

  // Count users
  static async countDocuments(criteria = {}) {
    try {
      const pool = getPool();
      if (!pool) return 0;

      let query = 'SELECT COUNT(*) as count FROM users WHERE 1 = 1';
      const params = [];
      
      // Add criteria to query
      if (criteria.role) {
        query += ' AND role = ?';
        params.push(criteria.role);
      }
      
      const [rows] = await pool.query(query, params);
      
      return rows[0].count;
    } catch (error) {
      console.error('Error counting users:', error);
      return 0;
    }
  }
}

module.exports = User;
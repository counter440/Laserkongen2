const { getPool } = require('../config/db');

class VippsPayment {
  constructor(paymentData) {
    this.id = paymentData.id;
    this.orderId = paymentData.order_id;
    this.vippsOrderId = paymentData.vipps_order_id;
    this.amount = paymentData.amount;
    this.currency = paymentData.currency || 'NOK';
    this.status = paymentData.status || 'pending';
    this.paymentMethod = paymentData.payment_method || 'vipps';
    this.errorMessage = paymentData.error_message;
    this.redirectUrl = paymentData.redirect_url;
    this.transactionId = paymentData.transaction_id;
    this.createdAt = paymentData.created_at;
    this.updatedAt = paymentData.updated_at;
  }
  
  // Convert to a plain JavaScript object for JSON serialization
  toJSON() {
    return {
      id: this.id,
      orderId: this.orderId,
      vippsOrderId: this.vippsOrderId,
      amount: this.amount,
      currency: this.currency,
      status: this.status,
      paymentMethod: this.paymentMethod,
      errorMessage: this.errorMessage,
      redirectUrl: this.redirectUrl,
      transactionId: this.transactionId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Find all Vipps payments with optional filtering
  static async find(filter = {}, options = {}) {
    try {
      const pool = getPool();
      if (!pool) return [];

      let query = 'SELECT * FROM vipps_payments WHERE 1=1';
      const params = [];

      // Apply filters
      if (filter.orderId) {
        query += ' AND order_id = ?';
        params.push(filter.orderId);
      }

      if (filter.vippsOrderId) {
        query += ' AND vipps_order_id = ?';
        params.push(filter.vippsOrderId);
      }

      if (filter.status) {
        query += ' AND status = ?';
        params.push(filter.status);
      }

      // Apply sorting
      query += ' ORDER BY ' + (options.sort || 'created_at DESC');

      // Apply pagination
      const limit = options.limit ? parseInt(options.limit) : 10;
      const skip = options.skip ? parseInt(options.skip) : 0;
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, skip);

      const [rows] = await pool.query(query, params);
      
      return rows.map(row => new VippsPayment(row));
    } catch (error) {
      console.error('Error finding Vipps payments:', error);
      return [];
    }
  }

  // Find a Vipps payment by ID
  static async findById(id) {
    try {
      const pool = getPool();
      if (!pool) return null;

      const [rows] = await pool.query('SELECT * FROM vipps_payments WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return new VippsPayment(rows[0]);
    } catch (error) {
      console.error('Error finding Vipps payment by ID:', error);
      return null;
    }
  }

  // Find a Vipps payment by order ID
  static async findByOrderId(orderId) {
    try {
      const pool = getPool();
      if (!pool) return null;

      const [rows] = await pool.query('SELECT * FROM vipps_payments WHERE order_id = ?', [orderId]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return new VippsPayment(rows[0]);
    } catch (error) {
      console.error('Error finding Vipps payment by order ID:', error);
      return null;
    }
  }

  // Find a Vipps payment by Vipps order ID
  static async findByVippsOrderId(vippsOrderId) {
    try {
      const pool = getPool();
      if (!pool) return null;

      const [rows] = await pool.query('SELECT * FROM vipps_payments WHERE vipps_order_id = ?', [vippsOrderId]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return new VippsPayment(rows[0]);
    } catch (error) {
      console.error('Error finding Vipps payment by Vipps order ID:', error);
      return null;
    }
  }

  // Create a new Vipps payment
  static async create(paymentData) {
    try {
      const pool = getPool();
      if (!pool) return null;

      const [result] = await pool.query(
        `INSERT INTO vipps_payments (
          order_id, vipps_order_id, amount, currency, status, 
          payment_method, error_message, redirect_url, transaction_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          paymentData.orderId,
          paymentData.vippsOrderId,
          paymentData.amount,
          paymentData.currency || 'NOK',
          paymentData.status || 'pending',
          paymentData.paymentMethod || 'vipps',
          paymentData.errorMessage || null,
          paymentData.redirectUrl || null,
          paymentData.transactionId || null
        ]
      );

      const id = result.insertId;
      return await VippsPayment.findById(id);
    } catch (error) {
      console.error('Error creating Vipps payment:', error);
      return null;
    }
  }

  // Update an existing Vipps payment
  async update(updateData) {
    try {
      const pool = getPool();
      if (!pool) return false;

      // Update only the fields that are provided
      const fields = [];
      const values = [];

      if (updateData.status !== undefined) {
        fields.push('status = ?');
        values.push(updateData.status);
      }

      if (updateData.errorMessage !== undefined) {
        fields.push('error_message = ?');
        values.push(updateData.errorMessage);
      }

      if (updateData.transactionId !== undefined) {
        fields.push('transaction_id = ?');
        values.push(updateData.transactionId);
      }

      // Add updated_at timestamp
      fields.push('updated_at = NOW()');

      // Add payment ID to values array for WHERE clause
      values.push(this.id);

      // Execute the update query
      await pool.query(
        `UPDATE vipps_payments SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      // Reload the payment to get the updated data
      const updatedPayment = await VippsPayment.findById(this.id);
      if (updatedPayment) {
        // Update current instance properties
        Object.assign(this, updatedPayment);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating Vipps payment:', error);
      return false;
    }
  }
}

module.exports = VippsPayment;
const { getPool, getPoolWithRetry } = require('../config/db');
const crypto = require('crypto');

class PasswordReset {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.token = data.token;
    this.expiresAt = data.expires_at;
    this.createdAt = data.created_at;
    this.isUsed = data.is_used === 1;
  }

  // Create a new password reset token
  static async create(userId) {
    try {
      // Use getPoolWithRetry to ensure we have a connection
      const pool = await getPoolWithRetry();
      
      // Generate a secure random token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Set expiration to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Insert into database
      const [result] = await pool.query(
        'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, token, expiresAt]
      );
      
      // Return the newly created token
      const [rows] = await pool.query(
        'SELECT * FROM password_resets WHERE id = ?', 
        [result.insertId]
      );
      
      if (rows.length === 0) {
        throw new Error('Failed to retrieve created password reset token');
      }
      
      return new PasswordReset(rows[0]);
    } catch (error) {
      console.error('Error creating password reset token:', error);
      throw error;
    }
  }

  // Find by token
  static async findByToken(token) {
    try {
      const pool = await getPoolWithRetry();
      
      const [rows] = await pool.query(
        'SELECT * FROM password_resets WHERE token = ? AND is_used = 0 AND expires_at > NOW()',
        [token]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new PasswordReset(rows[0]);
    } catch (error) {
      console.error('Error finding password reset token:', error);
      throw error;
    }
  }

  // Mark token as used
  async markAsUsed() {
    try {
      const pool = await getPoolWithRetry();
      
      await pool.query(
        'UPDATE password_resets SET is_used = 1 WHERE id = ?',
        [this.id]
      );
      
      this.isUsed = true;
      return true;
    } catch (error) {
      console.error('Error marking token as used:', error);
      throw error;
    }
  }

  // Invalidate all existing tokens for a user
  static async invalidateTokensForUser(userId) {
    try {
      const pool = await getPoolWithRetry();
      
      await pool.query(
        'UPDATE password_resets SET is_used = 1 WHERE user_id = ?',
        [userId]
      );
      
      return true;
    } catch (error) {
      console.error('Error invalidating user tokens:', error);
      throw error;
    }
  }
}

module.exports = PasswordReset;
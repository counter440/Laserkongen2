const { getPool } = require('../config/db');

/**
 * ContactForm model for database access
 */
class ContactForm {
  /**
   * Get all contact forms with pagination
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} Object with contact forms and pagination info
   */
  static async getAll(page = 1, limit = 10) {
    try {
      const pool = getPool();
      const offset = (page - 1) * limit;
      
      // Get total count
      const [countResult] = await pool.query('SELECT COUNT(*) as count FROM contact_forms');
      const totalCount = countResult[0].count;
      
      // Get paginated results
      const [rows] = await pool.query(
        'SELECT * FROM contact_forms ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      return {
        forms: rows,
        page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      };
    } catch (error) {
      console.error('Error in ContactForm.getAll:', error);
      throw error;
    }
  }

  /**
   * Get a specific contact form by ID
   * @param {number} id - Contact form ID
   * @returns {Promise<Object|null>} Contact form or null if not found
   */
  static async getById(id) {
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM contact_forms WHERE id = ?', [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in ContactForm.getById:', error);
      throw error;
    }
  }

  /**
   * Create a new contact form submission
   * @param {Object} formData - Form data
   * @returns {Promise<Object>} Created contact form
   */
  static async create(formData) {
    try {
      const pool = getPool();
      const { name, email, subject, message } = formData;
      
      const [result] = await pool.query(
        'INSERT INTO contact_forms (name, email, subject, message, status) VALUES (?, ?, ?, ?, ?)',
        [name, email, subject || '', message, 'new']
      );
      
      return this.getById(result.insertId);
    } catch (error) {
      console.error('Error in ContactForm.create:', error);
      throw error;
    }
  }

  /**
   * Update a contact form status
   * @param {number} id - Contact form ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated contact form
   */
  static async updateStatus(id, status) {
    try {
      const pool = getPool();
      await pool.query('UPDATE contact_forms SET status = ? WHERE id = ?', [status, id]);
      return this.getById(id);
    } catch (error) {
      console.error('Error in ContactForm.updateStatus:', error);
      throw error;
    }
  }

  /**
   * Delete a contact form
   * @param {number} id - Contact form ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id) {
    try {
      const pool = getPool();
      const [result] = await pool.query('DELETE FROM contact_forms WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in ContactForm.delete:', error);
      throw error;
    }
  }
}

module.exports = ContactForm;
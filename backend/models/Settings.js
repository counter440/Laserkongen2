const { getPool } = require('../config/db');

/**
 * Settings model for database access
 */
class Settings {
  /**
   * Get all settings for a specific category
   * @param {string} category - Category name
   * @returns {Promise<Array>} Array of settings
   */
  static async getAllByCategory(category) {
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM settings WHERE category = ?', [category]);
      return rows;
    } catch (error) {
      console.error('Error in Settings.getAllByCategory:', error);
      throw error;
    }
  }

  /**
   * Get a specific setting by category and name
   * @param {string} category - Category name
   * @param {string} name - Setting name
   * @returns {Promise<Object|null>} Setting object or null if not found
   */
  static async getOne(category, name) {
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM settings WHERE category = ? AND name = ?', [category, name]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in Settings.getOne:', error);
      throw error;
    }
  }

  /**
   * Update or create a setting
   * @param {string} category - Category name
   * @param {string} name - Setting name
   * @param {string} value - Setting value
   * @returns {Promise<Object>} Updated or created setting
   */
  static async set(category, name, value) {
    try {
      const pool = getPool();
      await pool.query(
        `INSERT INTO settings (category, name, value) 
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE value = ?`,
        [category, name, value, value]
      );
      
      return this.getOne(category, name);
    } catch (error) {
      console.error('Error in Settings.set:', error);
      throw error;
    }
  }

  /**
   * Update multiple settings for a category
   * @param {string} category - Category name
   * @param {Object} settings - Object with setting names as keys and values as values
   * @returns {Promise<Array>} Array of updated settings
   */
  static async setMultiple(category, settings) {
    try {
      const pool = getPool();
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        for (const [name, value] of Object.entries(settings)) {
          await connection.query(
            `INSERT INTO settings (category, name, value) 
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE value = ?`,
            [category, name, value, value]
          );
        }
        
        await connection.commit();
        connection.release();
        
        return this.getAllByCategory(category);
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error in Settings.setMultiple:', error);
      throw error;
    }
  }
}

module.exports = Settings;
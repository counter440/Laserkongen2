// Script to clear all orders from the database
const { connectDB, getPool } = require('../backend/config/db');

const clearOrders = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Getting database pool...');
    const pool = getPool();
    
    if (!pool) {
      console.error('Cannot get database pool');
      process.exit(1);
    }
    
    const connection = await pool.getConnection();
    
    try {
      console.log('Beginning transaction...');
      await connection.beginTransaction();
      
      // First, check if there are any orders
      const [orderCount] = await connection.query('SELECT COUNT(*) as count FROM orders');
      console.log(`Found ${orderCount[0].count} orders in the database`);
      
      if (orderCount[0].count === 0) {
        console.log('No orders to delete');
        await connection.commit();
        return;
      }
      
      // Get file IDs associated with orders for cleanup
      const [fileIds] = await connection.query('SELECT id FROM uploaded_files WHERE order_id IS NOT NULL');
      console.log(`Found ${fileIds.length} files associated with orders`);
      
      // Clear order associations from uploaded_files
      console.log('Clearing order associations from uploaded_files...');
      await connection.query('UPDATE uploaded_files SET order_id = NULL WHERE order_id IS NOT NULL');
      
      // Delete model_data for files
      if (fileIds.length > 0) {
        const fileIdList = fileIds.map(file => file.id).join(',');
        console.log('Deleting model_data for files...');
        await connection.query(`DELETE FROM model_data WHERE file_id IN (${fileIdList})`);
      }
      
      // Delete order-related tables in the correct order (foreign key constraints)
      console.log('Deleting order_payment_results...');
      await connection.query('DELETE FROM order_payment_results');
      
      console.log('Deleting order_shipping_address...');
      await connection.query('DELETE FROM order_shipping_address');
      
      console.log('Deleting order_custom_options...');
      await connection.query('DELETE FROM order_custom_options');
      
      console.log('Deleting order_items...');
      await connection.query('DELETE FROM order_items');
      
      console.log('Deleting orders...');
      await connection.query('DELETE FROM orders');
      
      // Commit the transaction
      await connection.commit();
      console.log('Successfully cleared all orders from the database');
      
    } catch (error) {
      // If error, rollback
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error clearing orders:', error);
    process.exit(1);
  }
};

clearOrders();
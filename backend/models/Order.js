const { getPool } = require('../config/db');

class Order {
  constructor(orderData) {
    this.id = orderData.id;
    this.user_id = orderData.user_id;
    this.paymentMethod = orderData.payment_method;
    this.itemsPrice = orderData.items_price;
    this.taxPrice = orderData.tax_price;
    this.shippingPrice = orderData.shipping_price;
    this.totalPrice = orderData.total_price;
    this.status = orderData.status || 'pending';
    this.isPaid = orderData.is_paid || false;
    this.paidAt = orderData.paid_at;
    this.isDelivered = orderData.is_delivered || false;
    this.deliveredAt = orderData.delivered_at;
    this.trackingNumber = orderData.tracking_number;
    this.estimatedDeliveryDate = orderData.estimated_delivery_date;
    this.createdAt = orderData.created_at;
    this.updatedAt = orderData.updated_at;
    
    // These will be populated by related tables
    this.orderItems = [];
    this.shippingAddress = null;
    this.user = null;
    this.paymentResult = null;
  }

  // Find all orders with optional filtering
  static async find(filter = {}, options = {}) {
    try {
      const pool = getPool();
      if (!pool) return [];

      let query = 'SELECT * FROM orders WHERE 1=1';
      const params = [];

      // Apply filters
      if (filter.user) {
        query += ' AND user_id = ?';
        params.push(filter.user);
        console.log(`Adding filter for user_id = ${filter.user}`);
      }

      if (filter.status) {
        query += ' AND status = ?';
        params.push(filter.status);
      }

      if (filter.isPaid) {
        query += ' AND is_paid = ?';
        params.push(filter.isPaid);
      }

      // Apply sorting
      query += ' ORDER BY ' + (options.sort || 'created_at DESC');

      // Apply pagination
      const limit = options.limit ? parseInt(options.limit) : 10;
      const skip = options.skip ? parseInt(options.skip) : 0;
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, skip);

      const [rows] = await pool.query(query, params);
      
      // Create order objects with populated data
      const orders = [];
      for (const row of rows) {
        const order = new Order(row);
        await order.populate(['shippingAddress', 'orderItems']);
        
        // Populate user if needed
        if (options.populate?.includes('user') && order.user_id) {
          const [userRows] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [order.user_id]);
          if (userRows.length > 0) {
            order.user = {
              _id: userRows[0].id,
              name: userRows[0].name,
              email: userRows[0].email
            };
          }
        }
        
        orders.push(order);
      }
      
      return orders;
    } catch (error) {
      console.error('Error finding orders:', error);
      return [];
    }
  }

  // Find an order by ID
  static async findById(id) {
    try {
      const pool = getPool();
      if (!pool) return null;

      const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const order = new Order(rows[0]);
      
      // Populate order data
      await order.populate(['shippingAddress', 'orderItems', 'user']);
      
      return order;
    } catch (error) {
      console.error('Error finding order by ID:', error);
      return null;
    }
  }

  // Count orders with optional filtering
  static async countDocuments(filter = {}) {
    try {
      const pool = getPool();
      if (!pool) return 0;

      let query = 'SELECT COUNT(*) as count FROM orders WHERE 1=1';
      const params = [];

      // Apply filters
      if (filter.user) {
        query += ' AND user_id = ?';
        params.push(filter.user);
        console.log(`Adding filter for user_id = ${filter.user}`);
      }

      if (filter.status) {
        query += ' AND status = ?';
        params.push(filter.status);
      }

      if (filter.isPaid) {
        query += ' AND is_paid = ?';
        params.push(filter.isPaid);
      }

      const [result] = await pool.query(query, params);
      return result[0].count;
    } catch (error) {
      console.error('Error counting orders:', error);
      return 0;
    }
  }

  // Create a new order
  static async create(orderData) {
    try {
      const pool = getPool();
      if (!pool) return null;

      // Start a transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        console.log('Creating order with payment method:', orderData.paymentMethod);
        console.log('Order items count:', orderData.orderItems?.length || 0);
        
        // Log the user ID for debugging
        console.log('Creating order with user ID:', orderData.user);
        
        // Insert the order
        const [orderResult] = await connection.query(
          `INSERT INTO orders (
            user_id, payment_method, items_price, tax_price, 
            shipping_price, total_price, status, is_paid,
            paid_at, is_delivered, delivered_at, tracking_number,
            estimated_delivery_date, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            orderData.user || null,
            orderData.paymentMethod,
            orderData.itemsPrice || 0,
            orderData.taxPrice || 0,
            orderData.shippingPrice || 0,
            orderData.totalPrice || 0,
            orderData.status || 'pending',
            orderData.isPaid || false,
            orderData.paidAt || null,
            orderData.isDelivered || false,
            orderData.deliveredAt || null,
            orderData.trackingNumber || null,
            orderData.estimatedDeliveryDate || null
          ]
        );

        const orderId = orderResult.insertId;
        console.log('Created order with ID:', orderId);

        // Insert shipping address
        if (orderData.shippingAddress) {
          await connection.query(
            `INSERT INTO order_shipping_address (
              order_id, full_name, address, city, postal_code,
              country, phone, email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              orderId,
              orderData.shippingAddress.fullName,
              orderData.shippingAddress.address,
              orderData.shippingAddress.city,
              orderData.shippingAddress.postalCode,
              orderData.shippingAddress.country,
              orderData.shippingAddress.phone || null,
              orderData.shippingAddress.email
            ]
          );
        }

        // Insert order items
        if (orderData.orderItems && orderData.orderItems.length > 0) {
          for (const item of orderData.orderItems) {
            const [itemResult] = await connection.query(
              `INSERT INTO order_items (
                order_id, product_id, name, quantity, price, image
              ) VALUES (?, ?, ?, ?, ?, ?)`,
              [
                orderId,
                // Handle custom product IDs that start with 'custom-' by setting to null
                (item.product && typeof item.product === 'string' && item.product.startsWith('custom-')) ? null : (item.product || null),
                item.name,
                item.quantity || 1,
                item.price,
                item.image || null
              ]
            );

            const itemId = itemResult.insertId;

            // Check if this is a custom product (product_id is null OR product starts with "custom-")
            const isCustomProduct = !item.product || (typeof item.product === 'string' && item.product.startsWith('custom-'));
            console.log(`Item ${item.name} is ${isCustomProduct ? 'a custom product' : 'a standard shop product'}`);
            
            // Insert custom options if available - BUT ONLY for custom products
            if (item.customOptions && isCustomProduct) {
              console.log('Processing custom options for custom product item:', item.name);
              console.log('Custom options include uploadedFileId:', item.customOptions.uploadedFileId);
              
              let fileUrl = item.customOptions.fileUrl || null;
              
              // If we have an uploadedFileId, retrieve the actual file URL from the database
              if (item.customOptions.uploadedFileId) {
                try {
                  // Get the actual file URL from the uploaded_files table
                  const [fileResult] = await connection.query(
                    'SELECT file_url FROM uploaded_files WHERE id = ?',
                    [item.customOptions.uploadedFileId]
                  );
                  
                  if (fileResult.length > 0) {
                    fileUrl = fileResult[0].file_url;
                    console.log('Retrieved actual file URL from uploaded_files:', fileUrl);
                    
                    // Update the uploaded file to link it to this order
                    try {
                      console.log(`🔍 UPLOADING: Attempting to link file ID ${item.customOptions.uploadedFileId} to order ${orderId}`);
                      
                      // First check if the file exists
                      const [fileCheck] = await connection.query(
                        'SELECT id, order_id, temporary FROM uploaded_files WHERE id = ?',
                        [item.customOptions.uploadedFileId]
                      );
                      
                      if (fileCheck.length === 0) {
                        console.error(`🚫 UPLOADING: File with ID ${item.customOptions.uploadedFileId} does not exist in database`);
                      } else {
                        console.log(`✅ UPLOADING: File exists in database, current order_id: ${fileCheck[0].order_id}, temporary: ${fileCheck[0].temporary}`);
                        
                        // Now update the order_id and mark file as permanent and processed
                        console.log(`⭐⭐⭐ CRITICAL DATABASE UPDATE: Setting order_id=${orderId} for file ${item.customOptions.uploadedFileId}`);
                        try {
                          const result = await connection.query(
                            'UPDATE uploaded_files SET order_id = ?, temporary = 0, processing_complete = 1 WHERE id = ?',
                            [orderId, item.customOptions.uploadedFileId]
                          );
                          
                          // Check if the update was successful
                          if (result[0].affectedRows > 0) {
                            console.log(`✅ UPLOADING: Successfully linked uploaded file ${item.customOptions.uploadedFileId} to order ${orderId}`);
                          } else {
                            console.error(`🚫 UPLOADING: Failed to link file ${item.customOptions.uploadedFileId} to order ${orderId}: No rows updated`);
                            // Try a direct raw query as a last resort
                            const rawResult = await connection.query(
                              `UPDATE uploaded_files SET order_id = ${orderId}, temporary = 0, processing_complete = 1 WHERE id = ${item.customOptions.uploadedFileId}`
                            );
                            console.log(`Direct raw query result:`, rawResult[0].affectedRows > 0 ? 'SUCCESS' : 'FAILED');
                          }
                        } catch (sqlError) {
                          console.error(`🚫 SQL ERROR in update:`, sqlError);
                        }
                        
                        // Verify the update - IMPORTANT!
                        const [verifyUpdate] = await connection.query(
                          'SELECT id, order_id, temporary FROM uploaded_files WHERE id = ?',
                          [item.customOptions.uploadedFileId]
                        );
                        
                        if (verifyUpdate.length > 0) {
                          console.log(`🔍 UPLOADING: After update, file ${item.customOptions.uploadedFileId} has order_id: ${verifyUpdate[0].order_id}, temporary: ${verifyUpdate[0].temporary}`);
                          
                          // If update didn't work, try one more time with a direct update
                          if (!verifyUpdate[0].order_id) {
                            console.log(`⚠️ UPDATE FAILED: Making one final attempt to set order_id directly`);
                            await connection.query(
                              'UPDATE uploaded_files SET order_id = ? WHERE id = ?',
                              [orderId, item.customOptions.uploadedFileId]
                            );
                            
                            // Verify again
                            const [finalCheck] = await connection.query(
                              'SELECT order_id FROM uploaded_files WHERE id = ?',
                              [item.customOptions.uploadedFileId]
                            );
                            console.log(`Final verification result: order_id is now ${finalCheck[0]?.order_id || 'still NULL'}`);
                          }
                        } else {
                          console.error(`🚫 VERIFICATION FAILED: Could not find file ${item.customOptions.uploadedFileId} after update`);
                        }
                      }
                    } catch (updateError) {
                      console.error(`🚫 UPLOADING: Error linking file ${item.customOptions.uploadedFileId} to order ${orderId}:`, updateError);
                    }
                  }
                } catch (error) {
                  console.error('Error getting file URL from uploaded_files:', error);
                }
              }
              
              // Insert the custom options with the actual file URL
              const [optionResult] = await connection.query(
                `INSERT INTO order_custom_options (
                  order_item_id, type, material, color, quality,
                  infill, notes, file_url, uploaded_file_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  itemId,
                  item.customOptions.type || null,
                  item.customOptions.material || null,
                  item.customOptions.color || null,
                  item.customOptions.quality || null,
                  item.customOptions.infill || null,
                  item.customOptions.notes || null,
                  fileUrl,
                  item.customOptions.uploadedFileId || null
                ]
              );
              
              console.log(`Inserted custom options with ID ${optionResult.insertId}, linking file ID ${item.customOptions.uploadedFileId} to order item ${itemId}`);
              
              // Double check that we have a valid uploadedFileId and update the file's order_id
              if (item.customOptions.uploadedFileId) {
                // Use a separate query outside the try/catch to ensure this happens even if file URL retrieval fails
                console.log(`⭐⭐⭐ CRITICAL BACKUP: Making sure file ID ${item.customOptions.uploadedFileId} is linked to order ${orderId}`);
                try {
                  const backupResult = await connection.query(
                    'UPDATE uploaded_files SET order_id = ?, temporary = 0, processing_complete = 1 WHERE id = ?',
                    [orderId, item.customOptions.uploadedFileId]
                  );
                  
                  console.log(`Backup update result: ${backupResult[0].affectedRows} rows affected`);
                  
                  // One final check
                  const [finalVerify] = await connection.query(
                    'SELECT order_id, temporary FROM uploaded_files WHERE id = ?',
                    [item.customOptions.uploadedFileId]
                  );
                  
                  if (finalVerify.length > 0) {
                    console.log(`🔍 FINAL VERIFICATION: File ${item.customOptions.uploadedFileId} order_id=${finalVerify[0].order_id}, temporary=${finalVerify[0].temporary}`);
                  } else {
                    console.error(`❌ FINAL VERIFICATION FAILED: File ${item.customOptions.uploadedFileId} not found`);
                  }
                } catch (finalError) {
                  console.error(`❌ FINAL UPDATE ERROR:`, finalError);
                }
              }
            } else if (item.customOptions) {
              console.log(`Skipping custom options for standard shop product: ${item.name}`);
            }
          }
        }

        // Commit the transaction
        await connection.commit();
        connection.release();

        // Return the newly created order
        return await Order.findById(orderId);
      } catch (error) {
        // Rollback in case of error
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  // Save an order (update)
  async save() {
    try {
      const pool = getPool();
      if (!pool) return false;

      await pool.query(
        `UPDATE orders SET
          user_id = ?, payment_method = ?, items_price = ?,
          tax_price = ?, shipping_price = ?, total_price = ?,
          status = ?, is_paid = ?, paid_at = ?, is_delivered = ?,
          delivered_at = ?, tracking_number = ?, estimated_delivery_date = ?
        WHERE id = ?`,
        [
          this.user_id,
          this.paymentMethod,
          this.itemsPrice,
          this.taxPrice,
          this.shippingPrice,
          this.totalPrice,
          this.status,
          this.isPaid ? 1 : 0,
          this.paidAt,
          this.isDelivered ? 1 : 0,
          this.deliveredAt,
          this.trackingNumber,
          this.estimatedDeliveryDate,
          this.id
        ]
      );

      // Update payment result if provided
      if (this.paymentResult) {
        const [paymentRows] = await pool.query(
          'SELECT * FROM order_payment_results WHERE order_id = ?', 
          [this.id]
        );
        
        if (paymentRows.length > 0) {
          await pool.query(
            `UPDATE order_payment_results SET
              payment_id = ?, status = ?, update_time = ?, email_address = ?
            WHERE order_id = ?`,
            [
              this.paymentResult.id,
              this.paymentResult.status,
              this.paymentResult.update_time,
              this.paymentResult.email_address,
              this.id
            ]
          );
        } else {
          await pool.query(
            `INSERT INTO order_payment_results (
              order_id, payment_id, status, update_time, email_address
            ) VALUES (?, ?, ?, ?, ?)`,
            [
              this.id,
              this.paymentResult.id,
              this.paymentResult.status,
              this.paymentResult.update_time,
              this.paymentResult.email_address
            ]
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving order:', error);
      return false;
    }
  }

  // Populate order with related data
  async populate(fields = []) {
    try {
      const pool = getPool();
      if (!pool) return this;

      // Populate shipping address
      if (fields.includes('shippingAddress')) {
        const [addressRows] = await pool.query(
          'SELECT * FROM order_shipping_address WHERE order_id = ?',
          [this.id]
        );
        
        if (addressRows.length > 0) {
          this.shippingAddress = {
            fullName: addressRows[0].full_name,
            address: addressRows[0].address,
            city: addressRows[0].city,
            postalCode: addressRows[0].postal_code,
            country: addressRows[0].country,
            phone: addressRows[0].phone,
            email: addressRows[0].email
          };
        }
      }

      // Populate order items
      if (fields.includes('orderItems')) {
        const [itemRows] = await pool.query(
          'SELECT * FROM order_items WHERE order_id = ?',
          [this.id]
        );
        
        this.orderItems = [];
        
        for (const item of itemRows) {
          const orderItem = {
            _id: item.id,
            name: item.name,
            quantity: item.quantity,
            image: item.image,
            price: item.price,
            product: item.product_id
          };
          
          // Get custom options if any
          const [optionRows] = await pool.query(
            'SELECT * FROM order_custom_options WHERE order_item_id = ?',
            [item.id]
          );
          
          if (optionRows.length > 0) {
            orderItem.customOptions = {
              type: optionRows[0].type,
              material: optionRows[0].material,
              color: optionRows[0].color,
              quality: optionRows[0].quality,
              infill: optionRows[0].infill,
              notes: optionRows[0].notes,
              fileUrl: optionRows[0].file_url,
              uploadedFileId: optionRows[0].uploaded_file_id
            };
            
            // If there's an uploaded file, get its thumbnail but store it separately
            if (optionRows[0].uploaded_file_id) {
              const [fileRows] = await pool.query(
                'SELECT thumbnail_url FROM uploaded_files WHERE id = ?',
                [optionRows[0].uploaded_file_id]
              );
              
              if (fileRows.length > 0 && fileRows[0].thumbnail_url) {
                // Store the thumbnail in a separate property, not replacing the product image
                orderItem.customThumbnail = fileRows[0].thumbnail_url;
              }
            }
          }
          
          this.orderItems.push(orderItem);
        }
      }

      // Populate user
      if (fields.includes('user') && this.user_id) {
        const [userRows] = await pool.query(
          'SELECT id, name, email FROM users WHERE id = ?',
          [this.user_id]
        );
        
        if (userRows.length > 0) {
          this.user = {
            _id: userRows[0].id,
            name: userRows[0].name,
            email: userRows[0].email
          };
        }
      }

      // Populate payment result
      if (fields.includes('paymentResult')) {
        const [paymentRows] = await pool.query(
          'SELECT * FROM order_payment_results WHERE order_id = ?',
          [this.id]
        );
        
        if (paymentRows.length > 0) {
          this.paymentResult = {
            id: paymentRows[0].payment_id,
            status: paymentRows[0].status,
            update_time: paymentRows[0].update_time,
            email_address: paymentRows[0].email_address
          };
        }
      }

      return this;
    } catch (error) {
      console.error('Error populating order:', error);
      return this;
    }
  }
}

module.exports = Order;
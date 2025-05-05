const { getPool } = require('../config/db');

class UploadedFile {
  constructor(fileData) {
    this.id = fileData.id;
    this.originalName = fileData.original_name;
    this.filename = fileData.filename;
    this.path = fileData.path;
    this.fileUrl = fileData.file_url;
    this.thumbnailUrl = fileData.thumbnail_url;
    this.size = fileData.size;
    this.mimetype = fileData.mimetype;
    this.user_id = fileData.user_id;
    this.user_name = fileData.user_name; // Add this field
    this.fileType = fileData.file_type;
    this.processingComplete = fileData.processing_complete || false;
    this.order_id = fileData.order_id;
    this.status = fileData.status || 'pending';
    this.temporary = fileData.temporary || false;
    this.createdAt = fileData.created_at;
    this.updatedAt = fileData.updated_at;
    
    // This will be populated from the model_data table
    this.modelData = null;
    this.user = null;
  }

  // Find files with optional filtering
  static async find(filter = {}, options = {}) {
    try {
      console.log('========== DEBUG: UPLOADEDFILE.FIND ==========');
      console.log('Called UploadedFile.find with filter:', JSON.stringify(filter));
      console.log('Options:', JSON.stringify(options));
      
      const pool = getPool();
      if (!pool) {
        console.error('Cannot find files: No database pool available');
        return [];
      }

      let query = 'SELECT * FROM uploaded_files WHERE 1=1';
      const params = [];

      // IMPORTANT: ALWAYS SHOW ALL FILES BY DEFAULT
      // No filters on temporary flag at all - this is critical!
      console.log('🔍 ADMIN FILTER: Showing ALL files regardless of temporary flag');

      // Apply filters
      if (filter.user) {
        query += ' AND user_id = ?';
        params.push(filter.user);
        console.log(`🔍 Adding filter for user_id = ${filter.user}`);
      }

      if (filter.fileType) {
        query += ' AND file_type = ?';
        params.push(filter.fileType);
        console.log(`🔍 Adding filter for file_type = ${filter.fileType}`);
      }

      if (filter.status) {
        query += ' AND status = ?';
        params.push(filter.status);
        console.log(`🔍 Adding filter for status = ${filter.status}`);
      }

      if (filter.processingComplete !== undefined) {
        query += ' AND processing_complete = ?';
        params.push(filter.processingComplete ? 1 : 0);
        console.log(`🔍 Adding filter for processing_complete = ${filter.processingComplete}`);
      }
      
      // Filter for files with orders (non-null order_id) - ONLY if explicitly requested
      if (filter.orderFiles === 'true' || filter.orderFiles === true) {
        console.log('🔍 ADMIN FILTER: Filtering for files with orders, orderFiles =', filter.orderFiles);
        query += ' AND order_id IS NOT NULL';
        console.log('🔍 ADMIN FILTER: SQL query condition added: AND order_id IS NOT NULL');
        
        // Debug check actual order_id values
        try {
          const pool = getPool();
          if (pool) {
            const [checkRows] = await pool.query('SELECT id, order_id FROM uploaded_files WHERE order_id IS NOT NULL');
            console.log(`🔍 ADMIN FILTER: Found ${checkRows.length} files with non-null order_id:`);
            if (checkRows.length > 0) {
              checkRows.forEach(row => {
                console.log(`  - File ID: ${row.id}, Order ID: ${row.order_id}`);
              });
            } else {
              console.log('  * WARNING: No files with non-null order_id found in database!');
            }
          }
        } catch (err) {
          console.error('Error checking files with order_id:', err);
        }
      } else if (filter.order_id && filter.order_id.$ne === null) {
        query += ' AND order_id IS NOT NULL';
        console.log('🔍 Added filter: order_id IS NOT NULL');
      }
      
      // Specific order ID filtering
      if (filter.order_id && !filter.order_id.$ne) {
        // Use CAST to ensure string comparison for consistent results
        query += ' AND CAST(order_id AS CHAR) = CAST(? AS CHAR)';
        params.push(filter.order_id);
        console.log(`🔍 ADMIN FILTER: Filtering for specific order_id: ${filter.order_id} (using strict string comparison)`);
      }
      
      // Explicitly check for temporary flag when temporaryOnly is set, BUT ONLY IF EXPLICITLY REQUESTED
      if (filter.temporaryOnly === 'true' || filter.temporaryOnly === true) {
        query += ' AND temporary = 1';
        console.log('🔍 ADMIN FILTER: Filtering for temporary files only');
      }
      
      // REMOVED INCORRECT AUTO-FILTERING BY TEMPORARY FLAG
      // This was the source of the issue - we were automatically filtering out temporary files
      // in most queries, which prevented files from appearing in the admin interface
      
      // Debug check for files with specific combinations
      try {
        // Get total count first to know what we're working with
        const [totalCount] = await pool.query('SELECT COUNT(*) as count FROM uploaded_files');
        console.log(`🔍 Total files in database: ${totalCount[0].count}`);
        
        // Get count of temporary files 
        const [tempCount] = await pool.query('SELECT COUNT(*) as count FROM uploaded_files WHERE temporary = 1');
        console.log(`🔍 Temporary files in database: ${tempCount[0].count}`);
        
        // Get count of non-temporary files
        const [nonTempCount] = await pool.query('SELECT COUNT(*) as count FROM uploaded_files WHERE temporary = 0');
        console.log(`🔍 Non-temporary files in database: ${nonTempCount[0].count}`);
        
        // Get count of files with order_id set
        const [orderedCount] = await pool.query('SELECT COUNT(*) as count FROM uploaded_files WHERE order_id IS NOT NULL');
        console.log(`🔍 Files with order_id set: ${orderedCount[0].count}`);
      } catch (err) {
        console.error('Error during diagnostic counts:', err);
      }
      
      // Debug log to check query construction
      console.log('⭐⭐⭐ Final query:', query);
      console.log('⭐⭐⭐ With parameters:', params);

      // Apply sorting
      query += ' ORDER BY ' + (options.sort || 'created_at DESC');

      // Apply pagination
      const limit = options.limit ? parseInt(options.limit) : 10;
      const skip = options.skip ? parseInt(options.skip) : 0;
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, skip);

      console.log(`🔍 Executing query with limit ${limit}, offset ${skip}`);
      const [rows] = await pool.query(query, params);
      console.log(`🔍 Query returned ${rows.length} results`);
      
      // Create file objects with populated data
      const files = [];
      for (const row of rows) {
        console.log(`🔍 Processing result row: ID=${row.id}, Name=${row.original_name}, Temporary=${row.temporary}, OrderID=${row.order_id}`);
        
        const file = new UploadedFile(row);
        
        // Populate model data if file type is 3d-model
        if (file.fileType === '3d-model') {
          await file.populateModelData();
        }
        
        // Populate user if needed
        if (options.populate?.includes('user') && file.user_id) {
          await file.populateUser();
        }
        
        // Populate order if needed
        if (options.populate?.includes('order') && file.order_id) {
          console.log(`Populating order for file ID ${file.id} with order_id ${file.order_id}`);
          await file.populateOrder();
          // Debug check if order was populated
          if (file.order) {
            console.log(`Successfully populated order: ${JSON.stringify(file.order)}`);
          } else {
            console.log(`Failed to populate order for file ID ${file.id}`);
          }
        }
        
        files.push(file);
      }
      
      console.log(`🔍 Returning ${files.length} file objects`);
      return files;
    } catch (error) {
      console.error('Error finding files:', error);
      console.error('Error stack:', error.stack);
      return [];
    }
  }

  // Find a file by ID
  static async findById(id) {
    try {
      const pool = getPool();
      if (!pool) return null;

      const [rows] = await pool.query('SELECT * FROM uploaded_files WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const file = new UploadedFile(rows[0]);
      
      // Populate model data if file type is 3d-model
      if (file.fileType === '3d-model') {
        await file.populateModelData();
      }
      
      return file;
    } catch (error) {
      console.error('Error finding file by ID:', error);
      return null;
    }
  }

  // Count files with optional filtering
  static async countDocuments(filter = {}) {
    try {
      const pool = getPool();
      if (!pool) return 0;

      let query = 'SELECT COUNT(*) as count FROM uploaded_files WHERE 1=1';
      const params = [];

      // ALWAYS SHOW ALL FILES, no filters on temporary flag
      console.log('🔍 ADMIN COUNT: Including ALL files regardless of temporary flag');

      // Apply filters
      if (filter.user) {
        query += ' AND user_id = ?';
        params.push(filter.user);
      }

      if (filter.fileType) {
        query += ' AND file_type = ?';
        params.push(filter.fileType);
      }

      if (filter.status) {
        query += ' AND status = ?';
        params.push(filter.status);
      }
      
      // Filter for files with orders
      if (filter.orderFiles === 'true' || filter.orderFiles === true) {
        console.log('Counting only files with orders (non-null order_id)');
        query += ' AND order_id IS NOT NULL';
      } else if (filter.order_id && filter.order_id.$ne === null) {
        query += ' AND order_id IS NOT NULL';
      }
      
      console.log('countDocuments query:', query, 'with params:', params);

      const [result] = await pool.query(query, params);
      console.log('Count result:', result[0].count);
      return result[0].count;
    } catch (error) {
      console.error('Error counting files:', error);
      return 0;
    }
  }

  // Create a new file
  static async create(fileData) {
    try {
      console.log('======== DEBUG: UPLOADEDFILE.CREATE =========');
      console.log('UploadedFile.create called with data:', {
        originalName: fileData.originalName,
        filename: fileData.filename,
        path: fileData.path,
        fileUrl: fileData.fileUrl,
        fileType: fileData.fileType,
        size: fileData.size,
        user: fileData.user,
        temporary: fileData.temporary
      });
      
      const pool = getPool();
      if (!pool) {
        console.error('Cannot create uploaded file: No database pool available');
        return null;
      }

      // Start a transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Debug - show exact values being inserted into the database
        console.log('Inserting record with values:', {
          originalName: fileData.originalName,
          filename: fileData.filename,
          path: fileData.path,
          fileUrl: fileData.fileUrl,
          thumbnailUrl: fileData.thumbnailUrl || null,
          size: fileData.size,
          mimetype: fileData.mimetype,
          user_id: fileData.user || null,
          fileType: fileData.fileType,
          processingComplete: fileData.processingComplete || false,
          order_id: fileData.order || null,
          status: fileData.status || 'pending',
          temporary: fileData.temporary || false
        });
        
        // Insert the file
        const [fileResult] = await connection.query(
          `INSERT INTO uploaded_files (
            original_name, filename, path, file_url, thumbnail_url,
            size, mimetype, user_id, file_type, processing_complete,
            order_id, status, temporary
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            fileData.originalName,
            fileData.filename,
            fileData.path,
            fileData.fileUrl,
            fileData.thumbnailUrl || null,
            fileData.size,
            fileData.mimetype,
            fileData.user || null,
            fileData.fileType,
            fileData.processingComplete || false,
            fileData.order || null,
            fileData.status || 'pending',
            fileData.temporary || false
          ]
        );

        const fileId = fileResult.insertId;
        console.log(`File record created with ID: ${fileId}`);

        // Insert model data if provided
        if (fileData.modelData && fileData.fileType === '3d-model') {
          console.log('Adding model data to file record:', fileData.modelData);
          await connection.query(
            `INSERT INTO model_data (
              file_id, volume, weight, x, y, z, print_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              fileId,
              fileData.modelData.volume || null,
              fileData.modelData.weight || null,
              fileData.modelData.dimensions?.x || null,
              fileData.modelData.dimensions?.y || null,
              fileData.modelData.dimensions?.z || null,
              fileData.modelData.printTime || null
            ]
          );
          console.log('Model data added successfully');
        }

        // Double-check the record was created as expected
        const [checkResult] = await connection.query(
          'SELECT id, original_name, file_type, temporary, order_id FROM uploaded_files WHERE id = ?',
          [fileId]
        );
        
        if (checkResult.length > 0) {
          console.log('Verification check - File record exists with data:', {
            id: checkResult[0].id,
            originalName: checkResult[0].original_name,
            fileType: checkResult[0].file_type,
            temporary: checkResult[0].temporary,
            order_id: checkResult[0].order_id
          });
        } else {
          console.log('WARNING: Verification check failed - No record found with ID:', fileId);
        }

        // Commit the transaction
        await connection.commit();
        connection.release();
        console.log('Transaction committed successfully');

        // Return the newly created file
        const createdFile = await UploadedFile.findById(fileId);
        console.log('Retrieved created file:', {
          id: createdFile.id,
          originalName: createdFile.originalName,
          temporary: createdFile.temporary,
          order_id: createdFile.order_id
        });
        
        return createdFile;
      } catch (error) {
        // Rollback in case of error
        console.error('ERROR during file creation transaction:', error);
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error creating file:', error);
      console.error('Error stack:', error.stack);
      return null;
    }
  }

  // Delete a file
  async remove() {
    try {
      const pool = getPool();
      if (!pool) return false;

      console.log(`Deleting file with ID: ${this.id}`);
      
      // First delete any associated model data
      if (this.fileType === '3d-model') {
        await pool.query('DELETE FROM model_data WHERE file_id = ?', [this.id]);
      }
      
      // Then delete the file record
      await pool.query('DELETE FROM uploaded_files WHERE id = ?', [this.id]);
      
      return true;
    } catch (error) {
      console.error('Error removing file:', error);
      return false;
    }
  }

  // Save a file (update)
  async save() {
    try {
      const pool = getPool();
      if (!pool) return false;

      await pool.query(
        `UPDATE uploaded_files SET
          original_name = ?, filename = ?, path = ?,
          file_url = ?, thumbnail_url = ?, size = ?,
          mimetype = ?, user_id = ?, user_name = ?, file_type = ?,
          processing_complete = ?, order_id = ?, status = ?,
          temporary = ?
        WHERE id = ?`,
        [
          this.originalName,
          this.filename,
          this.path,
          this.fileUrl,
          this.thumbnailUrl,
          this.size,
          this.mimetype,
          this.user_id,
          this.user_name,
          this.fileType,
          this.processingComplete ? 1 : 0,
          this.order_id,
          this.status,
          this.temporary ? 1 : 0,
          this.id
        ]
      );

      // Update model data if provided and file type is 3d-model
      if (this.modelData && this.fileType === '3d-model') {
        const [modelRows] = await pool.query(
          'SELECT * FROM model_data WHERE file_id = ?', 
          [this.id]
        );
        
        if (modelRows.length > 0) {
          await pool.query(
            `UPDATE model_data SET
              volume = ?, weight = ?, x = ?, y = ?, z = ?, print_time = ?
            WHERE file_id = ?`,
            [
              this.modelData.volume || null,
              this.modelData.weight || null,
              this.modelData.dimensions?.x || null,
              this.modelData.dimensions?.y || null,
              this.modelData.dimensions?.z || null,
              this.modelData.printTime || null,
              this.id
            ]
          );
        } else {
          await pool.query(
            `INSERT INTO model_data (
              file_id, volume, weight, x, y, z, print_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              this.id,
              this.modelData.volume || null,
              this.modelData.weight || null,
              this.modelData.dimensions?.x || null,
              this.modelData.dimensions?.y || null,
              this.modelData.dimensions?.z || null,
              this.modelData.printTime || null
            ]
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      return false;
    }
  }

  // Populate model data
  async populateModelData() {
    try {
      const pool = getPool();
      if (!pool) return this;

      const [modelRows] = await pool.query(
        'SELECT * FROM model_data WHERE file_id = ?',
        [this.id]
      );
      
      if (modelRows.length > 0) {
        this.modelData = {
          volume: modelRows[0].volume,
          weight: modelRows[0].weight,
          dimensions: {
            x: modelRows[0].x,
            y: modelRows[0].y,
            z: modelRows[0].z
          },
          printTime: modelRows[0].print_time
        };
      }

      return this;
    } catch (error) {
      console.error('Error populating model data:', error);
      return this;
    }
  }

  // Populate user
  async populateUser() {
    try {
      const pool = getPool();
      if (!pool) return this;

      // Check if we already have a user_name set in the database
      // in which case we don't need to query the users table
      if (this.user_name) {
        // Create a basic user object with just the name
        this.user = {
          _id: this.user_id || 'unknown',
          id: this.user_id || 'unknown',
          name: this.user_name,
          email: 'unknown' // We don't have email in user_name
        };
        console.log(`Using existing user_name for file ID ${this.id}: ${this.user_name}`);
        return this;
      }

      // If we have a user_id, try to get the user info from the users table
      if (this.user_id) {
        const [userRows] = await pool.query(
          'SELECT id, name, email FROM users WHERE id = ?',
          [this.user_id]
        );
        
        if (userRows.length > 0) {
          this.user = {
            _id: userRows[0].id,
            id: userRows[0].id,
            name: userRows[0].name,
            email: userRows[0].email
          };
          
          // Also update the user_name field if it's empty
          if (!this.user_name) {
            this.user_name = userRows[0].name;
            console.log(`Updated user_name for file ID ${this.id} to ${this.user_name}`);
          }
        }
      } else if (this.order_id) {
        // If no user_id but we have an order_id, try to get user info from the order's shipping address
        try {
          const [orderUserInfo] = await pool.query(
            `SELECT osa.full_name 
             FROM order_shipping_address osa
             WHERE osa.order_id = ?`, 
            [this.order_id]
          );
          
          if (orderUserInfo.length > 0 && orderUserInfo[0].full_name) {
            this.user_name = orderUserInfo[0].full_name;
            this.user = {
              _id: 'unknown',
              id: 'unknown',
              name: this.user_name,
              email: 'unknown'
            };
            console.log(`Updated user_name for file ID ${this.id} to ${this.user_name} from order shipping address`);
          }
        } catch (error) {
          console.error(`Error getting user info from order ${this.order_id}:`, error);
        }
      }

      // If we still don't have a user object, create a default one
      if (!this.user) {
        this.user = {
          _id: this.user_id || 'unknown',
          id: this.user_id || 'unknown',
          name: this.user_name || 'Anonymous User',
          email: 'unknown'
        };
      }

      return this;
    } catch (error) {
      console.error('Error populating user:', error);
      return this;
    }
  }
  
  // Populate order information
  async populateOrder() {
    try {
      const pool = getPool();
      if (!pool) return this;

      if (this.order_id) {
        console.log(`Populating order data for file ID ${this.id} with order_id ${this.order_id}`);
        
        // First make sure order_id is not null
        if (!this.order_id) {
          console.log(`File ID ${this.id} has null order_id despite check`);
          return this;
        }
        
        try {
          // Get more comprehensive data including customer information
          const [orderWithShippingRows] = await pool.query(
            `SELECT o.id, o.status, o.created_at, osa.full_name 
             FROM orders o
             LEFT JOIN order_shipping_address osa ON o.id = osa.order_id
             WHERE o.id = ?`,
            [this.order_id]
          );
          
          if (orderWithShippingRows.length > 0) {
            console.log(`Found order data: ${JSON.stringify(orderWithShippingRows[0])}`);
            this.order = {
              id: orderWithShippingRows[0].id,
              status: orderWithShippingRows[0].status,
              createdAt: orderWithShippingRows[0].created_at,
              customerName: orderWithShippingRows[0].full_name
            };
            
            // Update the user_name field on this file record if it's empty and we have customer info
            if (!this.user_name && orderWithShippingRows[0].full_name) {
              this.user_name = orderWithShippingRows[0].full_name;
              console.log(`Updated user_name for file ${this.id} to "${this.user_name}" from order shipping data`);
              
              // Save this update to the database for future queries
              try {
                await pool.query(
                  'UPDATE uploaded_files SET user_name = ? WHERE id = ?',
                  [this.user_name, this.id]
                );
                console.log(`Saved updated user_name to database for file ${this.id}`);
              } catch (saveError) {
                console.error(`Failed to save updated user_name for file ${this.id}:`, saveError);
              }
            }
          } else {
            console.log(`No order found with ID ${this.order_id}`);
            // Even if the order doesn't exist in the database, we create a placeholder object
            // This ensures files with order_id will always show their association
            this.order = {
              id: this.order_id,
              status: 'unknown',
              createdAt: null
            };
            console.log(`Created fallback order object: ${JSON.stringify(this.order)}`);
          }
          
          // Ensure the order ID is properly set
          if (!this.order.id) {
            this.order.id = this.order_id;
            console.log(`Explicitly set order.id to ${this.order_id}`);
          }
          
          // Log the final order object
          console.log(`Final populated order object: ${JSON.stringify(this.order)}`);
        } catch (queryError) {
          console.error(`Error querying order data: ${queryError.message}`);
          // On database error, still create a fallback order object
          this.order = {
            id: this.order_id,
            status: 'error',
            createdAt: null
          };
          console.log(`Created error fallback order object: ${JSON.stringify(this.order)}`);
        }
      } else {
        console.log(`File ID ${this.id} has no order_id to populate`);
      }

      return this;
    } catch (error) {
      console.error('Error in populateOrder method:', error);
      // On error, still create a basic order object
      if (this.order_id) {
        this.order = {
          id: this.order_id,
          status: 'error',
          createdAt: null
        };
        console.log(`Created error fallback order object: ${JSON.stringify(this.order)}`);
      }
      return this;
    }
  }
}

module.exports = UploadedFile;
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const UploadedFile = require('../models/UploadedFile');

// Set up storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadFolder = 'uploads/';
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }
    
    if (file.mimetype.includes('image/')) {
      uploadFolder += 'images/';
    } else if (
      file.originalname.endsWith('.stl') || 
      file.originalname.endsWith('.obj') || 
      file.originalname.endsWith('.3mf')
    ) {
      uploadFolder += '3d-models/';
    } else {
      uploadFolder += 'other/';
    }
    
    // Create the specific folder if it doesn't exist
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }
    
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: function (req, file, cb) {
    const acceptedTypes = [
      // 3D models
      '.stl', '.obj', '.3mf',
      // Images
      '.png', '.jpg', '.jpeg', '.svg',
      // Vector files
      '.eps', '.ai', '.pdf'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (acceptedTypes.includes(ext) || file.mimetype.includes('image/')) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// POST upload a file
router.post('/', upload.single('file'), async (req, res) => {
  try {
    console.log('Backend upload API called');
    console.log('Request headers:', req.headers);
    console.log('Request file:', req.file);
    console.log('Request body keys:', Object.keys(req.body));
    
    const file = req.file;
    const previewImage = req.body.preview;
    
    if (!file) {
      console.error('No file in request:', req.body);
      return res.status(400).json({ message: 'Please upload a file' });
    }
    
    // Determine file type
    let fileType = 'other';
    if (file.mimetype.includes('image/')) {
      fileType = 'image';
    } else if (
      file.originalname.endsWith('.stl') || 
      file.originalname.endsWith('.obj') || 
      file.originalname.endsWith('.3mf')
    ) {
      fileType = '3d-model';
    }
    
    // Create file record in database
    const fileUrl = `${req.protocol}://${req.get('host')}/${file.path}`;
    let thumbnailUrl = fileType === 'image' ? fileUrl : null;
    
    // Store preview image if provided (for 3D models)
    if (previewImage && fileType === '3d-model' && previewImage.startsWith('data:image')) {
      // Create a unique filename for the preview
      const previewFilename = 'preview-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + '.png';
      // Use path.join to ensure correct directory structure
      const previewDir = path.join(__dirname, '../../uploads/previews');
      const previewPath = path.join(previewDir, previewFilename);
      
      // Create previews directory if it doesn't exist
      if (!fs.existsSync(previewDir)) {
        fs.mkdirSync(previewDir, { recursive: true });
      }
      
      // Log paths for debugging
      console.log('Saving preview image to:', previewPath);
      
      // Save the base64 preview as an image file
      try {
        // Handle different possible image format prefixes 
        let base64Data;
        if (previewImage.startsWith('data:image/png;base64,')) {
          base64Data = previewImage.replace(/^data:image\/png;base64,/, '');
        } else if (previewImage.startsWith('data:image/jpeg;base64,')) {
          base64Data = previewImage.replace(/^data:image\/jpeg;base64,/, '');
        } else if (previewImage.startsWith('data:image/')) {
          // Generic pattern for any image type
          base64Data = previewImage.replace(/^data:image\/[^;]+;base64,/, '');
        } else {
          // If no prefix, assume it's already base64 data
          base64Data = previewImage;
        }
        
        console.log('Saving base64 data of length:', base64Data.length);
        fs.writeFileSync(previewPath, base64Data, 'base64');
        console.log('Successfully wrote preview image to:', previewPath);
        
        // Use a URL path that will be correctly served by Express static middleware
        thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/previews/${previewFilename}`;
      } catch(err) {
        console.error('Error saving preview image:', err);
      }
    }
    
    const uploadedFile = new UploadedFile({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      fileUrl,
      thumbnailUrl,
      size: file.size,
      mimetype: file.mimetype,
      user: req.headers['user-id'] || null, // In a real app, this would come from auth middleware
      fileType,
      temporary: true // Mark as temporary by default until associated with an order
    });
    
    // For 3D models, process to get model data
    // In a real app, this would be a more complex process using a 3D library
    if (fileType === '3d-model') {
      // Mock data for demonstration
      uploadedFile.modelData = {
        volume: Math.floor(Math.random() * 500) + 50, // cm³
        weight: Math.floor(Math.random() * 300) + 50, // grams
        dimensions: {
          x: (Math.random() * 20 + 5).toFixed(1),
          y: (Math.random() * 15 + 5).toFixed(1),
          z: (Math.random() * 10 + 2).toFixed(1)
        },
        printTime: (Math.random() * 10 + 2).toFixed(1) // hours
      };
      uploadedFile.processingComplete = true;
    }
    
    console.log('About to save uploaded file to database with data:', {
      originalName: file.originalname, // Use direct values from file object
      filename: file.filename,
      path: file.path,
      fileUrl,
      fileType,
      size: file.size
    });
    
    // Create the database record directly with explicit values
    const fileData = {
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      fileUrl,
      thumbnailUrl,
      size: file.size,
      mimetype: file.mimetype,
      user_id: req.headers['user-id'] || null,
      fileType,
      processingComplete: fileType === '3d-model',
      status: 'processed',
      modelData: fileType === '3d-model' ? uploadedFile.modelData : null,
      temporary: true, // Mark as temporary by default until associated with an order
      created_at: new Date() // Set creation time for auto-deletion tracking
    };
    
    try {
      const savedFile = await UploadedFile.create(fileData);
      console.log('Successfully saved file to database with ID:', savedFile.id);
      res.status(201).json(savedFile);
    } catch (dbError) {
      console.error('Database error saving file:', dbError);
      console.error('Attempted to save with data:', fileData);
      throw dbError;
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET all uploaded files (admin only in a real app)
router.get('/', async (req, res) => {
  try {
    console.log('=========== DEBUG: UPLOADS GET ROUTE HANDLER ===========');
    console.log('Request URL:', req.originalUrl);
    console.log('Request query params (raw):', req.query);
    
    const { fileType, limit = 10, page = 1, orderFiles = false, temporaryOnly = false } = req.query;
    
    console.log('⭐ Parsed parameters:');
    console.log('  - fileType:', fileType);
    console.log('  - limit:', limit, 'type:', typeof limit);
    console.log('  - page:', page, 'type:', typeof page);
    console.log('  - orderFiles:', orderFiles, 'type:', typeof orderFiles);
    console.log('  - temporaryOnly:', temporaryOnly, 'type:', typeof temporaryOnly);
    
    // IMPORTANT: By default, don't filter by anything
    const query = {};
    console.log('🔍 ADMIN API: Starting with empty query to show ALL files');
    
    if (fileType) {
      query.fileType = fileType;
      console.log(`🔍 ADMIN API: Filtering by fileType=${fileType}`);
    }
    
    // Check if this is the admin uploads page - trace URL params
    const isAdminUploadsPage = req.originalUrl.includes('/api/uploads') && !req.originalUrl.includes('/order/');
    if (isAdminUploadsPage) {
      console.log('🔍 REQUEST APPEARS TO BE FROM ADMIN UPLOADS PAGE');
      
      // Debug check which components might be filtering out results
      console.log('⚠️ DEBUG: Check if admin/uploads page is requesting filtered results');
      console.log('⚠️ URL parameters:', req.originalUrl.split('?')[1] || 'none');
    }
    
    // Process filter parameters ONLY if explicitly requested
    
    // Handle orderFiles parameter - ONLY if explicitly set to true
    if (orderFiles === 'true') {
      console.log('🔍 ADMIN API: Explicit request for files with orders');
      query.orderFiles = true;
      console.log('🔍 ADMIN API: Equivalent SQL: SELECT * FROM uploaded_files WHERE order_id IS NOT NULL');
    }
    
    // Handle temporaryOnly parameter - ONLY if explicitly set to true
    if (temporaryOnly === 'true') {
      console.log('🔍 ADMIN API: Explicit request for temporary files only');
      query.temporaryOnly = true;
      console.log('🔍 ADMIN API: Equivalent SQL: SELECT * FROM uploaded_files WHERE temporary = 1');
    }
    
    console.log('⭐ Final filter query object:', query);
    
    // Check database for all files before filtering
    try {
      const pool = getPool();
      if (pool) {
        const [allFiles] = await pool.query('SELECT COUNT(*) as count FROM uploaded_files');
        console.log(`🔍 TOTAL FILES IN DATABASE: ${allFiles[0].count}`);
        
        // If admin uploads page and no files, do deeper diagnostic
        if (isAdminUploadsPage && allFiles[0].count > 0) {
          console.log('⚠️ DATABASE CHECK: Files exist but might be filtered out in query');
          const [recentFiles] = await pool.query('SELECT id, original_name, file_type, temporary, order_id, created_at FROM uploaded_files ORDER BY created_at DESC LIMIT 5');
          console.log('⚠️ 5 MOST RECENT FILES:');
          recentFiles.forEach(file => {
            console.log(`  - ID: ${file.id}, Name: ${file.original_name}, Type: ${file.file_type}, Temporary: ${file.temporary}, Order: ${file.order_id}, Created: ${file.created_at}`);
          });
        }
      }
    } catch (err) {
      console.error('Error during diagnostic query:', err);
    }
    
    // Modified to use the UploadedFile.find correctly with options parameter
    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sort: 'created_at DESC',
      populate: ['user', 'order'] // Also populate order information
    };
    
    console.log('⭐ Calling UploadedFile.find with query:', JSON.stringify(query));
    console.log('⭐ and options:', JSON.stringify(options));
    
    const files = await UploadedFile.find(query, options);
    console.log(`⭐ UploadedFile.find returned ${files.length} files`);
    
    if (files.length > 0) {
      // Log summary of returned files
      console.log('⭐ RETURNED FILES SUMMARY:');
      files.forEach((file, index) => {
        console.log(`  ${index+1}. ID: ${file.id}, Name: ${file.originalName}, Type: ${file.fileType}, Temporary: ${file.temporary}, Order: ${file.order_id}`);
      });
    } else {
      console.log('⚠️ WARNING: No files returned from query!');
    }
    
    const total = await UploadedFile.countDocuments(query);
    console.log(`⭐ Total matching files count: ${total}`);
    
    // Construct and send response
    const response = {
      files,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    };
    
    console.log(`⭐ Sending response with ${files.length} files, page ${page} of ${Math.ceil(total / parseInt(limit))}`);
    res.status(200).json(response);
  } catch (error) {
    console.error('ERROR fetching files:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET user's files
router.get('/myfiles', async (req, res) => {
  try {
    // In a real app, this would come from auth middleware
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized, no user ID' });
    }
    
    const files = await UploadedFile.find({ user: userId }).sort({ createdAt: -1 });
    
    res.status(200).json(files);
  } catch (error) {
    console.error('Error fetching user files:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET files for a specific order
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }
    
    // Find all files associated with this order
    console.log(`Finding files for order: ${orderId}`);
    
    // Construct a clear filter object
    const filter = { order_id: orderId };
    
    // Also populate order data to ensure it's available in the response
    const options = {
      populate: ['user', 'order'],
      sort: 'created_at DESC'
    };
    
    // Execute the query
    const files = await UploadedFile.find(filter, options);
    
    console.log(`Found ${files.length} files for order ${orderId}`);
    
    // Log detailed information about each file found
    if (files.length > 0) {
      files.forEach(file => {
        console.log(`File: ID=${file.id}, Name=${file.originalName}, OrderID=${file.order_id}`);
        if (file.order) {
          console.log(`  Order data: ${JSON.stringify(file.order)}`);
        } else {
          console.log(`  No order data populated`);
        }
      });
    }
    
    res.status(200).json(files);
  } catch (error) {
    console.error(`Error fetching files for order ${req.params.orderId}:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET a single file by ID
router.get('/:id', async (req, res) => {
  try {
    const file = await UploadedFile.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // In a real app, check if the requesting user is the file owner or admin
    
    res.status(200).json(file);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE a file
router.delete('/:id', async (req, res) => {
  try {
    const file = await UploadedFile.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // In a real app, check if the requesting user is the file owner or admin
    
    try {
      // Delete the physical file
      console.log(`Attempting to delete physical file at path: ${file.path}`);
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log(`Physical file deleted successfully`);
      } else {
        console.log(`Physical file not found at path: ${file.path}`);
      }
    } catch (fsError) {
      console.error(`Error deleting physical file: ${fsError.message}`);
      // Continue even if physical file deletion fails
    }
    
    // Delete the database record
    console.log(`Attempting to delete database record for file ID: ${file.id}`);
    const success = await file.remove();
    
    if (success) {
      console.log(`File deleted successfully: ${file.id}`);
      res.status(200).json({ message: 'File deleted successfully' });
    } else {
      console.log(`Failed to delete file from database: ${file.id}`);
      res.status(500).json({ message: 'Failed to delete file from database' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH update a file
router.patch('/:id', async (req, res) => {
  try {
    const file = await UploadedFile.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // In a real app, check if the requesting user is the file owner or admin
    
    console.log(`Updating file ${file.id} with data:`, req.body);
    
    // Update the file with the provided data
    Object.keys(req.body).forEach(key => {
      // Map between camelCase and snake_case fields
      if (key === 'status') {
        file.status = req.body.status;
      } else if (key === 'processingComplete') {
        file.processingComplete = req.body.processingComplete;
      } else if (key === 'fileName') {
        file.filename = req.body.fileName;
      } else if (key === 'originalName') {
        file.original_name = req.body.originalName;
      } else if (key === 'fileType') {
        file.file_type = req.body.fileType;
      } else if (key === 'userId') {
        file.user_id = req.body.userId;
      } else if (key === 'orderId') {
        console.log(`Setting order_id to ${req.body.orderId}`);
        file.order_id = req.body.orderId;
        
        // When associating with an order, automatically set temporary to false
        if (req.body.orderId) {
          console.log(`File ${file.id} associated with order ${req.body.orderId}, marking as permanent`);
          file.temporary = false;
        }
      } else if (key === 'temporary') {
        file.temporary = req.body.temporary;
      } else {
        file[key] = req.body[key];
      }
    });
    
    // Save the updated file
    const success = await file.save();
    
    if (success) {
      console.log(`File ${file.id} updated successfully`);
      
      // If order_id was set, populate the order data for the response
      if (req.body.orderId && file.order_id) {
        await file.populateOrder();
        console.log(`Populated order data: ${JSON.stringify(file.order)}`);
        
        // If the file was already associated with a different order, don't proceed with linking
        if (file.order_id != req.body.orderId) {
          console.warn(`File ${file.id} was already associated with a different order (${file.order_id}), not updating relationships`);
          return res.status(200).json(file);
        }
        
        // Additionally, update the order_custom_options with this file ID
        // This ensures both sides of the relationship are updated
        try {
          const pool = getPool();
          if (pool) {
            console.log(`Checking for order_items for order ${file.order_id}`);
            
            // Get only custom order items for this order
            const [orderItems] = await pool.query(
              `SELECT oi.id 
               FROM order_items oi
               LEFT JOIN products p ON oi.product_id = p.id
               WHERE oi.order_id = ? 
               AND (p.category IN ('3d-printing', 'laser-engraving', 'custom') OR oi.product_id IS NULL)
               LIMIT 1`,
              [file.order_id]
            );
            
            if (orderItems.length > 0) {
              console.log(`Found ${orderItems.length} order items`);
              
              // Check if there's an existing custom options record for this item
              const [customOptions] = await pool.query(
                'SELECT id FROM order_custom_options WHERE order_item_id = ?',
                [orderItems[0].id]
              );
              
              if (customOptions.length > 0) {
                console.log(`Updating existing custom options record: ${customOptions[0].id}`);
                
                // Update the existing record
                await pool.query(
                  'UPDATE order_custom_options SET uploaded_file_id = ? WHERE id = ?',
                  [file.id, customOptions[0].id]
                );
              } else {
                console.log(`Creating new custom options record for order item: ${orderItems[0].id}`);
                
                // Create a new record
                await pool.query(
                  'INSERT INTO order_custom_options (order_item_id, uploaded_file_id) VALUES (?, ?)',
                  [orderItems[0].id, file.id]
                );
              }
              
              console.log(`Successfully linked file ${file.id} to order ${file.order_id} in custom options`);
            } else {
              console.log(`No order items found for order ${file.order_id}`);
            }
          }
        } catch (linkError) {
          console.error(`Error linking file to order_custom_options: ${linkError.message}`);
          // Don't fail the whole operation if this part fails
        }
      }
      
      res.status(200).json(file);
    } else {
      console.log(`Failed to update file ${file.id}`);
      res.status(500).json({ message: 'Failed to update file' });
    }
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST reprocess a file
router.post('/:id/reprocess', async (req, res) => {
  try {
    const file = await UploadedFile.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // In a real app, check if the requesting user is the file owner or admin
    
    // Only process 3D model files
    if (file.fileType !== '3d-model') {
      return res.status(400).json({ message: 'Only 3D model files can be reprocessed' });
    }
    
    // Set status to processing
    file.status = 'pending';
    file.processingComplete = false;
    await file.save();
    
    // In a real app, you would send the file to a processing queue or service
    // For now, we'll simulate processing by updating the model data
    setTimeout(async () => {
      try {
        const processedFile = await UploadedFile.findById(req.params.id);
        if (processedFile) {
          // Create new model data (simulating analysis)
          processedFile.modelData = {
            volume: Math.floor(Math.random() * 500) + 50, // cm³
            weight: Math.floor(Math.random() * 300) + 50, // grams
            dimensions: {
              x: (Math.random() * 20 + 5).toFixed(1),
              y: (Math.random() * 15 + 5).toFixed(1),
              z: (Math.random() * 10 + 2).toFixed(1)
            },
            printTime: (Math.random() * 10 + 2).toFixed(1) // hours
          };
          
          // Mark as processed
          processedFile.status = 'processed';
          processedFile.processingComplete = true;
          await processedFile.save();
          
          console.log(`File ${processedFile.id} reprocessed successfully`);
        }
      } catch (innerError) {
        console.error('Error in reprocessing job:', innerError);
      }
    }, 2000); // Simulate processing delay
    
    res.status(202).json({ message: 'File reprocessing started' });
  } catch (error) {
    console.error('Error reprocessing file:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET file stream for download
router.get('/:id/stream', async (req, res) => {
  try {
    const file = await UploadedFile.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // In a real app, check if the requesting user is the file owner or admin
    
    // Check if the file exists
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }
    
    // Set content disposition header for download
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
    
    // Create a read stream from the file and pipe it to the response
    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error streaming file:', error);
    
    // Check if response was already sent
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

module.exports = router;
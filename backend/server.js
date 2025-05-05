const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectDB, getPool } = require('./config/db');

// Import models 
const User = require('./models/User');
const PasswordReset = require('./models/PasswordReset');

// Import services
const emailService = require('./services/EmailService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://194.32.107.238:3002'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
console.log('Serving static files from:', path.join(__dirname, '../uploads'));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'laserkongen_jwt_secret_key';

// Set up file upload storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine the upload folder based on file type
    let uploadFolder = 'uploads/';
    
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
    
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Import additional models
const Order = require('./models/Order');
const UploadedFile = require('./models/UploadedFile');
const Product = require('./models/Product');

// Auth middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user by ID
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Admin middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

// User routes
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create user
    const createdUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'customer'
    });
    
    if (!createdUser) {
      return res.status(500).json({ message: 'Failed to create user' });
    }
    
    // Generate token
    const token = createdUser.generateToken();
    
    // Send welcome email
    try {
      const emailResult = await emailService.sendWelcomeEmail(createdUser);
      console.log('Welcome email result:', emailResult);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail registration if email sending fails
    }
    
    res.status(201).json({
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
      token
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check password
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      console.log('Password incorrect for user:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate token
    const token = user.generateToken();
    
    console.log('Login successful for user:', email, 'with role:', user.role);
    
    // Send response with user info and token
    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/users/admin', async (req, res) => {
  try {
    const { name, email, password, adminSecretKey } = req.body;
    
    console.log('Admin creation request for:', email);
    
    // Verify admin secret key
    if (adminSecretKey !== 'laserkongen_admin_setup_key') {
      console.log('Invalid admin secret key provided');
      return res.status(401).json({ message: 'Invalid admin secret key' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create admin user
    const createdUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'admin'
    });
    
    if (!createdUser) {
      console.log('Failed to create admin user');
      return res.status(500).json({ message: 'Failed to create admin user' });
    }
    
    // Generate token
    const token = createdUser.generateToken();
    
    console.log('Admin user created successfully:', email);
    
    // Send welcome email
    try {
      const emailResult = await emailService.sendWelcomeEmail(createdUser);
      console.log('Welcome email for admin result:', emailResult);
    } catch (emailError) {
      console.error('Error sending welcome email for admin:', emailError);
      // Don't fail registration if email sending fails
    }
    
    res.status(201).json({
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
      token
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/users', authenticate, adminOnly, async (req, res) => {
  try {
    const users = await User.find();
    // Remove password from each user
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Profile route is now handled by the users router

// Import routes
const orderRoutes = require('./routes/orders');
const productRoutes = require('./routes/products');
const settingsRoutes = require('./routes/settings');
const contactRoutes = require('./routes/contact');
const uploadsRoutes = require('./routes/uploads');
const userRoutes = require('./routes/users');
const passwordResetRoutes = require('./routes/passwordReset');
const vippsPaymentRoutes = require('./routes/vippsPayments');
const paymentRoutes = require('./routes/payments');

// Use route files
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/upload', uploadsRoutes); // Add this line for backward compatibility
app.use('/api/users', userRoutes); // Register user routes
app.use('/api/password-reset', passwordResetRoutes); // Register password reset routes
app.use('/api/payments', paymentRoutes); // Register general payment routes
app.use('/api/payments', vippsPaymentRoutes); // Register Vipps payment routes

// For backward compatibility, keeping one route here
app.get('/api/orders/legacy', authenticate, adminOnly, async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    
    const count = await Order.countDocuments();
    const orders = await Order.find({}, { 
      limit: pageSize, 
      skip: pageSize * (page - 1),
      sort: 'created_at DESC',
      populate: ['user']
    });
    
    res.status(200).json({
      orders,
      page,
      pages: Math.ceil(count / pageSize),
      total: count
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Order routes are now imported and configured above

// Products routes are now imported and configured above

// The API uploads GET endpoint is now handled by the router

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('=========== DEBUG: UPLOAD ENDPOINT CALLED ============');
    console.log('Request headers:', req.headers);
    console.log('Request body keys:', Object.keys(req.body));
    
    // Log authentication information
    if (req.user) {
      console.log('Authenticated user:', req.user.id, req.user.email);
    } else {
      console.log('No authenticated user in request');
      console.log('User ID from headers:', req.headers['user-id']);
    }
    
    const file = req.file;
    if (!file) {
      console.error('ERROR: No file in request');
      return res.status(400).json({ message: 'Please upload a file' });
    }
    
    console.log('File received:', {
      originalname: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    });
    
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
    
    console.log('Determined file type:', fileType);
    
    // Create file URL (in production this would point to your CDN or storage service)
    const fileUrl = `${req.protocol}://${req.get('host')}/${file.path}`;
    console.log('File URL:', fileUrl);
    
    // Create uploaded file data
    const fileData = {
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      fileUrl: fileUrl,
      size: file.size,
      mimetype: file.mimetype,
      user: req.user ? req.user.id : (req.headers['user-id'] || null),
      fileType: fileType,
      status: 'pending',
      processingComplete: false,
      temporary: true // Mark as temporary so it doesn't show in admin until ordered
    };
    
    console.log('Prepared file data object with user ID:', fileData.user);
    
    // For 3D models, add placeholder model data (in production this would be calculated by a proper model analyzer)
    if (fileType === '3d-model') {
      console.log('Adding model data for 3D model');
      fileData.modelData = {
        volume: Math.floor(Math.random() * 500) + 50, // cm³
        weight: Math.floor(Math.random() * 300) + 50, // grams
        dimensions: {
          x: (Math.random() * 20 + 5).toFixed(1),
          y: (Math.random() * 15 + 5).toFixed(1),
          z: (Math.random() * 10 + 2).toFixed(1)
        },
        printTime: (Math.random() * 10 + 2).toFixed(1) // hours
      };
      
      // Mark as processed for demo purposes
      fileData.status = 'processed';
      fileData.processingComplete = true;
    }
    
    console.log('Calling UploadedFile.create with data:', {
      originalName: fileData.originalName,
      filename: fileData.filename,
      path: fileData.path,
      user: fileData.user,
      fileType: fileData.fileType,
      temporary: fileData.temporary
    });
    
    const savedFile = await UploadedFile.create(fileData);
    
    if (!savedFile) {
      console.error('ERROR: Failed to save file data to database');
      return res.status(500).json({ message: 'Failed to save file data' });
    }
    
    console.log('File successfully saved to database with ID:', savedFile.id);
    console.log('File temporary status:', savedFile.temporary);
    console.log('Success response sent to client');
    
    res.status(200).json(savedFile);
  } catch (error) {
    console.error('ERROR: Exception during file upload:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

// Simple route for testing
app.get('/', (req, res) => {
  res.send('Laserkongen API is running...');
});

// Connect to MySQL database
connectDB().then(async (pool) => {
  if (!pool) {
    console.log('Failed to connect to MySQL database');
  }
  
  // Initialize email service
  try {
    await emailService.initialize();
    console.log('Email service initialized');
  } catch (emailError) {
    console.error('Failed to initialize email service:', emailError);
  }
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret - in production, this would be in an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'laserkongen_jwt_secret_key';

// Middleware to authenticate users
const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      
      // Log the first part of the token for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth middleware - token received:', token.substring(0, 20) + '...');
      }
    } else if (req.headers.Authorization && req.headers.Authorization.startsWith('Bearer')) {
      // Handle case-sensitive header variation
      token = req.headers.Authorization.split(' ')[1];
      console.log('Using case-sensitive Authorization header');
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ 
        message: 'Not authorized, no token',
        tokenExpired: true
      });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth middleware - token decoded successfully. User ID:', decoded.id);
      }
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      
      if (tokenError instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ 
          message: 'Token expired', 
          tokenExpired: true 
        });
      }
      
      if (tokenError instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ 
          message: 'Invalid token', 
          tokenExpired: true 
        });
      }
      
      return res.status(401).json({ 
        message: 'Not authorized, token validation failed',
        tokenExpired: true
      });
    }
    
    // Get user from token
    try {
      if (!decoded.id) {
        console.error('Token does not contain a user ID');
        return res.status(401).json({ 
          message: 'Invalid token format, missing user ID',
          tokenExpired: true
        });
      }
      
      // Find the user
      let user;
      try {
        user = await User.findById(decoded.id);
      } catch (findError) {
        console.error(`Error finding user with ID ${decoded.id}:`, findError);
        
        // Database connection error
        return res.status(500).json({ 
          message: 'Database error during user lookup',
          error: process.env.NODE_ENV === 'development' ? findError.message : undefined,
          tokenExpired: false  // Don't mark as expired for server errors
        });
      }
      
      if (!user) {
        console.error(`User not found with ID ${decoded.id}`);
        return res.status(401).json({ 
          message: 'Not authorized, user not found',
          tokenExpired: true
        });
      }
      
      // Store the decoded token and user in the request
      req.user = user;
      req.token = decoded;
      
      // If we got here, authentication was successful
      if (process.env.NODE_ENV === 'development') {
        console.log('Authentication successful for user:', user.email);
      }
      
      next();
    } catch (dbError) {
      console.error('Error during user authentication:', dbError);
      return res.status(500).json({ 
        message: 'Server error during authentication',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
        tokenExpired: false  // Don't mark as expired for server errors
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({  // Use 500 for server errors, not 401
      message: 'Server error during authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      tokenExpired: false  // Don't mark as expired for server errors
    });
  }
};

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { authenticate, adminOnly, protect: authenticate, admin: adminOnly };
// API route for user profile
import { authenticate } from '../../../../backend/middleware/auth';

export default async function handler(req, res) {
  const onError = (error) => {
    console.error('Profile API error:', error);
    
    // Check if res.headersSent to avoid errors
    if (!res.headersSent) {
      // Determine if this is a database error or an authentication error
      const isDbError = error.message && (
        error.message.includes('database') || 
        error.message.includes('sql') ||
        error.message.includes('connection') ||
        error.message.includes('pool')
      );
      
      if (isDbError) {
        res.status(500).json({ 
          message: 'Database error occurred',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
          success: false,
          tokenExpired: false // Don't expire token for database errors
        });
      } else {
        res.status(401).json({ 
          message: 'Authentication failed', 
          error: process.env.NODE_ENV === 'development' ? error.message : 'Not authorized',
          tokenExpired: true 
        });
      }
    }
  };

  // Get user profile
  if (req.method === 'GET') {
    try {
      // Create an async wrapped version of authenticate to properly catch errors
      const authenticateAsync = () => {
        return new Promise((resolve, reject) => {
          // Track if the response has been sent
          let responseSent = false;
          
          // Wrap the next function to capture the result
          const wrappedNext = (result) => {
            if (result instanceof Error) {
              return reject(result);
            }
            
            if (res.headersSent) {
              // If the response was sent by the middleware, flag it
              responseSent = true;
              return resolve(null);
            }
            
            resolve(req.user);
          };
          
          // Call authenticate
          authenticate(req, res, wrappedNext);
          
          // Check if the response was already sent by the middleware
          if (res.headersSent) {
            responseSent = true;
            resolve(null);
          }
        });
      };
      
      // Add debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('Calling authenticateAsync from profile API GET');
      }
      
      const user = await authenticateAsync();
      
      // If we already sent a response, exit early
      if (res.headersSent) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Response already sent by auth middleware, exiting');
        }
        return;
      }
      
      // Continue only if we have a valid user
      if (!user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('No user returned from authenticateAsync');
        }
        
        if (!res.headersSent) {
          return res.status(401).json({ 
            message: 'Authentication failed',
            tokenExpired: true 
          });
        }
        return;
      }
      
      res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.phone,
        orders: user.orders,
        savedDesigns: user.savedDesigns,
        token: req.headers.authorization.split(' ')[1] // Return the token back
      });
    } catch (error) {
      onError(error);
    }
  } else if (req.method === 'PUT') { // Update user profile
    try {
      // Create an async wrapped version of authenticate to properly catch errors
      const authenticateAsync = () => {
        return new Promise((resolve, reject) => {
          // Track if the response has been sent
          let responseSent = false;
          
          // Wrap the next function to capture the result
          const wrappedNext = (result) => {
            if (result instanceof Error) {
              return reject(result);
            }
            
            if (res.headersSent) {
              // If the response was sent by the middleware, flag it
              responseSent = true;
              return resolve(null);
            }
            
            resolve(req.user);
          };
          
          // Call authenticate
          authenticate(req, res, wrappedNext);
          
          // Check if the response was already sent by the middleware
          if (res.headersSent) {
            responseSent = true;
            resolve(null);
          }
        });
      };
      
      // Add debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('Calling authenticateAsync from profile API PUT');
        console.log('Request body:', req.body);
      }
      
      const user = await authenticateAsync();
      
      // If we already sent a response, exit early
      if (res.headersSent) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Response already sent by auth middleware, exiting');
        }
        return;
      }
      
      // Continue only if we have a valid user
      if (!user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('No user returned from authenticateAsync');
        }
        
        if (!res.headersSent) {
          return res.status(401).json({ 
            message: 'Authentication failed',
            tokenExpired: true 
          });
        }
        return;
      }
      
      const { name, email, password, address, phone } = req.body;
      
      // Update user information
      if (name) user.name = name;
      if (email) user.email = email;
      if (password) {
        user.password = password;
        user.isModifiedPassword = true;
      }
      
      if (phone) user.phone = phone;
      
      if (address) {
        user.address = {
          ...user.address,
          ...address
        };
      }
      
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('Attempting to save user with ID:', user.id);
          if (address) {
            console.log('Address data to save:', address);
          }
        }
        
        // Attempt to save the user
        const saveResult = await user.save();
        
        if (!saveResult) {
          throw new Error('User save operation failed');
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('User saved successfully');
        }
        
        // Generate new token with updated info
        const token = user.generateToken();
        
        // Return the updated user data with the new token
        res.status(200).json({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          address: user.address,
          phone: user.phone,
          token
        });
      } catch (saveError) {
        console.error('Error saving user:', saveError);
        
        // Provide detailed error depending on environment
        const errorMessage = process.env.NODE_ENV === 'development' 
          ? `Database error: ${saveError.message}`
          : 'Det oppstod en feil ved lagring av brukerdata';
          
        return res.status(500).json({
          message: errorMessage,
          error: saveError.message,
          success: false
        });
      }
    } catch (error) {
      onError(error);
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
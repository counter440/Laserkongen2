const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// Token validation endpoint
router.get('/validate', protect, async (req, res) => {
  try {
    // If we make it this far, the token is valid and req.user is set
    // Check if we have an address in the user data
    console.log('Validating token for user:', req.user.id);
    console.log('Address data in user object:', req.user.address);
    
    // Just return the user's data with the token
    const userData = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      token: req.headers.authorization.split(' ')[1] // Return the token back
    };
    
    // Add address data if present
    if (req.user.address) {
      userData.address = req.user.address;
      console.log('Returning address in validation response:', userData.address);
    }
    
    res.status(200).json(userData);
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    res.status(200).json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      address: req.user.address,
      phone: req.user.phone
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    const user = req.user;
    
    console.log('Updating profile for user:', user.id);
    if (address) console.log('Address data:', address);
    
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
    
    // Save the updated user
    const success = await user.save();
    
    if (!success) {
      return res.status(500).json({ message: 'Failed to update user profile' });
    }
    
    // Generate new token with updated info
    const token = user.generateToken();
    
    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address,
      phone: user.phone,
      token
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

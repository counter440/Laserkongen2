const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const VippsPayment = require('../models/VippsPayment');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private/Admin
router.get('/', authenticate, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }
    
    // Get payments with optional filtering
    const filter = {};
    
    // Add filtering by status if present in query
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }
    
    // Add pagination options
    const options = {
      limit: req.query.limit || 50,
      skip: req.query.page ? (req.query.page - 1) * (req.query.limit || 50) : 0,
      sort: 'created_at DESC'
    };
    
    // Get payments
    const payments = await VippsPayment.find(filter, options);
    
    // Return payments
    return res.status(200).json({ payments });
  } catch (error) {
    console.error('Error getting payments:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private/Admin
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }
    
    // Get payment
    const payment = await VippsPayment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Return payment
    return res.status(200).json(payment);
  } catch (error) {
    console.error('Error getting payment:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
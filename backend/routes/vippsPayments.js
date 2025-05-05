const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const VippsPayment = require('../models/VippsPayment');
const Order = require('../models/Order');
const crypto = require('crypto');
const axios = require('axios');

// Helper function to get Vipps settings
const getVippsSettings = async () => {
  try {
    const pool = getPool();
    if (!pool) return null;

    const [rows] = await pool.query('SELECT * FROM vipps_settings LIMIT 1');
    
    if (rows.length === 0) {
      return null;
    }
    
    return {
      enabled: rows[0].enabled === 1,
      testMode: rows[0].test_mode === 1,
      clientId: rows[0].client_id,
      clientSecret: rows[0].client_secret,
      subscriptionKey: rows[0].subscription_key,
      merchantSerialNumber: rows[0].merchant_serial_number,
      redirectUrl: rows[0].redirect_url,
      fallbackUrl: rows[0].fallback_url,
      webhookUrl: rows[0].webhook_url
    };
  } catch (error) {
    console.error('Error getting Vipps settings:', error);
    return null;
  }
};

// Helper function to get Vipps access token
const getVippsAccessToken = async (settings) => {
  try {
    const baseUrl = settings.testMode ? 
      'https://apitest.vipps.no' : 
      'https://api.vipps.no';
    
    const response = await axios.post(
      `${baseUrl}/accesstoken/get`,
      {},
      {
        headers: {
          'client_id': settings.clientId,
          'client_secret': settings.clientSecret,
          'Ocp-Apim-Subscription-Key': settings.subscriptionKey
        }
      }
    );
    
    if (response.status === 200 && response.data.access_token) {
      return response.data.access_token;
    }
    
    throw new Error('Failed to get access token');
  } catch (error) {
    console.error('Error getting Vipps access token:', error);
    throw error;
  }
};

// @desc    Update Vipps settings
// @route   POST /api/payments/settings/vipps
// @access  Private/Admin
router.post('/settings/vipps', authenticate, async function(req, res) {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }
    
    const { 
      enabled, test_mode, client_id, client_secret, 
      subscription_key, merchant_serial_number,
      redirect_url, fallback_url, webhook_url
    } = req.body;
    
    const pool = getPool();
    
    // Check if settings exist
    const [rows] = await pool.query('SELECT id FROM vipps_settings LIMIT 1');
    
    if (rows.length > 0) {
      // Update existing settings
      await pool.query(
        `UPDATE vipps_settings SET 
          enabled = ?, 
          test_mode = ?, 
          client_id = ?, 
          client_secret = ?, 
          subscription_key = ?, 
          merchant_serial_number = ?,
          redirect_url = ?,
          fallback_url = ?,
          webhook_url = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [
          enabled === 'true' ? 1 : 0,
          test_mode === 'true' ? 1 : 0,
          client_id,
          client_secret,
          subscription_key,
          merchant_serial_number,
          redirect_url,
          fallback_url,
          webhook_url,
          rows[0].id
        ]
      );
    } else {
      // Create new settings
      await pool.query(
        `INSERT INTO vipps_settings (
          enabled, test_mode, client_id, client_secret, 
          subscription_key, merchant_serial_number,
          redirect_url, fallback_url, webhook_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          enabled === 'true' ? 1 : 0,
          test_mode === 'true' ? 1 : 0,
          client_id,
          client_secret,
          subscription_key,
          merchant_serial_number,
          redirect_url,
          fallback_url,
          webhook_url
        ]
      );
    }
    
    return res.status(200).json({ message: 'Vipps settings updated successfully' });
  } catch (error) {
    console.error('Error updating Vipps settings:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get Vipps settings
// @route   GET /api/payments/settings/vipps
// @access  Private/Admin
router.get('/settings/vipps', authenticate, async function(req, res) {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }
    
    const pool = getPool();
    
    const [rows] = await pool.query('SELECT * FROM vipps_settings LIMIT 1');
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Vipps settings not found' });
    }
    
    const settings = {
      enabled: rows[0].enabled ? 'true' : 'false',
      test_mode: rows[0].test_mode ? 'true' : 'false',
      client_id: rows[0].client_id,
      client_secret: rows[0].client_secret,
      subscription_key: rows[0].subscription_key,
      merchant_serial_number: rows[0].merchant_serial_number,
      redirect_url: rows[0].redirect_url,
      fallback_url: rows[0].fallback_url,
      webhook_url: rows[0].webhook_url
    };
    
    return res.status(200).json(settings);
  } catch (error) {
    console.error('Error getting Vipps settings:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Test Vipps connection
// @route   POST /api/payments/settings/vipps/test
// @access  Private/Admin
router.post('/settings/vipps/test', authenticate, async function(req, res) {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }
    
    const { 
      client_id, client_secret, subscription_key, 
      merchant_serial_number, test_mode
    } = req.body;
    
    // Test connection by trying to get an access token
    try {
      const settings = {
        clientId: client_id,
        clientSecret: client_secret,
        subscriptionKey: subscription_key,
        merchantSerialNumber: merchant_serial_number,
        testMode: test_mode === 'true'
      };
      
      const accessToken = await getVippsAccessToken(settings);
      
      return res.status(200).json({ 
        message: 'Vipps connection successful', 
        tokenReceived: true,
        environment: settings.testMode ? 'test' : 'production'
      });
    } catch (error) {
      console.error('Vipps connection test failed:', error);
      return res.status(400).json({ 
        message: 'Vipps connection test failed', 
        error: error.message || 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Error testing Vipps connection:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Initiate Vipps payment
// @route   POST /api/payments/vipps/initiate
// @access  Public
router.post('/vipps/initiate', async function(req, res) {
  try {
    // Make sure we have valid data
    let orderId, amount, customerInfo, orderDescription;
    
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      orderId = body.orderId;
      amount = body.amount;
      customerInfo = body.customerInfo || {};
      orderDescription = body.orderDescription;
      
      if (!orderId || !amount) {
        return res.status(400).json({ message: 'Order ID and amount are required' });
      }
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      console.log('Raw request body:', req.body);
      return res.status(400).json({ message: 'Invalid request format' });
    }
    
    // Get order details
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Get Vipps settings
    const settings = await getVippsSettings();
    if (!settings || !settings.enabled) {
      return res.status(400).json({ message: 'Vipps payments are not configured or enabled' });
    }
    
    // Generate a unique order ID for Vipps
    const vippsOrderId = `${orderId}-${crypto.randomBytes(4).toString('hex')}`;
    
    try {
      // Get access token
      const accessToken = await getVippsAccessToken(settings);
      
      // API base URL
      const baseUrl = settings.testMode ? 
        'https://apitest.vipps.no' : 
        'https://api.vipps.no';
      
      // Construct payment request
      const paymentRequest = {
        merchantInfo: {
          merchantSerialNumber: settings.merchantSerialNumber,
          callbackPrefix: process.env.BACKEND_URL || 'http://localhost:5001',
          fallBack: `${process.env.FRONTEND_URL || 'http://localhost:3002'}${settings.fallbackUrl}`,
          authToken: accessToken,
          isApp: false,
          merchantOrderId: vippsOrderId,
          paymentType: "eComm Regular Payment"
        },
        customerInfo: {
          mobileNumber: customerInfo.phoneNumber || '',
          email: customerInfo.email || '',
          firstName: customerInfo.name ? customerInfo.name.split(' ')[0] : '',
          lastName: customerInfo.name ? customerInfo.name.split(' ').slice(1).join(' ') : ''
        },
        transaction: {
          orderId: vippsOrderId,
          amount,
          transactionText: orderDescription || `Order #${orderId}`,
          skipLandingPage: false
        }
      };
      
      // Call Vipps API to initiate payment
      const response = await axios.post(
        `${baseUrl}/ecomm/v2/payments`,
        paymentRequest,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'Ocp-Apim-Subscription-Key': settings.subscriptionKey,
            'Merchant-Serial-Number': settings.merchantSerialNumber
          }
        }
      );
      
      if (response.status === 200 && response.data.url) {
        // Create a payment record in database
        const paymentData = {
          orderId,
          vippsOrderId,
          amount: amount / 100, // Convert back to NOK from øre
          status: 'initiated',
          paymentMethod: 'vipps',
          redirectUrl: response.data.url
        };
        
        const payment = await VippsPayment.create(paymentData);
        
        // Return success with redirect URL
        return res.status(200).json({
          success: true,
          redirectUrl: response.data.url,
          paymentId: payment ? payment.id : null
        });
      } else {
        throw new Error('Invalid response from Vipps');
      }
    } catch (error) {
      console.error('Error initiating Vipps payment:', error);
      
      // Create a failed payment record
      const paymentData = {
        orderId,
        vippsOrderId,
        amount: amount / 100, // Convert back to NOK from øre
        status: 'failed',
        paymentMethod: 'vipps',
        errorMessage: error.message || 'Unknown error'
      };
      
      await VippsPayment.create(paymentData);
      
      return res.status(400).json({ 
        message: 'Failed to initiate Vipps payment', 
        error: error.message || 'Unknown error' 
      });
    }
  } catch (error) {
    console.error('Server error initiating Vipps payment:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get payment status
// @route   GET /api/payments/vipps/status
// @access  Public
router.get('/vipps/status', async function(req, res) {
  try {
    const { orderId } = req.query;
    
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }
    
    // Get order and payment details
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const payment = await VippsPayment.findByOrderId(orderId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Get Vipps settings
    const settings = await getVippsSettings();
    if (!settings) {
      return res.status(400).json({ message: 'Vipps payments are not configured' });
    }
    
    try {
      // Get access token
      const accessToken = await getVippsAccessToken(settings);
      
      // API base URL
      const baseUrl = settings.testMode ? 
        'https://apitest.vipps.no' : 
        'https://api.vipps.no';
      
      // Call Vipps API to get payment status
      const response = await axios.get(
        `${baseUrl}/ecomm/v2/payments/${payment.vippsOrderId}/details`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Ocp-Apim-Subscription-Key': settings.subscriptionKey,
            'Merchant-Serial-Number': settings.merchantSerialNumber
          }
        }
      );
      
      if (response.status === 200) {
        const vippsStatus = response.data.transactionInfo.status;
        
        // Map Vipps status to our internal status
        let internalStatus = payment.status;
        
        if (vippsStatus === 'RESERVED') {
          internalStatus = 'authorized';
          
          // Update order status to paid if successfully paid
          if (order.status === 'pending' && !order.isPaid) {
            order.isPaid = true;
            order.paidAt = new Date().toISOString();
            order.status = 'processing';
            await order.save();
          }
        } else if (vippsStatus === 'SALE') {
          internalStatus = 'captured';
          
          // Update order status to paid if successfully paid
          if (order.status === 'pending' && !order.isPaid) {
            order.isPaid = true;
            order.paidAt = new Date().toISOString();
            order.status = 'processing';
            await order.save();
          }
        } else if (vippsStatus === 'CANCELLED') {
          internalStatus = 'cancelled';
        } else if (vippsStatus === 'REJECTED' || vippsStatus === 'FAILED') {
          internalStatus = 'failed';
        }
        
        // Update payment status
        if (payment.status !== internalStatus) {
          await payment.update({ 
            status: internalStatus,
            transactionId: response.data.transactionInfo.transactionId
          });
        }
        
        // Return payment status along with order
        return res.status(200).json({
          status: internalStatus,
          vippsStatus,
          order: {
            id: order.id,
            status: order.status,
            isPaid: order.isPaid,
            total: order.totalPrice
          },
          paymentData: {
            id: payment.id,
            orderId: payment.orderId,
            vippsOrderId: payment.vippsOrderId,
            amount: payment.amount,
            status: payment.status,
            createdAt: payment.createdAt
          }
        });
      } else {
        throw new Error('Invalid response from Vipps');
      }
    } catch (error) {
      console.error('Error getting Vipps payment status:', error);
      
      return res.status(400).json({ 
        message: 'Failed to get payment status', 
        error: error.message || 'Unknown error' 
      });
    }
  } catch (error) {
    console.error('Server error getting payment status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Handle webhook from Vipps
// @route   POST /api/payments/vipps/webhook
// @access  Public
router.post('/vipps/webhook', async function(req, res) {
  try {
    // Make sure we have valid JSON data
    let payload;
    try {
      payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      
      // Log webhook payload for debugging
      console.log('Received Vipps webhook:', JSON.stringify(payload, null, 2));
      
      if (!payload || !payload.orderId) {
        return res.status(400).json({ message: 'Invalid webhook payload' });
      }
    } catch (parseError) {
      console.error('Error parsing webhook payload:', parseError);
      console.log('Raw payload:', req.body);
      return res.status(400).json({ message: 'Invalid JSON payload' });
    }
    
    const vippsOrderId = payload.orderId;
    
    // Find payment by Vipps order ID
    const payment = await VippsPayment.findByVippsOrderId(vippsOrderId);
    if (!payment) {
      console.error('Payment not found for Vipps order ID:', vippsOrderId);
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Get order
    const order = await Order.findById(payment.orderId);
    if (!order) {
      console.error('Order not found for payment:', payment.id);
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Process payment status from webhook
    const status = payload.transactionInfo?.status;
    
    // Update payment and order based on status
    let internalStatus = payment.status;
    
    if (status === 'RESERVED' || status === 'AUTHORISED') {
      internalStatus = 'authorized';
      
      // Update order status if not already paid
      if (!order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date().toISOString();
        order.status = 'processing';
        await order.save();
      }
    } else if (status === 'SALE') {
      internalStatus = 'captured';
      
      // Update order status if not already paid
      if (!order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date().toISOString();
        order.status = 'processing';
        await order.save();
      }
    } else if (status === 'CANCELLED') {
      internalStatus = 'cancelled';
    } else if (status === 'REJECTED' || status === 'FAILED') {
      internalStatus = 'failed';
    }
    
    // Update payment
    await payment.update({
      status: internalStatus,
      transactionId: payload.transactionInfo?.transactionId
    });
    
    // Return success
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling Vipps webhook:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
// src/pages/api/orders/index.js
export default async function handler(req, res) {
  // GET all orders (admin only)
  if (req.method === 'GET') {
    try {
      const { status, limit, page } = req.query;
      
      // Get token from request headers
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
      }
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (status) queryParams.append('status', status);
      if (limit) queryParams.append('limit', limit);
      if (page) queryParams.append('page', page);
      
      // Call backend API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/orders?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        // If unauthorized due to expired token, return 401
        if (response.status === 401) {
          return res.status(401).json({ message: 'Authentication expired', tokenExpired: true });
        }
        throw new Error(data.message || 'Failed to fetch orders');
      }
      
      return res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ message: error.message || 'Server error' });
    }
  }
  
  // POST create a new order
  else if (req.method === 'POST') {
    try {
      const orderData = req.body;
      
      // Get token from request headers (optional for guest checkout)
      const token = req.headers.authorization?.split(' ')[1];
      
      // Call backend API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify(orderData)
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }
      
      return res.status(201).json(data);
    } catch (error) {
      console.error('Error creating order:', error);
      return res.status(500).json({ message: error.message || 'Server error' });
    }
  }
  
  else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
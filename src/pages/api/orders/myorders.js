// API route for getting current user's orders
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from request headers
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    console.log('Fetching orders with token:', token ? token.substring(0, 20) + '...' : 'none');
    
    // Call backend API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/orders/myorders`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    console.log('Backend API response:', data);
    
    if (!response.ok) {
      // If unauthorized due to expired token, return 401
      if (response.status === 401) {
        return res.status(401).json({ message: 'Authentication expired', tokenExpired: true });
      }
      
      // Forward the error message and details
      console.error('Error from backend API:', data.message);
      return res.status(response.status).json(data);
    }
    
    // Log the number of orders being returned
    console.log(`Returning ${Array.isArray(data) ? data.length : 0} orders to the frontend`);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
}
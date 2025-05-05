// src/pages/api/orders/stats.js
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
    
    // Call backend API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/orders/stats`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch order stats');
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching order stats:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
}
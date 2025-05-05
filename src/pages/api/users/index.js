// src/pages/api/users/index.js
export default async function handler(req, res) {
  // GET all users (admin only)
  if (req.method === 'GET') {
    try {
      // Get token from request headers
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
      }
      
      // Call backend API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/users`,
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
        throw new Error(data.message || 'Failed to fetch users');
      }
      
      return res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ message: error.message || 'Server error' });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
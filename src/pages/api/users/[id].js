// src/pages/api/users/[id].js
export default async function handler(req, res) {
  const { id } = req.query;
  
  // Get token from request headers
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  
  // Handle GET request - fetch a single user
  if (req.method === 'GET') {
    try {
      // Call backend API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/users/${id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user');
      }
      
      return res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ message: error.message || 'Server error' });
    }
  }
  
  // Handle PUT request - update user
  if (req.method === 'PUT') {
    try {
      // Call backend API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/users/${id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(req.body)
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user');
      }
      
      return res.status(200).json(data);
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ message: error.message || 'Server error' });
    }
  }
  
  // Handle DELETE request - delete user
  if (req.method === 'DELETE') {
    try {
      // Call backend API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/users/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete user');
      }
      
      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ message: error.message || 'Server error' });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}
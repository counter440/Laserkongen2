// src/pages/api/users/register-admin.js
export default async function handler(req, res) {
  // Only handle POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Get token from request headers
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    // Get user data from request body
    const { name, email, password, role, phone } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }
    
    // Call backend API to register the user
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/users/register-admin`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, password, role, phone })
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to register user');
    }
    
    // Return success response
    return res.status(201).json(data);
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
}
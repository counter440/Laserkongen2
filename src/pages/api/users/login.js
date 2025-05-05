// src/pages/api/users/login.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Call backend API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/users/login`;
    console.log('Making API request to:', apiUrl);
    
    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
    } catch (fetchError) {
      console.error('Network error connecting to backend:', fetchError);
      return res.status(503).json({ 
        message: 'Unable to connect to authentication service. Please try again later.' 
      });
    }

    console.log('Login response status:', response.status);
    
    let data;
    try {
      data = await response.json();
      console.log('Response data structure:', Object.keys(data));
    } catch (jsonError) {
      console.error('Error parsing response JSON:', jsonError);
      return res.status(500).json({ 
        message: 'Invalid response from authentication service' 
      });
    }

    if (!response.ok) {
      console.error('Login failed:', data);
      return res.status(response.status).json({ 
        message: data.message || 'Authentication failed' 
      });
    }

    if (!data || !data.token) {
      console.error('Missing token in response:', data);
      return res.status(500).json({ message: 'Invalid authentication response' });
    }

    console.log('Login successful for user with role:', data.role);
    res.status(200).json(data);
  } catch (error) {
    console.error('Unhandled login error:', error);
    res.status(500).json({ message: 'An unexpected error occurred during login' });
  }
}
// API route for site settings
export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/settings/site`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      ...(req.body && { body: JSON.stringify(req.body) })
    });
    
    // Get the response data
    const data = await response.json();
    
    // Special handling for 401 Unauthorized errors
    if (response.status === 401) {
      return res.status(401).json({ message: 'Authentication expired', tokenExpired: true });
    }
    
    // Return the response with the same status code
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error connecting to backend service:', error);
    res.status(500).json({ message: 'Error connecting to backend service' });
  }
}
// API route for individual contact form actions
export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  const { id } = req.query;
  
  // Only allow GET and DELETE requests
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/contact/${id}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      }
    });
    
    // Get the response data
    const data = await response.json();
    
    // Return the response with the same status code
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error connecting to backend service:', error);
    res.status(500).json({ message: 'Error connecting to backend service' });
  }
}
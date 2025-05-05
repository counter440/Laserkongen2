// API route for products
export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  
  try {
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/products`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
      },
      ...(req.body && { body: JSON.stringify(req.body) })
    });
    
    // Get the response data
    const data = await response.json();
    
    // Return the response with the same status code
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error forwarding request to backend:', error);
    res.status(500).json({ message: 'Error connecting to backend service' });
  }
}
// API route for a specific order
export default async function handler(req, res) {
  const { id } = req.query;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  
  try {
    console.log(`Processing ${req.method} request for order ${id}`);
    
    // Get token from request headers
    const token = req.headers.authorization?.split(' ')[1];
    
    // Forward the request to the backend
    const url = `${apiUrl}/api/orders/${id}`;
    console.log(`Forwarding request to: ${url}`);
    
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(req.body && { body: JSON.stringify(req.body) })
    });
    
    // Get the response data
    const data = await response.json();
    
    // Log the response for debugging
    console.log(`Backend response status: ${response.status}`);
    console.log('Backend response data:', data);
    
    if (!response.ok) {
      // Forward the error status and message from the backend
      return res.status(response.status).json({
        message: data.message || `Failed to ${req.method.toLowerCase()} order`,
        error: data.error || null
      });
    }
    
    // Return the response with the same status code
    res.status(response.status).json(data);
  } catch (error) {
    console.error(`Error ${req.method.toLowerCase()} order:`, error);
    res.status(500).json({ 
      message: error.message || 'Server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
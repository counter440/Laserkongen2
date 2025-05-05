// API route for updating order status
export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  const { id } = req.query;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  
  try {
    console.log(`Processing PUT request to update status for order ${id}`);
    
    // Get token from request headers
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    // Get status from request body
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Forward the request to the backend
    const url = `${apiUrl}/api/orders/${id}/status`;
    console.log(`Forwarding request to: ${url}`);
    console.log(`Request body:`, JSON.stringify({ status }));
    console.log(`Authorization token present:`, !!token);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response status text: ${response.statusText}`);
    
    // Get the response data
    const data = await response.json();
    
    // Log the response for debugging
    console.log(`Backend response status: ${response.status}`);
    console.log('Backend response data:', data);
    
    if (!response.ok) {
      // Forward the error status and message from the backend
      return res.status(response.status).json({
        message: data.message || 'Failed to update order status',
        error: data.error || null
      });
    }
    
    // Return the response with the same status code
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      message: error.message || 'Server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
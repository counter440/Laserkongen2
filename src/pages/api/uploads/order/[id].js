import axios from 'axios';

/**
 * API handler for retrieving files associated with an order
 * This redirects to the new `/api/orders/[id]/files` endpoint
 * but keeps backward compatibility
 */
export default async function handler(req, res) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get order ID from URL
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'Order ID is required' });
  }

  try {
    // Forward to the new API endpoint
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    
    // Forward the authorization header if it exists
    const authHeader = req.headers.authorization;
    const headers = authHeader ? {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    };
    
    console.log(`Using legacy endpoint - redirecting fetch for order ${id} files to new endpoint`);
    
    // Try the new endpoint first
    try {
      const response = await axios.get(
        `${backendUrl}/api/orders/${id}/files`,
        { headers }
      );
      
      // Return the response
      return res.status(response.status).json(response.data);
    } catch (newEndpointError) {
      // If the new endpoint fails, fallback to the old one
      console.error(`New endpoint failed, falling back to legacy backend path: ${newEndpointError.message}`);
      
      // Construct the backend path
      const backendPath = `/api/uploads/order/${id}`;
      
      const response = await axios.get(
        `${backendUrl}${backendPath}`,
        { headers }
      );
      
      // Return the response
      return res.status(response.status).json(response.data);
    }
  } catch (error) {
    console.error(`Error retrieving files for order ${id}:`, error);
    
    // Handle axios errors
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.message || 'Error from backend',
        error: error.response.data.error || error.message
      });
    }
    
    // Generic error
    return res.status(500).json({ 
      message: `Error retrieving files for order ${id}`,
      error: error.message
    });
  }
}
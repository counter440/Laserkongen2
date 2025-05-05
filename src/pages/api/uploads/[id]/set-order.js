import axios from 'axios';

/**
 * API handler for associating a file with an order
 * This is a utility endpoint for the admin panel
 */
export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get the file ID from the URL
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'File ID is required' });
  }
  
  // Get the order ID from the request body
  const { orderId } = req.body;
  
  if (!orderId) {
    return res.status(400).json({ message: 'Order ID is required in the request body' });
  }

  try {
    // Forward the authorization header if it exists
    const authHeader = req.headers.authorization;
    const headers = authHeader ? {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    };
    
    // Backend URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    
    console.log(`Setting file ${id} to be associated with order ${orderId}`);
    
    // Use PATCH to update the file with the order ID
    const response = await axios.patch(
      `${backendUrl}/api/uploads/${id}`,
      { orderId: orderId },
      { headers }
    );

    // Return the backend response
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`Error associating file ${id} with order:`, error);
    
    // If the error is from the axios request, pass along the status code and message
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.message || 'Error from backend',
        error: error.response.data.error || error.message
      });
    }
    
    return res.status(500).json({ 
      message: `Error associating file with order`,
      error: error.message
    });
  }
}
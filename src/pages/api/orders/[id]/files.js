import axios from 'axios';

/**
 * API handler for files associated with an order
 * This handles both GET (retrieve files) and POST (associate files with order)
 */
export default async function handler(req, res) {
  // Handle different HTTP methods
  if (req.method === 'POST') {
    return handlePost(req, res);
  } else if (req.method === 'GET') {
    return handleGet(req, res);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

/**
 * GET handler - retrieves files associated with an order
 */
async function handleGet(req, res) {
  // Get the order ID from the URL
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'Order ID is required' });
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
    
    console.log(`Retrieving files for order ${id}`);
    
    // GET request to backend
    const response = await axios.get(
      `${backendUrl}/api/orders/${id}/files`,
      { headers }
    );

    // Return the backend response
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`Error retrieving files for order ${id}:`, error);
    
    // If the error is from the axios request, pass along the status code and message
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.message || 'Error from backend',
        error: error.response.data.error || error.message
      });
    }
    
    return res.status(500).json({ 
      message: `Error retrieving files for order`,
      error: error.message
    });
  }
}

/**
 * POST handler - associates files with an order
 */
async function handlePost(req, res) {
  // Get the order ID from the URL
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'Order ID is required' });
  }
  
  // Get the file IDs from the request body
  const { fileIds } = req.body;
  
  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ message: 'File IDs array is required' });
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
    
    console.log(`Associating files ${fileIds.join(', ')} with order ${id}`);
    
    // Use POST to create the association
    const response = await axios.post(
      `${backendUrl}/api/orders/${id}/files`,
      { fileIds },
      { headers }
    );

    // Return the backend response
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`Error associating files with order ${id}:`, error);
    
    // If the error is from the axios request, pass along the status code and message
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.message || 'Error from backend',
        error: error.response.data.error || error.message
      });
    }
    
    return res.status(500).json({ 
      message: `Error associating files with order`,
      error: error.message
    });
  }
}
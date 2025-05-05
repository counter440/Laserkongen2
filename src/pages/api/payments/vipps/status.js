// API route for checking Vipps payment status
export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
    
    const { orderId } = req.query;
    
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/payments/vipps/status?orderId=${orderId}`, {
      method: 'GET',
      headers: {
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
      }
    });
    
    // Get the response data
    const data = await response.json();
    
    // Return the response with the same status code
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error checking Vipps payment status:', error);
    res.status(500).json({ message: 'Error checking Vipps payment status' });
  }
}
// API route for initiating a Vipps payment
export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/payments/vipps/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
      },
      body: JSON.stringify(req.body)
    });
    
    // Get the response data
    const data = await response.json();
    
    // Return the response with the same status code
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error initiating Vipps payment:', error);
    res.status(500).json({ message: 'Error initiating Vipps payment' });
  }
}
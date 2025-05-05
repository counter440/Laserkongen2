// API route for handling Vipps payment webhooks
export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
    
    // Forward the webhook to the backend
    const response = await fetch(`${backendUrl}/api/payments/vipps/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    
    // Handle response based on backend result
    if (response.ok) {
      return res.status(200).json({ success: true });
    } else {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }
  } catch (error) {
    console.error('Error handling Vipps webhook:', error);
    res.status(500).json({ message: 'Server error processing webhook' });
  }
}
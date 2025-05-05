// API route for contact form submissions
export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  
  // Only allow POST requests for contact form
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Validate form data
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Please provide name, email, and message' });
    }
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    // Get the response data
    const data = await response.json();
    
    // Return the response with the same status code
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ message: 'Error submitting contact form' });
  }
}
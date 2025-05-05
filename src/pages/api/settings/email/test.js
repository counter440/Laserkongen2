// API route for testing email settings
export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  
  // Only allow POST requests for testing emails
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    if (!req.body || !req.body.email) {
      return res.status(400).json({ message: 'Email address is required' });
    }
    
    const email = req.body.email.trim();
    
    // Check if at least one email in a comma-separated list has @ symbol
    const emails = email.split(',');
    let validEmails = false;
    for (const emailAddress of emails) {
      if (emailAddress.trim().includes('@')) {
        validEmails = true;
        break;
      }
    }
    
    if (!validEmails) {
      return res.status(400).json({ message: 'Invalid email address format' });
    }
    
    console.log('Test email request received for:', email);
    
    try {
      // Forward the request to the backend test endpoint
      const response = await fetch(`${backendUrl}/api/settings/email/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization
        },
        body: JSON.stringify({ email })
      });
      
      // Get the response data
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Invalid JSON response from backend:', jsonError);
        return res.status(500).json({ message: 'Invalid response from email service' });
      }
      
      console.log('Backend test email response:', response.status, data);
      
      // Return the response with the same status code
      return res.status(response.status).json(data);
    } catch (fetchError) {
      console.error('Network error connecting to backend:', fetchError);
      return res.status(503).json({ 
        message: 'Unable to connect to email service',
        error: fetchError.message 
      });
    }
  } catch (error) {
    console.error('Error testing email settings:', error);
    res.status(500).json({ 
      message: 'Error testing email settings',
      error: error.message 
    });
  }
}
// API route for user registration
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, password, address } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Call backend API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/users/register`;
    console.log('Making registration API request to:', apiUrl);
    
    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, address })
      });
    } catch (fetchError) {
      console.error('Network error connecting to backend:', fetchError);
      return res.status(503).json({ 
        message: 'Unable to connect to registration service. Please try again later.' 
      });
    }
    
    console.log('Registration response status:', response.status);
    
    let data;
    try {
      data = await response.json();
      console.log('Response data structure:', Object.keys(data));
    } catch (jsonError) {
      console.error('Error parsing response JSON:', jsonError);
      return res.status(500).json({ 
        message: 'Invalid response from registration service' 
      });
    }
    
    if (!response.ok) {
      console.error('Registration failed:', data);
      return res.status(response.status).json({ 
        message: data.message || 'Registration failed' 
      });
    }
    
    if (!data || !data.token) {
      console.error('Missing token in response:', data);
      return res.status(500).json({ message: 'Invalid registration response' });
    }
    
    console.log('Registration successful for user with role:', data.role);
    res.status(201).json(data);
  } catch (error) {
    console.error('Unhandled registration error:', error);
    res.status(500).json({ message: 'An unexpected error occurred during registration' });
  }
}
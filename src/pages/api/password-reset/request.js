// src/pages/api/password-reset/request.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'E-postadresse er påkrevd' });
    }
    
    // Call backend API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/password-reset/request`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ 
      message: 'En feil oppstod. Vennligst prøv igjen senere.' 
    });
  }
}
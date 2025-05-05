// src/pages/api/password-reset/reset.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ 
        message: 'Token og nytt passord er påkrevd' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Passord må være minst 6 tegn langt' 
      });
    }
    
    // Call backend API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/password-reset/reset`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });
    
    const data = await response.json();
    
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ 
      message: 'En feil oppstod. Vennligst prøv igjen senere.' 
    });
  }
}
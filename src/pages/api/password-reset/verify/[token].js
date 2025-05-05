// src/pages/api/password-reset/verify/[token].js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ valid: false, message: 'Ugyldig token' });
    }
    
    // Call backend API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/password-reset/verify/${token}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ 
      valid: false, 
      message: 'En feil oppstod. Vennligst prøv igjen senere.' 
    });
  }
}
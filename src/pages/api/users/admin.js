// src/pages/api/users/admin.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, password, adminSecretKey } = req.body;

    console.log('Admin creation request:', { name, email, adminSecretKey });

    // Call backend API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/users/admin`;
    console.log('Making API request to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password, adminSecretKey })
    });

    const data = await response.json();
    console.log('Admin creation response status:', response.status);

    if (!response.ok) {
      console.error('Admin creation failed:', data);
      throw new Error(data.message || 'Admin creation failed');
    }

    console.log('Admin created successfully:', { id: data._id, name: data.name, email: data.email, role: data.role });
    res.status(201).json(data);
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({ message: error.message || 'An error occurred during admin creation' });
  }
}
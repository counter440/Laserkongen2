import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

/**
 * API handler for reprocessing a specific upload by ID
 */
export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  // Get the upload ID from the URL
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'Upload ID is required' });
  }

  try {
    // Forward the authorization header if it exists
    const authHeader = req.headers.authorization;
    const headers = authHeader 
      ? { 
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        } 
      : { 'Content-Type': 'application/json' };
    
    // Backend URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    
    // Make the request to the backend reprocess endpoint
    const response = await axios.post(
      `${backendUrl}/api/uploads/${id}/reprocess`, 
      {}, // Empty body since we just need to trigger reprocessing
      { headers }
    );

    // Return the backend response
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`Error reprocessing upload ${id}:`, error);
    
    // If the error is from the axios request, pass along the status code and message
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.message || 'Error from backend',
        error: error.response.data.error || error.message
      });
    }
    
    return res.status(500).json({ 
      message: `Error reprocessing upload ${id}`,
      error: error.message
    });
  }
}
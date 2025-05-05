import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

/**
 * API handler for operations on a specific upload by ID
 * This handles GET, PATCH, and DELETE operations
 */
export default async function handler(req, res) {
  // Allow GET, PATCH, and DELETE methods
  if (!['GET', 'PATCH', 'DELETE'].includes(req.method)) {
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
    let response;
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        response = await axios.get(`${backendUrl}/api/uploads/${id}`, { headers });
        break;
        
      case 'PATCH':
        response = await axios.patch(
          `${backendUrl}/api/uploads/${id}`, 
          req.body, 
          { headers }
        );
        break;
        
      case 'DELETE':
        response = await axios.delete(`${backendUrl}/api/uploads/${id}`, { headers });
        break;
    }

    // Return the backend response
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`Error ${req.method} upload ${id}:`, error);
    
    // If the error is from the axios request, pass along the status code and message
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.message || 'Error from backend',
        error: error.response.data.error || error.message
      });
    }
    
    return res.status(500).json({ 
      message: `Error processing ${req.method} request for upload ${id}`,
      error: error.message
    });
  }
}
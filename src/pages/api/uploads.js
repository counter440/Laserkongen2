import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

/**
 * API handler for retrieving uploads
 * This connects the frontend admin/uploads.js page to the backend uploads API
 */
export default async function handler(req, res) {
  // Allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get search parameters
    const { fileType, limit, page, orderFiles, temporaryOnly } = req.query;
    
    console.log('Received uploads API request with query:', req.query);
    
    // Construct query string
    // FORCE INCLUSION OF ALL FILES
    let queryString = '?';
    
    // Add essential params but NEVER filter by default
    if (limit) queryString += `limit=${limit}&`;
    if (page) queryString += `page=${page}&`;
    
    // Only add specific filters if explicitly requested
    if (fileType) queryString += `fileType=${fileType}&`;
    
    // Only filter by orders if specifically requested
    if (orderFiles === 'true') {
      queryString += `orderFiles=true&`;
      console.log(`Adding explicit orderFiles=true to query string`);
    }
    
    // Only filter by temporary files if specifically requested
    if (temporaryOnly === 'true') {
      queryString += `temporaryOnly=true&`;
      console.log(`Adding explicit temporaryOnly=true to query string`);
    }
    
    // Always add populate parameter to include order data
    queryString += `populate=order`;
    
    console.log(`FINAL QUERY STRING: ${queryString}`);
    
    console.log('Final query string:', queryString);
    
    console.log('Constructed backend query string:', queryString);
    
    // Log more detailed debug info
    if (orderFiles) {
      console.log('⚠️ Query includes orderFiles parameter:', orderFiles);
      console.log('⚠️ Type of orderFiles parameter:', typeof orderFiles);
      
      // Force orderFiles to boolean true for consistent handling between Next.js API and backend
      if (orderFiles === 'true' || orderFiles === true) {
        console.log('⚠️ Converting orderFiles to boolean true for consistency');
        req.query.orderFiles = true;
      }
    }
    
    // Always ensure we populate the order data
    if (!queryString.includes('populate=order')) {
      queryString = queryString === '?' 
        ? '?populate=order' 
        : queryString + '&populate=order';
      console.log('Added populate=order parameter to ensure order data is loaded');
    }
    
    // Forward the authorization header if it exists
    const authHeader = req.headers.authorization;
    const headers = authHeader ? { Authorization: authHeader } : {};
    
    // Make request to the backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    console.log('========== DEBUG: FRONTEND API PROXY ==========');
    console.log(`Making request to backend at: ${backendUrl}/api/uploads${queryString}`);
    console.log('With headers:', headers);
    
    const response = await axios.get(`${backendUrl}/api/uploads${queryString}`, {
      headers
    });

    // Log the backend response
    console.log('Backend response status:', response.status);
    console.log('Backend response data summary:', {
      total: response.data.total || 0,
      pages: response.data.pages || 0,
      fileCount: response.data.files?.length || 0
    });

    // Debug - log ordered files in response
    if (response.data.files && response.data.files.length > 0) {
      // Count files with orders
      const filesWithOrders = response.data.files.filter(file => file.order_id || file.order);
      console.log(`Files with order associations: ${filesWithOrders.length} of ${response.data.files.length}`);
      
      if (filesWithOrders.length > 0) {
        console.log('First few files with orders:');
        filesWithOrders.slice(0, 3).forEach(file => {
          console.log(`- File ID ${file.id}: order_id=${file.order_id}, has order object: ${!!file.order}`);
        });
      }
      
      // Count temporary files
      const tempFiles = response.data.files.filter(file => file.temporary);
      console.log(`Temporary files: ${tempFiles.length} of ${response.data.files.length}`);
      
      // Count non-temporary files  
      const nonTempFiles = response.data.files.filter(file => !file.temporary);
      console.log(`Non-temporary files: ${nonTempFiles.length} of ${response.data.files.length}`);
    }

    // Return the backend response
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error fetching uploads:', error);
    
    // If the error is from the axios request, pass along the status code and message
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.message || 'Error from backend',
        error: error.response.data.error || error.message
      });
    }
    
    return res.status(500).json({ 
      message: 'Error fetching uploads',
      error: error.message
    });
  }
}
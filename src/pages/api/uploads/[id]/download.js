import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { promisify } from 'util';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // Get auth token from request
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    console.log(`Attempting to download file with ID: ${id}`);
    
    // Get file information from backend
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    console.log(`Requesting file info from: ${backendUrl}/api/uploads/${id}`);
    
    const fileResponse = await axios.get(`${backendUrl}/api/uploads/${id}`, {
      headers: {
        Authorization: token
      }
    });
    
    if (!fileResponse.data) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const file = fileResponse.data;
    
    // Determine if we need to proxy the file or redirect
    if (file.fileUrl.startsWith('http')) {
      // For external URLs, redirect
      return res.redirect(file.fileUrl);
    } else {
      console.log(`File object received:`, JSON.stringify(file));
      
      // For local files, direct access to file path
      if (file.path && file.path.includes('/uploads/')) {
        try {
          // Try to directly serve the file from the filesystem
          const filePath = path.join(process.cwd(), '..', file.path);
          console.log(`Attempting to serve file from path: ${filePath}`);
          
          // Check if file exists
          if (!fs.existsSync(filePath)) {
            console.log(`File does not exist at path: ${filePath}`);
            return res.status(404).json({ message: 'File not found on disk' });
          }
          
          // Read file and serve directly
          console.log(`Reading file from: ${filePath}`);
          const fileData = fs.readFileSync(filePath);
          
          // Set content disposition header for download
          res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
          res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
          
          // Send the file
          return res.send(fileData);
        } catch (fsError) {
          console.error('Error accessing file:', fsError);
        }
      }
      
      // Fallback to proxying the file
      console.log(`Falling back to proxying file from: ${backendUrl}/api/uploads/${id}/stream`);
      
      // Create a request to the file endpoint
      const fileStreamResponse = await axios.get(`${backendUrl}/api/uploads/${id}/stream`, {
        headers: {
          Authorization: token
        },
        responseType: 'stream'
      });
      
      // Set content disposition header for download
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
      
      // Pipe the file stream to the response
      fileStreamResponse.data.pipe(res);
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    
    // Check if response was already sent
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Error downloading file', 
        error: error.message 
      });
    }
  }
}
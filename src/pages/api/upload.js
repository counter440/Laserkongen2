import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * API handler for file uploads
 * This connects the frontend upload.js page to the backend upload API
 */
export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Write to debug log
  const debugLog = (message) => {
    const fs = require('fs');
    fs.appendFileSync('/root/Laserkongen/Laserkongen/debug-upload.log', `${new Date().toISOString()}: ${message}\n`);
  };

  debugLog('Upload API handler called');

  try {
    // Parse form with uploaded file
    const form = new IncomingForm({
      keepExtensions: true,
      multiples: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
      encoding: 'utf-8',
    });
    
    debugLog('Created IncomingForm instance');
    console.log("Starting to parse form data");
    
    // Parse the request
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error("Error parsing form:", err);
          return reject(err);
        }
        console.log("Form parsed successfully", { 
          fieldKeys: Object.keys(fields),
          fileKeys: Object.keys(files)
        });
        resolve([fields, files]);
      });
    });

    // Get the uploaded file - handle both single file and array of files
    let file;
    debugLog(`Files object keys: ${Object.keys(files)}`);
    debugLog(`File entry type: ${files.file ? (Array.isArray(files.file) ? 'array' : typeof files.file) : 'undefined'}`);
    
    if (Array.isArray(files.file)) {
      // If it's an array, take the first file
      file = files.file[0];
      debugLog(`File is in array format, using first file: ${file ? file.originalFilename : 'undefined'}`);
      console.log('File is in array format, using first file:', file ? file.originalFilename : 'undefined');
    } else {
      file = files.file;
      debugLog(`File is a single object: ${file ? file.originalFilename : 'undefined'}`);
    }
    
    if (!file) {
      const errorMsg = 'No file in uploaded files';
      debugLog(`ERROR: ${errorMsg} - ${JSON.stringify(files)}`);
      console.error(errorMsg, files);
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Log file information to verify it's correct
    const fileInfo = {
      originalName: file.originalFilename,
      size: file.size,
      type: file.mimetype,
      hasFilepath: !!file.filepath,
      filepath: file.filepath,
      isArray: Array.isArray(files.file)
    };
    debugLog(`File info: ${JSON.stringify(fileInfo)}`);
    console.log('File info:', fileInfo);

    // Create FormData to forward to the backend
    const formData = new FormData();
    
    // Read file from temp location and add to form data
    if (!file.filepath) {
      const errorMsg = 'Missing filepath in file object';
      debugLog(`ERROR: ${errorMsg} - ${JSON.stringify(file)}`);
      console.error(errorMsg, file);
      return res.status(400).json({ message: 'File upload error: Missing filepath' });
    }
    
    debugLog(`Attempting to read file from: ${file.filepath}`);
    
    try {
      // Check if file exists
      if (!fs.existsSync(file.filepath)) {
        const errorMsg = `File does not exist at path: ${file.filepath}`;
        debugLog(`ERROR: ${errorMsg}`);
        console.error(errorMsg);
        return res.status(400).json({ message: errorMsg });
      }
      
      debugLog(`File exists at ${file.filepath}, creating read stream`);
      const fileStream = fs.createReadStream(file.filepath);
      
      // Log file status
      const stats = fs.statSync(file.filepath);
      debugLog(`File size: ${stats.size} bytes, isFile: ${stats.isFile()}`);
      
      formData.append('file', fileStream, {
        filename: file.originalFilename || 'uploaded-file',
        contentType: file.mimetype || 'application/octet-stream',
      });
      debugLog(`Successfully added file to FormData`);
    } catch (streamError) {
      debugLog(`ERROR creating read stream: ${streamError.message}`);
      console.error('Error creating read stream:', streamError);
      return res.status(500).json({ message: 'Error processing file upload', error: streamError.message });
    }
    
    // Add preview image if it exists in the fields
    if (fields.preview) {
      console.log('Preview found in fields, length:', fields.preview.length);
      // Handle preview differently based on whether it's an array or string
      const previewValue = Array.isArray(fields.preview) ? fields.preview[0] : fields.preview;
      formData.append('preview', previewValue);
      console.log('Added preview to formData');
    } else {
      console.log('No preview found in fields');
    }
    
    // Forward request to backend API with authorization if available
    const authHeader = req.headers.authorization;
    const headers = authHeader ? { Authorization: authHeader } : {};
    
    // Make request to the backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    debugLog(`Making request to backend at: ${backendUrl}/api/upload`);
    
    try {
      const response = await axios.post(`${backendUrl}/api/upload`, formData, {
        headers: {
          ...headers,
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      
      debugLog(`Backend response status: ${response.status}`);
      debugLog(`Backend response data: ${JSON.stringify(response.data)}`);
      
      // Return the backend response
      return res.status(response.status).json(response.data);
    } catch (axiosError) {
      debugLog(`ERROR in axios request: ${axiosError.message}`);
      if (axiosError.response) {
        debugLog(`Backend error response: Status ${axiosError.response.status}, Data: ${JSON.stringify(axiosError.response.data)}`);
        return res.status(axiosError.response.status).json(axiosError.response.data);
      } else {
        return res.status(500).json({ 
          message: 'Error connecting to backend server',
          error: axiosError.message
        });
      }
    }
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      message: 'Error processing upload',
      error: error.message
    });
  }
}
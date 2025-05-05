// src/pages/api/users/validate-session.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'No token provided',
        tokenExpired: true
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided',
        tokenExpired: true 
      });
    }

    // Call backend API to validate the token
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/users/validate`;
    
    // Create an AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Check if it's an abort error (timeout)
      if (fetchError.name === 'AbortError') {
        console.error('Request timeout when validating session');
        // On timeout, just return the original user data without validation
        // This prevents users from being logged out due to temporary network issues
        return res.status(200).json(JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()));
      }
      
      console.error('Network error connecting to backend:', fetchError);
      // Don't log the user out on network errors - assume token is still valid
      // The next successful request will validate properly
      return res.status(200).json({
        // Extract user ID and role from token without validation
        // This is a fallback for network issues only
        ...JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()),
        token: token
      });
    }
    
    if (!response.ok) {
      // If the token is invalid or expired, the backend will return an appropriate status code
      const errorData = await response.json();
      return res.status(response.status).json({ 
        message: errorData.message || 'Session invalid or expired',
        tokenExpired: true
      });
    }
    
    // If token is valid, the backend will return the user data
    const userData = await response.json();
    
    // Return the updated user data
    res.status(200).json({
      ...userData,
      token: token // Ensure the token is included in the response
    });
  } catch (error) {
    console.error('Session validation error:', error);
    
    // Don't log the user out on parsing errors - just send back the token
    try {
      // Try to extract data from the token itself as a fallback
      const payload = JSON.parse(Buffer.from(
        req.headers.authorization.split(' ')[1].split('.')[1], 
        'base64'
      ).toString());
      
      return res.status(200).json({
        ...payload,
        token: req.headers.authorization.split(' ')[1]
      });
    } catch (tokenParseError) {
      // If we can't even parse the token, then it's invalid
      return res.status(401).json({ 
        message: 'Invalid token format', 
        tokenExpired: true,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}
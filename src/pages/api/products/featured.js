// API route for featured products
export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  
  try {
    console.log('API frontend: Fetching featured products from backend');
    
    // Add cache-busting parameter
    const timestamp = new Date().getTime();
    const url = `${backendUrl}/api/products/featured?_t=${timestamp}`;
    console.log('API frontend: Request URL:', url);
    
    // Forward the request to the backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      console.log('API frontend: Backend returned error:', response.status);
      throw new Error(`Backend returned ${response.status}`);
    }
    
    // Get the response data
    const products = await response.json();
    console.log(`API frontend: Got ${products.length} featured products from backend:`, 
      products.map(p => ({ id: p.id, name: p.name, featured: p.featuredProduct }))
    );
    
    // Set strong cache control headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Return the response
    res.status(200).json(products);
  } catch (error) {
    console.error('Error forwarding request to backend:', error);
    res.status(500).json({ message: 'Error connecting to backend service' });
  }
}
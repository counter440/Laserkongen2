import { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export default function ProductsContent() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch products
    const fetchProducts = async () => {
      try {
        // Get auth token from session storage
        const userInfo = sessionStorage.getItem('userInfo')
          ? JSON.parse(sessionStorage.getItem('userInfo'))
          : null;
            
        // If no auth token, return early
        if (!userInfo || !userInfo.token) {
          console.error('No authentication token found');
          setIsLoading(false);
          return;
        }
        
        // Set up the auth header
        const headers = {
          'Authorization': `Bearer ${userInfo.token}`,
          'Content-Type': 'application/json'
        };

        const response = await fetch('/api/products', { headers });
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products by search query
  const filteredProducts = products.filter(product => {
    const searchLower = searchQuery.toLowerCase();
    return (
      product.name?.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      product.category?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex space-x-2">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <FaSearch className="text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <FaPlus className="mr-2" /> Add Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div 
                className="h-48 bg-gray-200 overflow-hidden"
                style={{
                  backgroundImage: `url(${product.image || '/images/placeholder-product.jpg'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              ></div>
              <div className="p-4">
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-lg font-bold">${parseFloat(product.price || 0).toFixed(2)}</span>
                  <div className="flex space-x-2">
                    <button className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200">
                      <FaEdit />
                    </button>
                    <button className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 flex justify-center items-center h-64 bg-white rounded-lg shadow">
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}
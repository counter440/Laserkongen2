import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaEye, FaEdit, FaTrash } from 'react-icons/fa';

export default function OrdersContent() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch orders
    const fetchOrders = async () => {
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
        
        const response = await fetch(`/api/orders?status=${filter}`, { headers });
        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
        } else {
          console.error('Failed to fetch orders:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [filter]);

  // Filter orders by search query
  const filteredOrders = orders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.id?.toString().includes(searchLower) ||
      order.user?.name?.toLowerCase().includes(searchLower) ||
      order.user?.email?.toLowerCase().includes(searchLower) ||
      order.status?.toLowerCase().includes(searchLower)
    );
  });

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setIsLoading(true);
  };

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
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex space-x-2">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <FaSearch className="text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search orders..."
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative inline-block text-left">
            <button 
              className="flex items-center px-4 py-2 border rounded-md bg-white"
            >
              <FaFilter className="mr-2" /> Filter
            </button>
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white z-10">
              <div className="py-1">
                <button 
                  className={`block px-4 py-2 text-sm w-full text-left ${filter === 'all' ? 'bg-gray-100' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  All Orders
                </button>
                <button 
                  className={`block px-4 py-2 text-sm w-full text-left ${filter === 'pending' ? 'bg-gray-100' : ''}`}
                  onClick={() => handleFilterChange('pending')}
                >
                  Pending
                </button>
                <button 
                  className={`block px-4 py-2 text-sm w-full text-left ${filter === 'processing' ? 'bg-gray-100' : ''}`}
                  onClick={() => handleFilterChange('processing')}
                >
                  Processing
                </button>
                <button 
                  className={`block px-4 py-2 text-sm w-full text-left ${filter === 'completed' ? 'bg-gray-100' : ''}`}
                  onClick={() => handleFilterChange('completed')}
                >
                  Completed
                </button>
                <button 
                  className={`block px-4 py-2 text-sm w-full text-left ${filter === 'cancelled' ? 'bg-gray-100' : ''}`}
                  onClick={() => handleFilterChange('cancelled')}
                >
                  Cancelled
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.user?.name || 'Guest'}<br />
                    <span className="text-gray-500 text-xs">{order.user?.email || 'No email'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${order.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                      ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${order.status === 'processing' ? 'bg-blue-100 text-blue-800' : ''}
                      ${order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${parseFloat(order.total || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <FaEye />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <FaEdit />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
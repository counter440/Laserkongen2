import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaEye, FaSync } from 'react-icons/fa';

export default function PaymentsContent() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch payments
    const fetchPayments = async () => {
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

        // This would be your actual API endpoint
        const response = await fetch('/api/payments', { headers });
        if (response.ok) {
          const data = await response.json();
          setPayments(data.payments || []);
        }
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Filter payments by search query
  const filteredPayments = payments.filter(payment => {
    const searchLower = searchQuery.toLowerCase();
    return (
      payment.id?.toString().includes(searchLower) ||
      payment.orderId?.toString().includes(searchLower) ||
      payment.status?.toLowerCase().includes(searchLower) ||
      payment.paymentMethod?.toLowerCase().includes(searchLower)
    );
  });

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setIsLoading(true);
    // You would then refetch based on the filter
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
        <h1 className="text-2xl font-bold">Payments</h1>
        <div className="flex space-x-2">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <FaSearch className="text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search payments..."
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
                  All Payments
                </button>
                <button 
                  className={`block px-4 py-2 text-sm w-full text-left ${filter === 'successful' ? 'bg-gray-100' : ''}`}
                  onClick={() => handleFilterChange('successful')}
                >
                  Successful
                </button>
                <button 
                  className={`block px-4 py-2 text-sm w-full text-left ${filter === 'pending' ? 'bg-gray-100' : ''}`}
                  onClick={() => handleFilterChange('pending')}
                >
                  Pending
                </button>
                <button 
                  className={`block px-4 py-2 text-sm w-full text-left ${filter === 'failed' ? 'bg-gray-100' : ''}`}
                  onClick={() => handleFilterChange('failed')}
                >
                  Failed
                </button>
                <button 
                  className={`block px-4 py-2 text-sm w-full text-left ${filter === 'refunded' ? 'bg-gray-100' : ''}`}
                  onClick={() => handleFilterChange('refunded')}
                >
                  Refunded
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{payment.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{payment.orderId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.paymentMethod || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${parseFloat(payment.amount || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${payment.status === 'successful' ? 'bg-green-100 text-green-800' : ''}
                      ${payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${payment.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                      ${payment.status === 'refunded' ? 'bg-purple-100 text-purple-800' : ''}
                    `}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <FaEye />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <FaSync />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  No payments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
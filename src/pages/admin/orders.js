import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaSearch, FaFilter, FaEdit, FaTrash, FaTruck, FaCheck, FaDownload, FaEye } from 'react-icons/fa';
import AdminSidebar from '../../components/admin/AdminSidebar';
import withAdminAuth from '../../middleware/authAdminPage';

function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [orderFiles, setOrderFiles] = useState({});
  
  // We'll use real data from the database
  
  // Add event listener to close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Find all dropdowns
      const dropdowns = document.querySelectorAll('[id^="file-dropdown-"]');
      dropdowns.forEach(dropdown => {
        if (dropdown.style.display === 'block' && !dropdown.contains(event.target) && 
            !event.target.closest('button')?.getAttribute('title')?.includes('Download Customer File')) {
          dropdown.style.display = 'none';
        }
      });
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  // Function to fetch files for a specific order
  const fetchOrderFiles = async (orderId) => {
    try {
      console.log(`Fetching files for order: ${orderId}`);
      
      // Get authentication token from sessionStorage
      const userInfo = sessionStorage.getItem('userInfo')
        ? JSON.parse(sessionStorage.getItem('userInfo'))
        : null;
        
      if (!userInfo || !userInfo.token) {
        throw new Error('Authentication required');
      }
      
      // Add a cache-busting parameter to avoid stale data
      const cacheBuster = new Date().getTime();
      
      // Use the new API endpoint to get files associated with this order
      // Add a unique cache-busting parameter to ensure we get fresh data every time
      const uniqueCacheBuster = `${cacheBuster}-${Math.random().toString(36).substring(2, 15)}`;
      
      // Log the specific request we're making for easier debugging
      console.log(`Making request to /api/orders/${orderId}/files?t=${uniqueCacheBuster}`);
      
      const response = await fetch(`/api/orders/${orderId}/files?t=${uniqueCacheBuster}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userInfo.token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        // Fallback to the old endpoint if the new one fails
        console.log(`New API endpoint failed, falling back to uploads/order/${orderId}`);
        const fallbackResponse = await fetch(`/api/uploads/order/${orderId}?t=${uniqueCacheBuster}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userInfo.token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`Failed to fetch files: ${fallbackResponse.status}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        console.log(`Successfully fetched ${fallbackData.length} files for order ${orderId} using fallback method`);
        
        // Extra validation to ensure the data is an array
        if (!Array.isArray(fallbackData)) {
          console.error(`Invalid response format for order ${orderId}: expected array, got`, typeof fallbackData);
          return [];
        }
        
        // Validate each file to ensure it has a fileUrl and belongs to this order
        const validFiles = fallbackData.filter(file => {
          if (!file || !file.fileUrl) {
            console.warn(`File for order ${orderId} missing fileUrl:`, file);
            return false;
          }
          
          // Verify this file belongs to this order
          if (file.order_id && file.order_id.toString() !== orderId.toString()) {
            console.warn(`File ${file.id} has incorrect order_id: ${file.order_id} (expected ${orderId})`);
            return false;
          }
          
          return true;
        });
        
        if (validFiles.length !== fallbackData.length) {
          console.warn(`Some files for order ${orderId} are missing file URLs or have incorrect order_id`);
        }
        
        if (validFiles.length > 0) {
          console.log(`File details for order ${orderId}:`, validFiles.map(f => ({
            id: f.id,
            name: f.originalName || f.filename,
            order_id: f.order_id
          })));
        }
        
        return validFiles;
      }
      
      const data = await response.json();
      console.log(`Successfully fetched ${Array.isArray(data) ? data.length : 'non-array'} files for order ${orderId}`);
      
      // Extra validation to ensure the data is an array
      if (!Array.isArray(data)) {
        console.error(`Invalid response format for order ${orderId}: expected array, got`, typeof data);
        return [];
      }
      
      // Validate each file to ensure it has a fileUrl and belongs to this order
      const validFiles = data.filter(file => {
        if (!file || !file.fileUrl) {
          console.warn(`File for order ${orderId} missing fileUrl:`, file);
          return false;
        }
        
        // Verify this file belongs to this order
        if (file.order_id && file.order_id.toString() !== orderId.toString()) {
          console.warn(`File ${file.id} has incorrect order_id: ${file.order_id} (expected ${orderId})`);
          return false;
        }
        
        return true;
      });
      
      if (validFiles.length !== data.length) {
        console.warn(`Some files for order ${orderId} are missing file URLs or have incorrect order_id`);
      }
      
      if (validFiles.length > 0) {
        console.log(`File details for order ${orderId}:`, validFiles.map(f => ({
          id: f.id,
          name: f.originalName || f.filename,
          order_id: f.order_id
        })));
      } else {
        console.log(`No valid files found for order ${orderId}`);
      }
      
      return validFiles;
    } catch (error) {
      console.error(`Error fetching files for order ${orderId}:`, error);
      return [];
    }
  };

  useEffect(() => {
    // Check authentication and fetch orders from the backend API
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(''); // Clear any previous errors
        
        // Get authentication token from sessionStorage
        const userInfo = sessionStorage.getItem('userInfo')
          ? JSON.parse(sessionStorage.getItem('userInfo'))
          : null;
          
        if (!userInfo || !userInfo.token) {
          throw new Error('Authentication required');
        }
        
        // Prepare API URL with query parameters
        let apiUrl = `/api/orders`;
        const queryParams = new URLSearchParams();
        queryParams.append('page', currentPage.toString());
        queryParams.append('limit', '10');
        if (filter !== 'all') {
          queryParams.append('status', filter);
        }
        
        apiUrl = `${apiUrl}?${queryParams.toString()}`;
        console.log('Fetching orders from:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userInfo.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          if (response.status === 401 && data.tokenExpired) {
            // Token expired, clear auth and redirect to login
            sessionStorage.removeItem('userInfo');
            router.push('/admin-login?redirect=admin/orders&expired=true');
            throw new Error('Authentication expired');
          }
          
          console.error('API response error:', response.status, data);
          throw new Error(data.message || `Failed to fetch orders: ${response.status}`);
        }
        console.log('Orders data:', data);
        
        if (!data.orders || !Array.isArray(data.orders)) {
          console.error('Unexpected data format:', data);
          throw new Error('Invalid data format received from server');
        }
        
        // Transform the orders data to match our frontend format
        const formattedOrders = data.orders.map(order => ({
          id: order._id || order.id,
          customer: {
            name: order.user ? order.user.name : order.shippingAddress?.fullName || 'Guest Customer',
            email: order.user ? order.user.email : order.shippingAddress?.email || 'N/A'
          },
          date: new Date(order.createdAt || order.created_at).toISOString().split('T')[0],
          status: order.status || 'pending',
          total: order.totalPrice || 0,
          items: order.orderItems?.length || 0,
          paymentMethod: order.paymentMethod || 'N/A',
          isPaid: order.isPaid || false,
          isDelivered: order.isDelivered || false,
          trackingNumber: order.trackingNumber || null
        }));
        
        setOrders(formattedOrders);
        setTotalPages(data.pages || 1);
        
        // After fetching orders, check for files for each order
        const fetchFilesForOrders = async () => {
          // Clear existing order files state before fetching
          setOrderFiles({});
          
          // Create a new object to store all file results
          const newOrderFiles = {};
          
          // Process orders one by one to avoid race conditions and to ensure files belong to the right order
          for (const order of formattedOrders) {
            try {
              console.log(`Checking for files specifically for order: ${order.id}`);
              const files = await fetchOrderFiles(order.id);
              
              // Accept all files returned by the API - the backend will have already filtered them
              // to include only files associated with this order either directly or through order_custom_options
              const ordersFiles = files;
              
              // Add this order ID to each file object for clarity
              if (ordersFiles.length > 0) {
                ordersFiles.forEach(file => {
                  // Ensure the file has an order_id property for our display logic
                  if (!file.order_id) {
                    file.order_id = order.id;
                  }
                });
              }
              
              if (ordersFiles.length > 0) {
                console.log(`Found ${ordersFiles.length} files that DEFINITELY belong to order ${order.id}`);
                newOrderFiles[order.id] = ordersFiles;
              } else if (files.length > 0) {
                console.warn(`Found ${files.length} files but none match order ${order.id}`);
              }
            } catch (error) {
              console.error(`Error checking files for order ${order.id}:`, error);
            }
          }
          
          // Update state once with all results
          console.log("Setting order files state. Orders with files:", Object.keys(newOrderFiles));
          Object.keys(newOrderFiles).forEach(orderId => {
            console.log(`Order ${orderId} has ${newOrderFiles[orderId].length} files`);
          });
          
          setOrderFiles(newOrderFiles);
        };
        
        // Start the file fetching process
        fetchFilesForOrders();
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError(error.message || 'Failed to fetch orders');
        setOrders([]); // Clear orders on error
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [currentPage, filter]);
  
  // Filter orders based on status and search query
  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = searchQuery === '' || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Pagination
  const itemsPerPage = 10;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handleStatusChange = async (orderId, newStatus) => {
    // Show a loading indicator
    setLoading(true);
    
    try {
      // Get the user token
      const userInfo = sessionStorage.getItem('userInfo')
        ? JSON.parse(sessionStorage.getItem('userInfo'))
        : null;
        
      if (!userInfo || !userInfo.token) {
        throw new Error('Not authenticated');
      }
      
      // Make API call to update the order status
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update order status: ${response.status}`);
      }
      
      // Update the order status in the local state
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      // Clear any previous errors
      setError('');
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(`Failed to update order status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Head>
        <title>Manage Orders | Admin Dashboard</title>
        <meta name="description" content="Manage orders in the admin dashboard." />
      </Head>

      {/* Global styles */}
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, 
            Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        * {
          box-sizing: border-box;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <AdminSidebar />
      
      <div style={{ flex: 1, padding: '24px', backgroundColor: '#f8fafc', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Manage Orders</h1>
          
          <div>
            <Link href="/admin/orders/export" style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              padding: '8px 16px', 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              textDecoration: 'none',
              color: '#4b5563',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}>
              <FaDownload style={{ marginRight: '8px' }} />
              Export
            </Link>
          </div>
        </div>
        
        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            color: '#b91c1c', 
            padding: '16px', 
            marginBottom: '24px', 
            borderRadius: '6px', 
            border: '1px solid #fecaca' 
          }}>
            {error}
          </div>
        )}
        
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', position: 'relative', flexGrow: 1 }}>
                <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Search by order ID, customer name or email..."
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px 8px 36px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FaFilter style={{ marginRight: '8px', color: '#6b7280' }} />
                <select
                  style={{ 
                    padding: '8px 12px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                border: '4px solid #bfdbfe', 
                borderLeftColor: '#3b82f6', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
              <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading orders...</p>
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ color: '#6b7280', fontSize: '18px', margin: '0 0 8px 0' }}>No orders found.</p>
              <p style={{ color: '#9ca3af', margin: 0 }}>Try changing your search or filter criteria.</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f9fafb' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Order ID
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Customer
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Date
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Status
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Items
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Total
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map(order => {
                      const statusStyles = (() => {
                        switch (order.status) {
                          case 'pending':
                            return { backgroundColor: '#fef9c3', color: '#854d0e' };
                          case 'processing':
                            return { backgroundColor: '#dbeafe', color: '#1e40af' };
                          case 'shipped':
                            return { backgroundColor: '#e0e7ff', color: '#4338ca' };
                          case 'delivered':
                            return { backgroundColor: '#dcfce7', color: '#166534' };
                          case 'cancelled':
                            return { backgroundColor: '#fee2e2', color: '#b91c1c' };
                          default:
                            return { backgroundColor: '#f3f4f6', color: '#1f2937' };
                        }
                      })();
                      
                      return (
                        <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                            {order.id}
                          </td>
                          <td style={{ padding: '16px', fontSize: '14px' }}>
                            <div style={{ fontWeight: '500', color: '#111827' }}>{order.customer.name}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{order.customer.email}</div>
                          </td>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                            {order.date}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ 
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: '500',
                              ...statusStyles
                            }}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                            {order.items}
                          </td>
                          <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: '#111827', textAlign: 'right' }}>
                            kr {typeof order.total === 'number' ? order.total.toFixed(2) : order.total}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                              <Link 
                                href={`/order-confirmation?id=${order.id}`} 
                                target="_blank"
                                style={{ color: '#2563eb' }}
                                title="View Order"
                              >
                                <FaEye size={18} />
                              </Link>
                              
                              <Link 
                                href={`/admin/orders/${order.id}`}
                                style={{ color: '#2563eb' }}
                                title="Edit Order"
                              >
                                <FaEdit size={18} />
                              </Link>
                              
                              {order.status === 'pending' && (
                                <button 
                                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#16a34a' }}
                                  onClick={() => handleStatusChange(order.id, 'processing')}
                                  title="Mark as Processing"
                                >
                                  <FaCheck size={18} />
                                </button>
                              )}
                              
                              {order.status === 'processing' && (
                                <button 
                                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#4f46e5' }}
                                  onClick={() => handleStatusChange(order.id, 'shipped')}
                                  title="Mark as Shipped"
                                >
                                  <FaTruck size={18} />
                                </button>
                              )}
                              
                              {/* Show download button if order has files - always show if available */}
                              {orderFiles[order.id] && orderFiles[order.id].length > 0 && (
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                  <button
                                    onClick={() => {
                                      // Create a menu of files if there are multiple files
                                      if (orderFiles[order.id].length > 1) {
                                        // Toggle dropdown visibility
                                        const dropdownEl = document.getElementById(`file-dropdown-${order.id}`);
                                        if (dropdownEl) {
                                          dropdownEl.style.display = dropdownEl.style.display === 'none' ? 'block' : 'none';
                                        }
                                      } else {
                                        // Just one file, download it directly
                                        const file = orderFiles[order.id][0];
                                        if (file && file.fileUrl) {
                                          console.log(`Downloading file for order ID ${order.id}: ${file.originalName}`);
                                          // Use the fileUrl but replace localhost with the actual server IP
                                          const fileUrl = file.fileUrl.replace('http://localhost:5001', 'http://194.32.107.238:5001');
                                          window.open(fileUrl, '_blank');
                                        } else {
                                          console.error(`Error: No valid file URL for order ${order.id}`);
                                          alert(`Error: Could not download file for order ${order.id}`);
                                        }
                                      }
                                    }}
                                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#0ea5e9' }}
                                    title={`Download Customer File${orderFiles[order.id].length > 1 ? 's' : ''} (${orderFiles[order.id].length} available)`}
                                  >
                                    <FaDownload size={18} />
                                  </button>
                                  
                                  {/* Dropdown menu for multiple files */}
                                  {orderFiles[order.id].length > 1 && (
                                    <div
                                      id={`file-dropdown-${order.id}`}
                                      style={{
                                        display: 'none',
                                        position: 'absolute',
                                        backgroundColor: 'white',
                                        minWidth: '200px',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                        zIndex: 10,
                                        right: 0,
                                        borderRadius: '4px',
                                        border: '1px solid #e5e7eb'
                                      }}
                                    >
                                      {orderFiles[order.id].map((file, index) => (
                                        <div 
                                          key={file.id || index}
                                          style={{
                                            padding: '8px 12px',
                                            borderBottom: index < orderFiles[order.id].length - 1 ? '1px solid #e5e7eb' : 'none',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                          }}
                                          onClick={() => {
                                            if (file && file.fileUrl) {
                                              console.log(`Downloading file for order ID ${order.id}: ${file.originalName || file.filename}`);
                                              const fileUrl = file.fileUrl.replace('http://localhost:5001', 'http://194.32.107.238:5001');
                                              window.open(fileUrl, '_blank');
                                              // Hide the dropdown after clicking
                                              document.getElementById(`file-dropdown-${order.id}`).style.display = 'none';
                                            }
                                          }}
                                        >
                                          <FaDownload size={12} style={{ color: '#0ea5e9' }} />
                                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {file.originalName || file.filename || `File ${index + 1}`}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {(order.status === 'pending' || order.status === 'processing') && (
                                <button 
                                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#dc2626' }}
                                  onClick={() => handleStatusChange(order.id, 'cancelled')}
                                  title="Cancel Order"
                                >
                                  <FaTrash size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div style={{ 
                backgroundColor: 'white', 
                padding: '16px 24px', 
                borderTop: '1px solid #e5e7eb', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Showing <span style={{ fontWeight: '500' }}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span style={{ fontWeight: '500' }}>{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of <span style={{ fontWeight: '500' }}>{filteredOrders.length}</span> orders
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    style={{ 
                      padding: '8px 16px', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '6px', 
                      backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                      color: currentPage === 1 ? '#9ca3af' : '#374151',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    Previous
                  </button>
                  
                  <button 
                    style={{ 
                      padding: '8px 16px', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '6px', 
                      backgroundColor: currentPage === totalPages ? '#f3f4f6' : 'white',
                      color: currentPage === totalPages ? '#9ca3af' : '#374151',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                    }}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default withAdminAuth(AdminOrders);
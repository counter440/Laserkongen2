import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaPrint, FaStore, FaShoppingCart, FaLaptop, FaCubes, FaUpload, FaCube, FaUser, FaUsers, FaCog, FaSignOutAlt, FaChartBar, FaPlus, FaEdit, FaTrashAlt, FaBoxOpen } from 'react-icons/fa';
import { FaPencil, FaFire } from 'react-icons/fa6';
import { GiLaserWarning } from 'react-icons/gi';
import AdminSidebar from '../../components/admin/AdminSidebar';
import withAdminAuth from '../../middleware/authAdminPage';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [adminFormError, setAdminFormError] = useState('');
  const [adminFormSuccess, setAdminFormSuccess] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0
  });
  const [orders, setOrders] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState({
    labels: [],
    data: []
  });
  
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  
  // Check window size for responsive design
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Check if user is logged in and is admin
  useEffect(() => {
    const userInfo = sessionStorage.getItem('userInfo')
      ? JSON.parse(sessionStorage.getItem('userInfo'))
      : null;
    
    if (!userInfo || !userInfo.token) {
      router.push('/admin-login');
    } else if (userInfo.role !== 'admin') {
      router.push('/');
    } else {
      fetchDashboardData();
    }
  }, [router]);
  
  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
      
      if (!userInfo || !userInfo.token) {
        throw new Error('Not authorized');
      }
      
      // Fetch order stats
      try {
        const orderStatsResponse = await fetch('/api/orders/stats', {
          headers: {
            'Authorization': `Bearer ${userInfo.token}`
          }
        });
        
        if (orderStatsResponse.ok) {
          const orderStatsData = await orderStatsResponse.json();
          setStats(orderStatsData.stats);
          setRecentOrders(orderStatsData.recentOrders);
          setMonthlyRevenue(orderStatsData.monthlyRevenue);
        } else {
          console.error('Failed to fetch order stats');
          // Use demo data instead
          setStats({
            totalOrders: 124,
            pendingOrders: 18,
            processingOrders: 25,
            shippedOrders: 41,
            deliveredOrders: 40,
            totalRevenue: 12850.75
          });
          setRecentOrders([]);
          setMonthlyRevenue({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            data: [3200, 4500, 4200, 5100, 6800, 7400]
          });
        }
      } catch (error) {
        console.error('Error fetching order stats:', error);
        // Use demo data
        setStats({
          totalOrders: 124,
          pendingOrders: 18,
          processingOrders: 25,
          shippedOrders: 41,
          deliveredOrders: 40,
          totalRevenue: 12850.75
        });
        setRecentOrders([]);
        setMonthlyRevenue({
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          data: [3200, 4500, 4200, 5100, 6800, 7400]
        });
      }
      
      // Fetch users
      try {
        const usersResponse = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${userInfo.token}`
          }
        });
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
        } else {
          console.error('Failed to fetch users');
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      }
      
      // Fetch orders
      try {
        const ordersResponse = await fetch('/api/orders', {
          headers: {
            'Authorization': `Bearer ${userInfo.token}`
          }
        });
        
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setOrders(ordersData.orders);
        } else {
          console.error('Failed to fetch orders');
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      }
      
      // Fetch uploads
      try {
        const uploadsResponse = await fetch('/api/uploads', {
          headers: {
            'Authorization': `Bearer ${userInfo.token}`
          }
        });
        
        if (uploadsResponse.ok) {
          const uploadsData = await uploadsResponse.json();
          setUploads(uploadsData.files);
        } else {
          console.error('Failed to fetch uploads');
          setUploads([]);
        }
      } catch (error) {
        console.error('Error fetching uploads:', error);
        setUploads([]);
      }
      
      // Fetch products
      try {
        const productsResponse = await fetch('/api/products', {
          headers: {
            'Authorization': `Bearer ${userInfo.token}`
          }
        });
        
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(productsData.products);
        } else {
          console.error('Failed to fetch products');
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Dashboard error:', error);
      setError(error.message || 'An error occurred');
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    sessionStorage.removeItem('userInfo');
    router.push('/admin-login');
  };
  
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setAdminFormError('');
    setAdminFormSuccess('');
    
    // Validate form
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password || !newAdmin.confirmPassword) {
      setAdminFormError('All fields are required');
      return;
    }
    
    if (newAdmin.password !== newAdmin.confirmPassword) {
      setAdminFormError('Passwords do not match');
      return;
    }
    
    if (newAdmin.password.length < 6) {
      setAdminFormError('Password must be at least 6 characters');
      return;
    }
    
    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
      
      if (!userInfo || !userInfo.token) {
        throw new Error('Not authorized');
      }
      
      // Send request to create admin user
      const response = await fetch('/api/users/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({
          name: newAdmin.name,
          email: newAdmin.email,
          password: newAdmin.password,
          adminSecretKey: 'laserkongen_admin_setup_key'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create admin user');
      }
      
      // Reset form and show success message
      setNewAdmin({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      
      setAdminFormSuccess(`Admin user ${data.name} created successfully!`);
      
      // Refresh user list
      fetchDashboardData();
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowAddAdminModal(false);
        setAdminFormSuccess('');
      }, 2000);
      
    } catch (error) {
      setAdminFormError(error.message);
    }
  };
  
  // Product management is done in the dedicated products page
  
  const updateOrderStatus = async (orderId, status) => {
    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
      
      if (!userInfo || !userInfo.token) {
        throw new Error('Not authorized');
      }
      
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      
      // Refetch data
      fetchDashboardData();
    } catch (error) {
      setError(error.message);
    }
  };
  
  const getStatusClass = (status) => {
    switch(status) {
      case 'pending': return { bg: '#fef3c7', text: '#92400e' };
      case 'processing': return { bg: '#dbeafe', text: '#1e40af' };
      case 'shipped': return { bg: '#e0e7ff', text: '#3730a3' };
      case 'delivered': return { bg: '#d1fae5', text: '#065f46' };
      case 'error': return { bg: '#fee2e2', text: '#b91c1c' };
      default: return { bg: '#f3f4f6', text: '#1f2937' };
    }
  };
  
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <style jsx global>{`
          html, body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, 
              Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            background-color: #f8fafc;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div 
          style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid rgba(30, 58, 138, 0.1)', 
            borderLeftColor: '#1e3a8a', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} 
        />
      </div>
    );
  }
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Head>
        <title>Admin Dashboard | Laserkongen</title>
        <meta name="description" content="Admin dashboard for Laserkongen 3D printing and laser engraving services." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      {/* Global styles - match other admin pages */}
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, 
            Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          color: #1e293b;
          background-color: #f8fafc;
        }
        
        * {
          box-sizing: border-box;
        }
        
        button, input, select, textarea {
          font-family: inherit;
          font-size: inherit;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          
          .dashboard-panels {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }

          .quick-actions {
            flex-direction: column !important;
          }

          .quick-actions button {
            width: 100% !important;
          }
        }
      `}</style>
      
      {/* Desktop Sidebar - Only visible on desktop */}
      {!isMobile && <AdminSidebar />}
      
      {/* Mobile Sidebar - Only rendered when menu is open */}
      {isMobile && showMobileSidebar && (
        <AdminSidebar 
          isMobile={true} 
          onCloseMobile={() => setShowMobileSidebar(false)} 
        />
      )}
      
      {/* Main content - Dashboard only */}
      <div style={{ flexGrow: 1, backgroundColor: '#f1f5f9', padding: '20px', overflowY: 'auto' }}>
        {/* Mobile Header with Menu Toggle - Only shown on mobile */}
        {isMobile && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '16px'
            }}
        >
          <button
            onClick={() => setShowMobileSidebar(true)}
            style={{
              backgroundColor: '#1e293b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 12px',
              marginRight: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span style={{ fontSize: '18px' }}>☰</span>
          </button>
          <h1 style={{ fontSize: '20px', margin: 0 }}>Admin Dashboard</h1>
        </div>
        )}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
        
        {/* Dashboard */}
        <div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            marginBottom: '24px', 
            margin: 0,
            display: 'none',
            '@media (min-width: 769px)': { display: 'block' }
          }}>Dashboard</h1>
          
          <div 
            className="stats-grid"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px',
              marginBottom: '24px'
            }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>Total Orders</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>{stats.totalOrders}</p>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>Pending Orders</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#c2410c', margin: 0 }}>{stats.pendingOrders}</p>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>Processing Orders</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>{stats.processingOrders}</p>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>Total Revenue</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#065f46', margin: 0 }}>kr {stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Quick Actions</h2>
            <div className="quick-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => router.push('/admin/orders?status=pending', undefined, { shallow: true })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  color: '#4b5563',
                  transition: 'background-color 0.2s'
                }}
              >
                <FaBoxOpen style={{ color: '#f59e0b' }} />
                View Pending Orders
              </button>
              <button
                onClick={() => router.push('/admin/products/new', undefined, { shallow: true })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  color: '#4b5563',
                  transition: 'background-color 0.2s'
                }}
              >
                <FaPlus style={{ color: '#10b981' }} />
                Add New Product
              </button>
              <button
                onClick={() => setShowAddAdminModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  color: '#4b5563',
                  transition: 'background-color 0.2s'
                }}
              >
                <FaUser style={{ color: '#3b82f6' }} />
                Add Admin User
              </button>
              <button
                onClick={() => router.push('/admin/uploads', undefined, { shallow: true })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  color: '#4b5563',
                  transition: 'background-color 0.2s'
                }}
              >
                <FaUpload style={{ color: '#6366f1' }} />
                Manage Uploads
              </button>
            </div>
          </div>
          
          <div 
            className="dashboard-panels"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
              gap: '16px'
            }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', margin: '0 0 16px 0' }}>Recent Orders</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Order ID</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Customer</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Status</th>
                      <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length > 0 ? (
                      recentOrders.map(order => (
                        <tr key={order.id || order._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                            {order.id ? `#${order.id}` : (order._id ? order._id.substring(0, 8) : 'N/A')}
                          </td>
                          <td style={{ padding: '12px 8px', fontSize: '14px' }}>{order.user ? order.user.name : 'Guest'}</td>
                          <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                            <span style={{ 
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              backgroundColor: getStatusClass(order.status).bg,
                              color: getStatusClass(order.status).text
                            }}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', fontSize: '14px', textAlign: 'right' }}>
                            kr {typeof order.totalPrice === 'number' ? order.totalPrice.toFixed(2) : parseFloat(order.totalPrice || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ padding: '16px 8px', textAlign: 'center', color: '#64748b' }}>
                          No recent orders
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '12px', textAlign: 'right' }}>
                <Link
                  href="/admin/orders"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push('/admin/orders', undefined, { shallow: true });
                  }}
                  style={{ color: '#2563eb', fontSize: '14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                >
                  View all orders →
                </Link>
              </div>
            </div>
            
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', margin: '0 0 16px 0' }}>Monthly Revenue</h3>
              <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', marginBottom: '8px' }}>
                {monthlyRevenue.data.length > 0 ? (
                  monthlyRevenue.data.map((value, index) => (
                    <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div 
                        style={{ 
                          height: `${(value / Math.max(...monthlyRevenue.data)) * 180}px`, 
                          width: '70%', 
                          backgroundColor: '#3b82f6',
                          borderRadius: '3px 3px 0 0'
                        }} 
                      />
                    </div>
                  ))
                ) : (
                  <div style={{ width: '100%', textAlign: 'center', color: '#64748b' }}>No revenue data available</div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {monthlyRevenue.labels.map((label, index) => (
                  <div key={index} style={{ flex: 1, textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                    {label}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
                Total revenue for the period: kr {monthlyRevenue.data.reduce((a, b) => a + b, 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Administrator Modal */}
      {showAddAdminModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            padding: '24px', 
            width: '450px',
            maxWidth: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Add New Administrator</h3>
              <button 
                onClick={() => setShowAddAdminModal(false)}
                style={{ 
                  backgroundColor: 'transparent', 
                  border: 'none', 
                  fontSize: '20px', 
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>
            
            {adminFormError && (
              <div style={{
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {adminFormError}
              </div>
            )}
            
            {adminFormSuccess && (
              <div style={{
                backgroundColor: '#d1fae5',
                color: '#065f46',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {adminFormSuccess}
              </div>
            )}
            
            <form onSubmit={handleAddAdmin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db'
                  }}
                  placeholder="Enter full name"
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db'
                  }}
                  placeholder="Enter email address"
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db'
                  }}
                  placeholder="Enter password"
                />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={newAdmin.confirmPassword}
                  onChange={(e) => setNewAdmin({...newAdmin, confirmPassword: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db'
                  }}
                  placeholder="Confirm password"
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#1f2937',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Create Administrator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default withAdminAuth(Dashboard);
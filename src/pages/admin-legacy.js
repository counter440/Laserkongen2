import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FaPrint, FaStore, FaShoppingCart, FaLaptop, FaCubes, FaUpload, FaCube, FaUser, FaUsers, FaCog, FaSignOutAlt, FaChartBar } from 'react-icons/fa';
import { FaPencil, FaFire } from 'react-icons/fa6';
import { GiLaserWarning } from 'react-icons/gi';

// This is the legacy admin page, kept for reference
// The new admin dashboard is in /admin/index.js
const AdminLegacy = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
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
  
  // Check if user is logged in and is admin
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;
    
    if (!userInfo || !userInfo.token) {
      router.push('/login');
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
      
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
      if (!userInfo || !userInfo.token) {
        throw new Error('Not authorized');
      }
      
      // Fetch order stats
      const orderStatsResponse = await fetch('/api/orders/stats', {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`
        }
      });
      
      if (!orderStatsResponse.ok) {
        throw new Error('Failed to fetch order stats');
      }
      
      const orderStatsData = await orderStatsResponse.json();
      
      setStats(orderStatsData.stats);
      setRecentOrders(orderStatsData.recentOrders);
      setMonthlyRevenue(orderStatsData.monthlyRevenue);
      
      // Fetch users
      const usersResponse = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`
        }
      });
      
      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const usersData = await usersResponse.json();
      setUsers(usersData);
      
      // Fetch orders
      const ordersResponse = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`
        }
      });
      
      if (!ordersResponse.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const ordersData = await ordersResponse.json();
      setOrders(ordersData.orders);
      
      // Fetch uploads
      const uploadsResponse = await fetch('/api/uploads', {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`
        }
      });
      
      if (!uploadsResponse.ok) {
        throw new Error('Failed to fetch uploads');
      }
      
      const uploadsData = await uploadsResponse.json();
      setUploads(uploadsData.files);
      
      setIsLoading(false);
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    router.push('/login');
  };
  
  const updateOrderStatus = async (orderId, status) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <p>Laster inn...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Head>
        <title>Admin Dashboard | Laserkongen</title>
        <meta name="description" content="Admin dashboard for Laserkongen 3D printing and laser engraving services." />
      </Head>
      
      {/* Sidebar */}
      <div style={{ width: '240px', backgroundColor: '#1e293b', color: 'white', padding: '20px 0' }}>
        <div style={{ padding: '0 20px', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Admin Panel</h1>
        </div>
        
        <nav>
          <ul>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <FaChartBar /> },
              { id: 'orders', label: 'Orders', icon: <FaShoppingCart /> },
              { id: 'uploads', label: 'Uploads', icon: <FaUpload /> },
              { id: 'products', label: 'Products', icon: <FaStore /> },
              { id: 'users', label: 'Users', icon: <FaUsers /> },
              { id: 'settings', label: 'Settings', icon: <FaCog /> },
            ].map(item => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '10px 20px',
                    fontSize: '14px',
                    textAlign: 'left',
                    backgroundColor: activeTab === item.id ? '#334155' : 'transparent',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          
          <div style={{ borderTop: '1px solid #334155', margin: '20px 0', padding: '0 20px' }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '10px 0',
                fontSize: '14px',
                textAlign: 'left',
                backgroundColor: 'transparent',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <span style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}><FaSignOutAlt /></span>
              Logg ut
            </button>
          </div>
        </nav>
      </div>
      
      {/* Main content */}
      <div style={{ flexGrow: 1, backgroundColor: '#f1f5f9', padding: '20px', overflowY: 'auto' }}>
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
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Dashboard</h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Total Orders</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a' }}>{stats.totalOrders}</p>
              </div>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Pending Orders</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#c2410c' }}>{stats.pendingOrders}</p>
              </div>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Processing Orders</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>{stats.processingOrders}</p>
              </div>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Total Revenue</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#065f46' }}>${stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Recent Orders</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'left', padding: '8px', fontSize: '14px', color: '#6b7280' }}>Order ID</th>
                      <th style={{ textAlign: 'left', padding: '8px', fontSize: '14px', color: '#6b7280' }}>Customer</th>
                      <th style={{ textAlign: 'left', padding: '8px', fontSize: '14px', color: '#6b7280' }}>Status</th>
                      <th style={{ textAlign: 'right', padding: '8px', fontSize: '14px', color: '#6b7280' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px', fontSize: '14px' }}>{order._id.substring(0, 8)}</td>
                        <td style={{ padding: '8px', fontSize: '14px' }}>{order.user ? order.user.name : 'Guest'}</td>
                        <td style={{ padding: '8px', fontSize: '14px' }}>
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
                        <td style={{ padding: '8px', fontSize: '14px', textAlign: 'right' }}>${order.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: '12px', textAlign: 'right' }}>
                  <button 
                    onClick={() => setActiveTab('orders')}
                    style={{ color: '#2563eb', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    View all orders →
                  </button>
                </div>
              </div>
              
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Monthly Revenue</h3>
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
                    <div style={{ width: '100%', textAlign: 'center', color: '#6b7280' }}>No revenue data available</div>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {monthlyRevenue.labels.map((label, index) => (
                    <div key={index} style={{ flex: 1, textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
                      {label}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
                  Total revenue for the period: ${monthlyRevenue.data.reduce((a, b) => a + b, 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Orders */}
        {activeTab === 'orders' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Orders</h2>
            
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <input 
                  type="text" 
                  placeholder="Search orders..." 
                  style={{ 
                    padding: '8px 12px', 
                    borderRadius: '4px', 
                    border: '1px solid #d1d5db', 
                    width: '300px' 
                  }} 
                />
                
                <select style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Order ID</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Customer</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Status</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Total</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{order._id.substring(0, 8)}</td>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{order.user ? order.user.name : 'Guest'}</td>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
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
                      <td style={{ padding: '12px 8px', fontSize: '14px', textAlign: 'right' }}>${order.totalPrice.toFixed(2)}</td>
                      <td style={{ padding: '12px 8px', fontSize: '14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            style={{ 
                              backgroundColor: '#3b82f6', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '4px', 
                              padding: '4px 8px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                            onClick={() => router.push(`/orders/${order._id}`)}
                          >
                            View
                          </button>
                          
                          <select 
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                            style={{ 
                              padding: '4px 8px', 
                              borderRadius: '4px', 
                              border: '1px solid #d1d5db',
                              fontSize: '12px'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Users */}
        {activeTab === 'users' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Users</h2>
            
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  style={{ 
                    padding: '8px 12px', 
                    borderRadius: '4px', 
                    border: '1px solid #d1d5db', 
                    width: '300px' 
                  }} 
                />
                
                <select style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                  <option value="all">All Users</option>
                  <option value="customer">Customers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>ID</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Role</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Orders</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Joined</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{user._id.substring(0, 8)}</td>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{user.name}</td>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{user.email}</td>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          backgroundColor: user.role === 'admin' ? '#e0e7ff' : '#f3f4f6',
                          color: user.role === 'admin' ? '#4f46e5' : '#374151'
                        }}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '14px', textAlign: 'center' }}>
                        {user.orders ? user.orders.length : 0}
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '14px', textAlign: 'center' }}>
                        <button 
                          style={{ 
                            backgroundColor: '#3b82f6', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                          onClick={() => router.push(`/users/${user._id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Other tabs would go here */}
        {(activeTab !== 'dashboard' && activeTab !== 'orders' && activeTab !== 'users') && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
            <p>This section is under development</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLegacy;
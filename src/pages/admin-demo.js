import React, { useState } from 'react';
import Head from 'next/head';

export default function AdminDemo() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const orders = [
    { id: 'ORD-1234', customer: 'John Doe', status: 'processing', total: 154.99, date: '2025-02-25' },
    { id: 'ORD-1233', customer: 'Jane Smith', status: 'shipped', total: 89.50, date: '2025-02-24' },
    { id: 'ORD-1232', customer: 'Mike Johnson', status: 'delivered', total: 212.75, date: '2025-02-23' },
    { id: 'ORD-1231', customer: 'Sarah Williams', status: 'pending', total: 45.25, date: '2025-02-22' },
    { id: 'ORD-1230', customer: 'Alex Brown', status: 'processing', total: 178.50, date: '2025-02-21' },
  ];
  
  const uploads = [
    { id: 'FILE-789', name: 'robot.stl', type: '3D Model', status: 'processed', customer: 'John Doe', date: '2025-02-25' },
    { id: 'FILE-788', name: 'logo-engraving.svg', type: 'Vector', status: 'processed', customer: 'Jane Smith', date: '2025-02-24' },
    { id: 'FILE-787', name: 'keychain.obj', type: '3D Model', status: 'processing', customer: 'Mike Johnson', date: '2025-02-23' },
    { id: 'FILE-786', name: 'custom-sign.png', type: 'Image', status: 'error', customer: 'Sarah Williams', date: '2025-02-22' },
    { id: 'FILE-785', name: 'phone-holder.stl', type: '3D Model', status: 'processed', customer: 'Alex Brown', date: '2025-02-21' },
  ];
  
  // Mock data for charts
  const monthlyRevenue = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    data: [3200, 4500, 4200, 5100, 6800, 7400]
  };
  
  const stats = {
    totalOrders: 124,
    pendingOrders: 18,
    totalRevenue: 12850.75,
    totalUsers: 87,
    totalProducts: 52,
    totalUploads: 213
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
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'orders', label: 'Orders', icon: '📦' },
              { id: 'uploads', label: 'Uploads', icon: '📤' },
              { id: 'products', label: 'Products', icon: '🛒' },
              { id: 'users', label: 'Users', icon: '👥' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
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
                  <span style={{ marginRight: '10px' }}>{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div style={{ flexGrow: 1, backgroundColor: '#f1f5f9', padding: '20px', overflowY: 'auto' }}>
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
                <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Total Revenue</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#065f46' }}>${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Total Uploads</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#4f46e5' }}>{stats.totalUploads}</p>
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
                    {orders.slice(0, 3).map(order => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px', fontSize: '14px' }}>{order.id}</td>
                        <td style={{ padding: '8px', fontSize: '14px' }}>{order.customer}</td>
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
                        <td style={{ padding: '8px', fontSize: '14px', textAlign: 'right' }}>${order.total.toFixed(2)}</td>
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
                  {monthlyRevenue.data.map((value, index) => (
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
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {monthlyRevenue.labels.map((label, index) => (
                    <div key={index} style={{ flex: 1, textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
                      {label}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
                  Total revenue for the last 6 months: ${monthlyRevenue.data.reduce((a, b) => a + b, 0).toFixed(2)}
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
                    <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{order.id}</td>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{order.customer}</td>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{order.date}</td>
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
                      <td style={{ padding: '12px 8px', fontSize: '14px', textAlign: 'right' }}>${order.total.toFixed(2)}</td>
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
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Showing 1 to 5 of 124 orders
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    style={{ 
                      padding: '4px 12px', 
                      borderRadius: '4px', 
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Previous
                  </button>
                  <button 
                    style={{ 
                      padding: '4px 12px', 
                      borderRadius: '4px', 
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Uploads */}
        {activeTab === 'uploads' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>File Uploads</h2>
            
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>3D Model Analysis Dashboard</h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ backgroundColor: '#dbeafe', borderRadius: '8px', padding: '16px' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Processing Queue</h4>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>4</p>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>Models waiting for analysis</p>
                </div>
                
                <div style={{ backgroundColor: '#d1fae5', borderRadius: '8px', padding: '16px' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Successfully Processed</h4>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#065f46' }}>213</p>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>Models analyzed successfully</p>
                </div>
                
                <div style={{ backgroundColor: '#fee2e2', borderRadius: '8px', padding: '16px' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Processing Errors</h4>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#b91c1c' }}>7</p>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>Models that failed analysis</p>
                </div>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Model</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Volume</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Weight</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Dimensions</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Print Time</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>robot.stl</td>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>125 cm³</td>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>150 g</td>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>10 × 8 × 5 cm</td>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>3.5 hours</td>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>$25.75</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>keychain.obj</td>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>42 cm³</td>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>52 g</td>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>5 × 3 × 1 cm</td>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>1.2 hours</td>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>$8.60</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>phone-holder.stl</td>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>85 cm³</td>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>102 g</td>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>12 × 7 × 6 cm</td>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>2.8 hours</td>
                    <td style={{ padding: '10px 8px', fontSize: '14px' }}>$18.90</td>
                  </tr>
                </tbody>
              </table>
              
              <div style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
                Advanced 3D model analysis configuration available in settings
              </div>
            </div>
            
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>All Uploads</h3>
                
                <select style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                  <option value="all">All Files</option>
                  <option value="3d-model">3D Models</option>
                  <option value="vector">Vector Files</option>
                  <option value="image">Images</option>
                </select>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>File ID</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>File Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Customer</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Status</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '14px', color: '#6b7280' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map(file => (
                    <tr key={file.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{file.id}</td>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{file.name}</td>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{file.type}</td>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{file.customer}</td>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{file.date}</td>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          backgroundColor: getStatusClass(file.status).bg,
                          color: getStatusClass(file.status).text
                        }}>
                          {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                        </span>
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
                            marginRight: '5px',
                            cursor: 'pointer'
                          }}
                        >
                          View
                        </button>
                        {file.status === 'error' && (
                          <button 
                            style={{ 
                              backgroundColor: '#10b981', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '4px', 
                              padding: '4px 8px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Other tabs would go here */}
        {(activeTab !== 'dashboard' && activeTab !== 'orders' && activeTab !== 'uploads') && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
            <p>This section is under development</p>
          </div>
        )}
      </div>
    </div>
  );
}
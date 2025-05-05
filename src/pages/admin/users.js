import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaSearch, FaFilter, FaEdit, FaTrash, FaEnvelope, FaPhone, FaUserCog, FaUserPlus, FaTimes, FaSave } from 'react-icons/fa';
import AdminSidebar from '../../components/admin/AdminSidebar';
import withAdminAuth from '../../middleware/authAdminPage';

function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'customer'
  });
  
  // Function to fetch users
  const fetchUsers = async () => {
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
      let apiUrl = `/api/users`;
      
      console.log('Fetching users from:', apiUrl);
      
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
          router.push('/admin-login?redirect=admin/users&expired=true');
          throw new Error('Authentication expired');
        }
        
        console.error('API response error:', response.status, data);
        throw new Error(data.message || `Failed to fetch users: ${response.status}`);
      }
      console.log('Users data:', data);
      
      if (!Array.isArray(data)) {
        console.error('Unexpected data format:', data);
        throw new Error('Invalid data format received from server');
      }
      
      // Format the user data
      const formattedUsers = data.map(user => ({
        id: user._id || user.id,
        name: user.name || 'Unknown User',
        email: user.email || 'N/A',
        role: user.role || 'customer',
        phone: user.phone || 'N/A',
        createdAt: user.createdAt || user.created_at || 'N/A'
      }));
      
      setUsers(formattedUsers);
      setTotalPages(Math.ceil(formattedUsers.length / 10));
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to fetch users');
      setUsers([]); // Clear users on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, [router]);
  
  // Filter users based on role and search query
  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.role === filter;
    const matchesSearch = searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Pagination
  const itemsPerPage = 10;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      setSaving(true);
      
      // Validate form
      if (!formData.name || !formData.email || !formData.password) {
        setError('Name, email, and password are required');
        setSaving(false);
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        setSaving(false);
        return;
      }
      
      // Check if passwords match
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setSaving(false);
        return;
      }
      
      // Get auth token
      const userInfo = sessionStorage.getItem('userInfo')
        ? JSON.parse(sessionStorage.getItem('userInfo'))
        : null;
        
      if (!userInfo || !userInfo.token) {
        router.push('/admin-login');
        return;
      }
      
      // Prepare user data
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone
      };
      
      // Call API to create user
      const response = await fetch('/api/users/register-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
      }
      
      // Success
      setSuccess('User created successfully');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'customer'
      });
      
      // Close modal after a delay
      setTimeout(() => {
        setShowAddModal(false);
        setSuccess('');
        // Refresh the user list
        const fetchUsers = async () => {
          try {
            setLoading(true);
            setError(''); // Clear any previous errors
            
            // Get authentication token from localStorage
            const userInfo = sessionStorage.getItem('userInfo')
              ? JSON.parse(sessionStorage.getItem('userInfo'))
              : null;
              
            if (!userInfo || !userInfo.token) {
              // Redirect to login if not authenticated
              router.push('/admin-login');
              return;
            }
            
            // Check if user is an admin
            if (userInfo.role !== 'admin') {
              router.push('/');
              return;
            }
            
            // Prepare API URL with query parameters
            let apiUrl = `/api/users`;
            
            console.log('Fetching users from:', apiUrl);
            
            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${userInfo.token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('API response error:', response.status, errorText);
              throw new Error(`Failed to fetch users: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Users data:', data);
            
            if (!Array.isArray(data)) {
              console.error('Unexpected data format:', data);
              throw new Error('Invalid data format received from server');
            }
            
            // Format the user data
            const formattedUsers = data.map(user => ({
              id: user._id || user.id,
              name: user.name || 'Unknown User',
              email: user.email || 'N/A',
              role: user.role || 'customer',
              phone: user.phone || 'N/A',
              createdAt: user.createdAt || user.created_at || 'N/A'
            }));
            
            setUsers(formattedUsers);
            setTotalPages(Math.ceil(formattedUsers.length / 10));
          } catch (error) {
            console.error('Error fetching users:', error);
            setError(error.message || 'Failed to fetch users');
            setUsers([]); // Clear users on error
          } finally {
            setLoading(false);
          }
        };
        
        fetchUsers();
      }, 1500);
      
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };
  
  const handleRoleChange = async (userId, newRole) => {
    // Not implemented yet
    alert('Role change functionality not implemented yet');
  };
  
  const handleDeleteUser = async (userId) => {
    // Not implemented yet
    alert('Delete user functionality not implemented yet');
  };
  
  const handleEditUser = (user) => {
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      phone: user.phone || '',
      role: user.role
    });
    setShowEditModal(true);
  };
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      setSaving(true);
      
      // Validate form
      if (!formData.name || !formData.email) {
        setError('Name and email are required');
        setSaving(false);
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        setSaving(false);
        return;
      }
      
      // Check if passwords match
      if (formData.password && formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setSaving(false);
        return;
      }
      
      // Get auth token
      const userInfo = sessionStorage.getItem('userInfo')
        ? JSON.parse(sessionStorage.getItem('userInfo'))
        : null;
        
      if (!userInfo || !userInfo.token) {
        router.push('/admin-login');
        return;
      }
      
      // Prepare user data
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone
      };
      
      // Only include password if it was changed
      if (formData.password) {
        userData.password = formData.password;
      }
      
      // Call API to update user
      const response = await fetch(`/api/users/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user');
      }
      
      // Success
      setSuccess('User updated successfully');
      
      // Reset form
      setFormData({
        id: null,
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'customer'
      });
      
      // Close modal after a delay
      setTimeout(() => {
        setShowEditModal(false);
        setSuccess('');
        // Refresh the user list
        fetchUsers();
      }, 1500);
      
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Head>
        <title>Manage Users | Admin Dashboard</title>
        <meta name="description" content="Manage users in the admin dashboard." />
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
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Manage Users</h1>
          
          <button 
            onClick={() => {
              // Reset form data to empty values when opening Add modal
              setFormData({
                id: null,
                name: '',
                email: '',
                password: '',
                confirmPassword: '',
                phone: '',
                role: 'customer'
              });
              // Clear any previous errors or success messages
              setError('');
              setSuccess('');
              // Show the modal
              setShowAddModal(true);
            }}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              padding: '8px 16px', 
              backgroundColor: '#3b82f6', 
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              cursor: 'pointer'
            }}
          >
            <FaUserPlus style={{ marginRight: '8px' }} />
            Add New User
          </button>
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
                  placeholder="Search by name or email..."
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
                  <option value="all">All Users</option>
                  <option value="admin">Admins</option>
                  <option value="customer">Customers</option>
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
              <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading users...</p>
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ color: '#6b7280', fontSize: '18px', margin: '0 0 8px 0' }}>No users found.</p>
              <p style={{ color: '#9ca3af', margin: 0 }}>Try changing your search or filter criteria.</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f9fafb' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Name
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Email
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Role
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Phone
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Joined
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map(user => {
                      const roleStyles = user.role === 'admin' 
                        ? { backgroundColor: '#fee2e2', color: '#b91c1c' }
                        : { backgroundColor: '#dcfce7', color: '#166534' };
                      
                      return (
                        <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                            {user.name}
                          </td>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                            {user.email}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ 
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: '500',
                              ...roleStyles
                            }}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                          </td>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                            {user.phone}
                          </td>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                            {formatDate(user.createdAt)}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                              <button 
                                onClick={() => handleEditUser(user)}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  padding: 0, 
                                  cursor: 'pointer', 
                                  color: '#2563eb' 
                                }}
                                title="Edit User"
                              >
                                <FaEdit size={18} />
                              </button>
                              
                              <button 
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#b91c1c' }}
                                onClick={() => handleDeleteUser(user.id)}
                                title="Delete User"
                              >
                                <FaTrash size={18} />
                              </button>
                              
                              <a 
                                href={`mailto:${user.email}`}
                                style={{ color: '#2563eb' }}
                                title="Send Email"
                              >
                                <FaEnvelope size={18} />
                              </a>
                              
                              {user.role === 'customer' && (
                                <button 
                                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#b45309' }}
                                  onClick={() => handleRoleChange(user.id, 'admin')}
                                  title="Make Admin"
                                >
                                  <FaUserCog size={18} />
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
                  Showing <span style={{ fontWeight: '500' }}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span style={{ fontWeight: '500' }}>{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span style={{ fontWeight: '500' }}>{filteredUsers.length}</span> users
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
      
      {/* Add User Modal */}
      {showAddModal && (
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
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Add New User</h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setError('');
                  setSuccess('');
                }}
                style={{ 
                  backgroundColor: 'transparent', 
                  border: 'none', 
                  fontSize: '24px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  color: '#6b7280'
                }}
              >
                <FaTimes />
              </button>
            </div>
            
            {error && (
              <div style={{ 
                backgroundColor: '#fee2e2', 
                color: '#b91c1c', 
                padding: '12px', 
                borderRadius: '6px', 
                marginBottom: '16px' 
              }}>
                {error}
              </div>
            )}
            
            {success && (
              <div style={{ 
                backgroundColor: '#dcfce7', 
                color: '#166534', 
                padding: '12px', 
                borderRadius: '6px', 
                marginBottom: '16px' 
              }}>
                {success}
              </div>
            )}
            
            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="name" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151' 
                  }}
                >
                  Full Name *
                </label>
                <input 
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="email" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151' 
                  }}
                >
                  Email Address *
                </label>
                <input 
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="phone" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151' 
                  }}
                >
                  Phone Number
                </label>
                <input 
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="role" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151' 
                  }}
                >
                  User Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="password" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151' 
                  }}
                >
                  Password *
                </label>
                <input 
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label 
                  htmlFor="confirmPassword" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151' 
                  }}
                >
                  Confirm Password *
                </label>
                <input 
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setError('');
                    setSuccess('');
                  }}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'white',
                    color: '#4b5563',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  <FaTimes style={{ marginRight: '8px' }} />
                  Cancel
                </button>
                
                <button 
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? (
                    <>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        border: '2px solid rgba(255,255,255,0.3)', 
                        borderTopColor: 'white', 
                        borderRadius: '50%', 
                        animation: 'spin 1s linear infinite',
                        marginRight: '8px'
                      }}></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaSave style={{ marginRight: '8px' }} />
                      Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {showEditModal && (
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
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Edit User</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setError('');
                  setSuccess('');
                }}
                style={{ 
                  backgroundColor: 'transparent', 
                  border: 'none', 
                  fontSize: '24px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  color: '#6b7280'
                }}
              >
                <FaTimes />
              </button>
            </div>
            
            {error && (
              <div style={{ 
                backgroundColor: '#fee2e2', 
                color: '#b91c1c', 
                padding: '12px', 
                borderRadius: '6px', 
                marginBottom: '16px' 
              }}>
                {error}
              </div>
            )}
            
            {success && (
              <div style={{ 
                backgroundColor: '#dcfce7', 
                color: '#166534', 
                padding: '12px', 
                borderRadius: '6px', 
                marginBottom: '16px' 
              }}>
                {success}
              </div>
            )}
            
            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="edit-name" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151' 
                  }}
                >
                  Full Name *
                </label>
                <input 
                  type="text"
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="edit-email" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151' 
                  }}
                >
                  Email Address *
                </label>
                <input 
                  type="email"
                  id="edit-email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="edit-phone" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151' 
                  }}
                >
                  Phone Number
                </label>
                <input 
                  type="text"
                  id="edit-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="edit-role" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151' 
                  }}
                >
                  User Role *
                </label>
                <select
                  id="edit-role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="edit-password" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151' 
                  }}
                >
                  New Password
                </label>
                <input 
                  type="password"
                  id="edit-password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Leave empty to keep current password"
                />
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Leave empty to keep the current password
                </p>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label 
                  htmlFor="edit-confirmPassword" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151' 
                  }}
                >
                  Confirm New Password
                </label>
                <input 
                  type="password"
                  id="edit-confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Confirm new password"
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setError('');
                    setSuccess('');
                  }}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'white',
                    color: '#4b5563',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  <FaTimes style={{ marginRight: '8px' }} />
                  Cancel
                </button>
                
                <button 
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? (
                    <>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        border: '2px solid rgba(255,255,255,0.3)', 
                        borderTopColor: 'white', 
                        borderRadius: '50%', 
                        animation: 'spin 1s linear infinite',
                        marginRight: '8px'
                      }}></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave style={{ marginRight: '8px' }} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAdminAuth(AdminUsers);
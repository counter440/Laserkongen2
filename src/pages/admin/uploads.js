import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import { FaSearch, FaFilter, FaEye, FaTrash, FaDownload, FaCheck, FaSyncAlt, FaExclamationCircle, FaSpinner, FaCube, FaEdit } from 'react-icons/fa';
import AdminSidebar from '../../components/admin/AdminSidebar';
import withAdminAuth from '../../middleware/authAdminPage';

const AdminUploads = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const router = useRouter();
  
  // Check window size for responsive design
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Fetch uploads data
  const fetchUploads = useCallback(async () => {
    try {
      console.log('========== DEBUG: ADMIN UPLOADS PAGE FETCH ==========');
      setLoading(true);
      setError('');
      
      // Make sure we're running in the browser
      if (typeof window === 'undefined') {
        console.log('Running on server side, skipping fetch');
        return;
      }
      
      // Get auth token from sessionStorage
      let userInfo;
      try {
        userInfo = sessionStorage.getItem('userInfo')
          ? JSON.parse(sessionStorage.getItem('userInfo'))
          : null;
        console.log('DEBUG: User info retrieved - auth available:', !!userInfo);
      } catch (e) {
        console.error('Error accessing sessionStorage:', e);
        throw new Error('Error accessing authentication data');
      }
      
      if (!userInfo || !userInfo.token) {
        console.error('DEBUG: No valid auth token found');
        throw new Error('Not authenticated');
      }
      
      if (userInfo.role !== 'admin') {
        console.error('DEBUG: User is not an admin', userInfo.role);
        throw new Error('Admin access required');
      }
      
      console.log('DEBUG: Auth validated - proceeding with API request');
      
      // Make API request to get uploads
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      console.log('DEBUG: API base URL:', apiBaseUrl);
      
      let data;
      try {
        // Use the Next.js API route instead of directly connecting to the backend
        console.log(`DEBUG: Attempting to connect to API at: /api/uploads`);
        
        // Create an API client to connect to our Next.js API route
        const apiClient = axios.create({
          timeout: 5000, // 5 second timeout
          headers: {
            'Authorization': `Bearer ${userInfo.token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('DEBUG: Created API client with auth token');
        
        // Prepare query parameters - MUST SEE ALL FILES
        let params = {
          // No filters by default - show EVERYTHING
        };
        
        // By default, show ALL files, no filters whatsoever
        
        // DEBUG LOGGING
        console.log('DEBUG: Current filter selection:', filter);
        
        // By default, show ALL files - empty params will return everything
        console.log('DEBUG: Starting with empty params - will show ALL files');
        
        // Special handling for filters
        if (filter === 'order-files') {
          console.log('DEBUG: Setting orderFiles=true parameter for API request - showing only files with orders');
          // Make sure to send this as a string 'true' for URL query params
          params.orderFiles = 'true';
        } else if (filter === 'temporary') {
          // Show only temporary files
          console.log('DEBUG: Setting temporaryOnly=true parameter for API request - showing only temporary files');
          params.temporaryOnly = 'true';
        } else if (filter === 'all') {
          // Show all files - use empty params
          console.log('DEBUG: Showing all files - using empty params');
        } else {
          // File type filters
          console.log(`DEBUG: Setting fileType=${filter} parameter for filtering by file type`);
          params.fileType = filter;
        }
        
        console.log('DEBUG: Final API filter params:', JSON.stringify(params));
        
        // Ensure we're making a fresh request each time by adding a timestamp
        params.ts = Date.now();
        
        console.log('Making API request with params:', params);
        
        // Make the API request with axios instead of fetch
        console.log('DEBUG: Making API request to /api/uploads with params:', params);
        const response = await apiClient.get('/api/uploads', { params });
        data = response.data;
        console.log('DEBUG: API response status:', response.status);
        console.log('DEBUG: API response headers:', response.headers);
        console.log('DEBUG: API response data summary:', {
          total: data.total || 0,
          pages: data.pages || 0,
          fileCount: data.files?.length || 0
        });
        
        if (data.files?.length === 0) {
          console.log('DEBUG: API returned 0 files - possible filter issue');
        } else {
          console.log(`DEBUG: API returned ${data.files?.length || 0} files`);
          
          // Log the first few files with critical fields
          if (data.files && data.files.length > 0) {
            console.log('DEBUG: First 3 files summary:');
            data.files.slice(0, 3).forEach((file, index) => {
              console.log(`File ${index+1}:`, {
                id: file.id,
                originalName: file.originalName,
                fileType: file.fileType,
                temporary: file.temporary,
                order_id: file.order_id,
                hasOrder: !!file.order
              });
            });
          }
        }
        
      } catch (error) {
        console.error('API request error:', error);
        const errorMessage = error.response ? 
          `Error ${error.response.status}: ${error.response.statusText}` : 
          `Cannot connect to server at ${apiBaseUrl}. Please make sure the backend server is running.`;
        setError(errorMessage);
        setLoading(false);
        return;
      }
      
      // Format data for display
      console.log('DEBUG: Formatting data for UI display');
      const formattedUploads = data.files.map(file => {
        // Convert backend file data to the format expected by the UI
        const isModel = file.fileType === '3d-model';
        
        // Debug order data
        if (file.order_id) {
          console.log(`DEBUG: File ${file.id} has order_id ${file.order_id}, order object:`, file.order || 'missing');
        }
        
        return {
          id: file.id,
          fileName: file.filename,
          originalName: file.originalName,
          uploadDate: new Date(file.createdAt).toISOString().split('T')[0],
          fileType: file.fileType,
          status: file.processingComplete ? 'processed' : 'pending',
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          user: {
            id: file.user_id || 'unknown',
            name: file.user_name || file.user?.name || 'Anonymous User'
          },
          // Include order information if available
          order_id: file.order_id,
          order: file.order ? {
            id: file.order.id,
            status: file.order.status,
            createdAt: file.order.createdAt
          } : null,
          // Include model data if available
          modelData: isModel && file.modelData ? {
            volume: file.modelData.volume || 0,
            weight: file.modelData.weight || 0,
            dimensions: {
              x: file.modelData.dimensions?.x || 0,
              y: file.modelData.dimensions?.y || 0,
              z: file.modelData.dimensions?.z || 0
            },
            printTime: file.modelData.printTime || 0
          } : null,
          fileUrl: file.fileUrl,
          // Add temporary flag for debugging
          temporary: file.temporary
        };
      });
      
      console.log(`DEBUG: Formatted ${formattedUploads.length} uploads for UI display`);
      
      // Debug order-related files
      const filesWithOrders = formattedUploads.filter(file => file.order_id || file.order);
      console.log(`DEBUG: Found ${filesWithOrders.length} files with order associations`);
      if (filesWithOrders.length > 0) {
        filesWithOrders.forEach(file => {
          console.log(`DEBUG: File ${file.id} associated with order ${file.order_id || (file.order ? file.order.id : 'unknown')}`);
        });
      }
      
      setUploads(formattedUploads);
      setTotalPages(Math.ceil(data.pages || 1));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      setError('Failed to load uploads. Please try again.');
      setLoading(false);
    }
  }, []);
  
  // Fetch data on component mount
  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);
  
  // Refetch uploads when filter changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userInfo = sessionStorage.getItem('userInfo')
        ? JSON.parse(sessionStorage.getItem('userInfo'))
        : null;
      
      if (userInfo && userInfo.token && userInfo.role === 'admin') {
        fetchUploads();
      }
    }
  }, [filter, fetchUploads]);
  
  // Filter uploads based on file type and search query
  const filteredUploads = uploads.filter(upload => {
    let matchesFilter = false;
    
    if (filter === 'all') {
      matchesFilter = true;
    } else if (filter === 'order-files') {
      // Special case for order files - check if order exists
      matchesFilter = !!upload.order; // Check if order object exists
      
      // Debug log to see what orders we have
      if (upload.order) {
        console.log(`Found upload ${upload.id} linked to order ${upload.order.id}`);
      }
    } else {
      matchesFilter = upload.fileType === filter;
    }
    
    const matchesSearch = searchQuery === '' || 
      upload.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });
  
  // Paginate uploads
  const paginatedUploads = filteredUploads.slice((currentPage - 1) * 10, currentPage * 10);
  
  const handleStatusChange = async (uploadId, newStatus) => {
    try {
      setSuccess('');
      setError('');
      
      // Make sure we're running in the browser
      if (typeof window === 'undefined') {
        console.log('Running on server side, skipping action');
        return;
      }
      
      let userInfo;
      try {
        userInfo = sessionStorage.getItem('userInfo')
          ? JSON.parse(sessionStorage.getItem('userInfo'))
          : null;
      } catch (e) {
        console.error('Error accessing sessionStorage:', e);
        setError('Error accessing authentication data');
        return;
      }
      
      if (!userInfo || !userInfo.token) {
        setError('Not authenticated. Please login again.');
        router.push(('/admin-login'));
        return;
      }
      
      // Make API call to update the file status
      try {
        // Create API client to connect to our Next.js API route
        const apiClient = axios.create({
          timeout: 5000,
          headers: {
            'Authorization': `Bearer ${userInfo.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Make request with axios
        await apiClient.patch(`/api/uploads/${uploadId}`, {
          status: newStatus,
          processingComplete: newStatus === 'processed'
        });
        
      } catch (error) {
        console.error('API request error:', error);
        const errorMessage = error.response ? 
          `Error ${error.response.status}: ${error.response.statusText}` : 
          `Cannot connect to server at ${apiBaseUrl}. Please make sure the backend server is running.`;
        setError(errorMessage);
        return;
      }
      
      // Update local state
      setUploads(prev => 
        prev.map(upload => 
          upload.id === uploadId ? { ...upload, status: newStatus } : upload
        )
      );
      
      setSuccess(`File status updated successfully to ${newStatus}`);
    } catch (error) {
      console.error('Error updating file status:', error);
      setError(`Failed to update file status: ${error.message}`);
    }
  };

  const handleReprocess = async (uploadId) => {
    try {
      setSuccess('');
      setError('');
      
      // Make sure we're running in the browser
      if (typeof window === 'undefined') {
        console.log('Running on server side, skipping action');
        return;
      }
      
      let userInfo;
      try {
        userInfo = sessionStorage.getItem('userInfo')
          ? JSON.parse(sessionStorage.getItem('userInfo'))
          : null;
      } catch (e) {
        console.error('Error accessing sessionStorage:', e);
        setError('Error accessing authentication data');
        return;
      }
      
      if (!userInfo || !userInfo.token) {
        setError('Not authenticated. Please login again.');
        router.push(('/admin-login'));
        return;
      }
      
      // First update the status to pending
      try {
        // Create API client to connect to our Next.js API route
        const apiClient = axios.create({
          timeout: 5000,
          headers: {
            'Authorization': `Bearer ${userInfo.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // First update the status to pending
        await apiClient.patch(`/api/uploads/${uploadId}`, {
          status: 'pending',
          processingComplete: false
        });
        
        // Update local state
        setUploads(prev => 
          prev.map(upload => 
            upload.id === uploadId ? { ...upload, status: 'pending' } : upload
          )
        );
        
        // Then trigger the reprocessing
        await apiClient.post(`/api/uploads/${uploadId}/reprocess`);
        
        // Update local state to processed after reprocessing
        setUploads(prev => 
          prev.map(upload => 
            upload.id === uploadId ? { ...upload, status: 'processed' } : upload
          )
        );
        
        setSuccess('File reprocessed successfully');
        
      } catch (error) {
        console.error('API request error:', error);
        const errorMessage = error.response ? 
          `Error ${error.response.status}: ${error.response.statusText}` : 
          `Cannot connect to server at ${apiBaseUrl}. Please make sure the backend server is running.`;
        setError(errorMessage);
        return;
      }
      
    } catch (error) {
      console.error('Error reprocessing file:', error);
      setError(`Failed to reprocess file: ${error.message}`);
    }
  };
  
  const handleDeleteFile = async (uploadId) => {
    try {
      if (!confirm('Are you sure you want to delete this file?')) {
        return;
      }
      
      setSuccess('');
      setError('');
      
      // Make sure we're running in the browser
      if (typeof window === 'undefined') {
        console.log('Running on server side, skipping action');
        return;
      }
      
      let userInfo;
      try {
        userInfo = sessionStorage.getItem('userInfo')
          ? JSON.parse(sessionStorage.getItem('userInfo'))
          : null;
      } catch (e) {
        console.error('Error accessing sessionStorage:', e);
        setError('Error accessing authentication data');
        return;
      }
      
      if (!userInfo || !userInfo.token) {
        setError('Not authenticated. Please login again.');
        router.push(('/admin-login'));
        return;
      }
      
      // Make API call to delete the file
      try {
        // Create API client to connect to our Next.js API route
        const apiClient = axios.create({
          timeout: 5000,
          headers: {
            'Authorization': `Bearer ${userInfo.token}`
          }
        });
        
        // Delete the file
        await apiClient.delete(`/api/uploads/${uploadId}`);
        
        // Update local state
        setUploads(prev => prev.filter(upload => upload.id !== uploadId));
        
        // If viewing the file details, close it
        if (selectedFile && selectedFile.id === uploadId) {
          setSelectedFile(null);
        }
        
        setSuccess('File deleted successfully');
        
      } catch (error) {
        console.error('API request error:', error);
        const errorMessage = error.response ? 
          `Error ${error.response.status}: ${error.response.statusText}` : 
          `Cannot connect to server at ${apiBaseUrl}. Please make sure the backend server is running.`;
        setError(errorMessage);
        return;
      }
      
    } catch (error) {
      console.error('Error deleting file:', error);
      setError(`Failed to delete file: ${error.message}`);
    }
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'processed':
        return { bg: '#dcfce7', text: '#166534' };
      case 'error':
        return { bg: '#fee2e2', text: '#b91c1c' };
      default:
        return { bg: '#f3f4f6', text: '#1f2937' };
    }
  };
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Head>
        <title>Uploads | Admin Dashboard</title>
        <meta name="description" content="Manage uploaded files" />
      </Head>
      
      {/* Global styles */}
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
      `}</style>
      
      {/* Mobile Sidebar */}
      {isMobile && showMobileSidebar && (
        <AdminSidebar isMobile={true} onCloseMobile={() => setShowMobileSidebar(false)} />
      )}
      
      {/* Desktop Sidebar */}
      {!isMobile && <AdminSidebar />}
      
      {/* Main content */}
      <div style={{ flexGrow: 1, padding: '20px', backgroundColor: '#f1f5f9', overflowY: 'auto' }}>
        {/* Mobile Header */}
        {isMobile && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Uploads</h1>
            <button
              onClick={() => setShowMobileSidebar(true)}
              style={{
                backgroundColor: '#1e3a8a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer'
              }}
            >
              Menu
            </button>
          </div>
        )}
        
        {/* Desktop Header */}
        {!isMobile && (
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Uploads</h1>
        )}
        
        {/* Error and Success messages */}
        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            color: '#b91c1c',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaExclamationCircle />
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ 
            backgroundColor: '#dcfce7', 
            color: '#166534',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaCheck />
            {success}
          </div>
        )}
        
        {/* Filter and Search */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: '12px',
          marginBottom: '20px',
          alignItems: 'center'
        }}>
          <div style={{ 
            position: 'relative',
            width: '100%'
          }}>
            <FaSearch style={{ 
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8'
            }} />
            <input
              type="text"
              placeholder="Search by file name or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 36px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            minWidth: isMobile ? '100%' : '200px'
          }}>
            <FaFilter style={{ marginRight: '8px', color: '#64748b' }} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                width: '100%'
              }}
            >
              <option value="order-files">Files from Orders</option>
              <option value="temporary">Temporary Files</option>
              <option value="3d-model">3D Models</option>
              <option value="vector">Vector Files</option>
              <option value="image">Images</option>
              <option value="all">All Files</option>
            </select>
          </div>
        </div>
        
        {/* Uploads table */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              padding: '40px'
            }}>
              <div style={{ 
                animation: 'spin 1s linear infinite',
                color: '#64748b',
                fontSize: '24px'
              }}>
                <FaSpinner />
              </div>
            </div>
          ) : filteredUploads.length === 0 ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center',
              color: '#64748b'
            }}>
              <FaCube style={{ fontSize: '32px', opacity: 0.5, margin: '0 auto 16px' }} />
              <p>No uploads found matching your criteria.</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#64748b',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    marginTop: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px', fontWeight: '500', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>File ID</th>
                      <th style={{ padding: '12px 16px', fontWeight: '500', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>File Name</th>
                      <th style={{ padding: '12px 16px', fontWeight: '500', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Type</th>
                      <th style={{ padding: '12px 16px', fontWeight: '500', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>User</th>
                      <th style={{ padding: '12px 16px', fontWeight: '500', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Date</th>
                      <th style={{ padding: '12px 16px', fontWeight: '500', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                      <th style={{ padding: '12px 16px', fontWeight: '500', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Size</th>
                      <th style={{ padding: '12px 16px', fontWeight: '500', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Order</th>
                      <th style={{ padding: '12px 16px', fontWeight: '500', color: '#64748b', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUploads.map(upload => (
                      <tr 
                        key={upload.id} 
                        style={{ 
                          borderBottom: '1px solid #e2e8f0',
                          backgroundColor: selectedFile && selectedFile.id === upload.id ? '#f1f5f9' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>{upload.id}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div>{upload.fileName}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{upload.originalName}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {upload.fileType === '3d-model' ? '3D Model' : 
                           upload.fileType === 'vector' ? 'Vector' : 'Image'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>{upload.user.name}</td>
                        <td style={{ padding: '12px 16px' }}>{upload.uploadDate}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ 
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: getStatusClass(upload.status).bg,
                            color: getStatusClass(upload.status).text
                          }}>
                            {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{upload.size}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {upload.order_id || upload.order ? (
                            <div>
                              <span style={{
                                display: 'inline-block',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: '#e0f2fe',
                                color: '#0369a1',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                #{upload.order?.id || upload.order_id}
                              </span>
                              {upload.order?.status && (
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                  Status: {upload.order.status}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>
                              No order associated
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button
                              onClick={() => setSelectedFile(upload)}
                              title="View Details"
                              style={{
                                backgroundColor: 'transparent',
                                color: '#3b82f6',
                                border: 'none',
                                padding: '4px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              <FaEye />
                            </button>
                            
                            {upload.status === 'error' && (
                              <button 
                                onClick={() => handleReprocess(upload.id)}
                                title="Reprocess File"
                                style={{
                                  backgroundColor: 'transparent',
                                  color: '#10b981',
                                  border: 'none',
                                  padding: '4px',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                <FaSyncAlt />
                              </button>
                            )}
                            
                            {upload.status === 'pending' && (
                              <button 
                                onClick={() => handleStatusChange(upload.id, 'processed')}
                                title="Mark as Processed"
                                style={{
                                  backgroundColor: 'transparent',
                                  color: '#10b981',
                                  border: 'none',
                                  padding: '4px',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                <FaCheck />
                              </button>
                            )}
                            
                            <button 
                              onClick={() => handleDeleteFile(upload.id)}
                              title="Delete File"
                              style={{
                                backgroundColor: 'transparent',
                                color: '#ef4444',
                                border: 'none',
                                padding: '4px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                fontSize: '14px'
              }}>
                <div style={{ color: '#64748b' }}>
                  Showing {paginatedUploads.length > 0 ? (currentPage - 1) * 10 + 1 : 0} to {Math.min(currentPage * 10, filteredUploads.length)} of {filteredUploads.length} uploads
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: currentPage === 1 ? '#f1f5f9' : 'white',
                      color: currentPage === 1 ? '#94a3b8' : '#1e293b',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Previous
                  </button>
                  
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: currentPage === totalPages ? '#f1f5f9' : 'white',
                      color: currentPage === totalPages ? '#94a3b8' : '#1e293b',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* File Details */}
        {selectedFile && (
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '24px'
          }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>File Details</h2>
              <button
                onClick={() => setSelectedFile(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                &times;
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Basic Information</h3>
                  <table style={{ width: '100%', fontSize: '14px' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px 0', color: '#64748b', fontWeight: '500' }}>File ID:</td>
                        <td style={{ padding: '8px 0' }}>{selectedFile.id}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0', color: '#64748b', fontWeight: '500' }}>File Name:</td>
                        <td style={{ padding: '8px 0' }}>{selectedFile.fileName}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0', color: '#64748b', fontWeight: '500' }}>Original Name:</td>
                        <td style={{ padding: '8px 0' }}>{selectedFile.originalName}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0', color: '#64748b', fontWeight: '500' }}>File Type:</td>
                        <td style={{ padding: '8px 0' }}>
                          {selectedFile.fileType === '3d-model' ? '3D Model' : 
                           selectedFile.fileType === 'vector' ? 'Vector' : 'Image'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0', color: '#64748b', fontWeight: '500' }}>Size:</td>
                        <td style={{ padding: '8px 0' }}>{selectedFile.size}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0', color: '#64748b', fontWeight: '500' }}>Upload Date:</td>
                        <td style={{ padding: '8px 0' }}>{selectedFile.uploadDate}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0', color: '#64748b', fontWeight: '500' }}>Status:</td>
                        <td style={{ padding: '8px 0' }}>
                          <span style={{ 
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: getStatusClass(selectedFile.status).bg,
                            color: getStatusClass(selectedFile.status).text
                          }}>
                            {selectedFile.status.charAt(0).toUpperCase() + selectedFile.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0', color: '#64748b', fontWeight: '500' }}>Uploaded By:</td>
                        <td style={{ padding: '8px 0' }}>{selectedFile.user.name}</td>
                      </tr>
                      {(selectedFile.order_id || selectedFile.order) && (
                        <tr>
                          <td style={{ padding: '8px 0', color: '#64748b', fontWeight: '500' }}>Order:</td>
                          <td style={{ padding: '8px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: '#e0f2fe',
                                color: '#0369a1',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                #{selectedFile.order?.id || selectedFile.order_id}
                              </span>
                              {selectedFile.order?.status && (
                                <span style={{ fontSize: '12px', color: '#64748b' }}>
                                  Status: {selectedFile.order.status}
                                </span>
                              )}
                              <Link
                                href={`/admin/orders/${selectedFile.order?.id || selectedFile.order_id}`}
                                style={{ 
                                  fontSize: '12px', 
                                  color: '#1d4ed8', 
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <FaEye size={12} /> View order
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {selectedFile.fileType === '3d-model' && selectedFile.modelData && (
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>3D Model Details</h3>
                    <table style={{ width: '100%', fontSize: '14px' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '8px 0', color: '#64748b', fontWeight: '500' }}>Volume:</td>
                          <td style={{ padding: '8px 0' }}>{selectedFile.modelData.volume} cm³</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 0', color: '#64748b', fontWeight: '500' }}>Weight:</td>
                          <td style={{ padding: '8px 0' }}>{selectedFile.modelData.weight} g</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 0', color: '#64748b', fontWeight: '500' }}>Dimensions:</td>
                          <td style={{ padding: '8px 0' }}>
                            {selectedFile.modelData.dimensions.x} × {selectedFile.modelData.dimensions.y} × {selectedFile.modelData.dimensions.z} cm
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 0', color: '#64748b', fontWeight: '500' }}>Print Time:</td>
                          <td style={{ padding: '8px 0' }}>{selectedFile.modelData.printTime} hours</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 0', color: '#64748b', fontWeight: '500' }}>Cost Estimate:</td>
                          <td style={{ padding: '8px 0' }}>
                            kr {(selectedFile.modelData.weight * 0.05 + selectedFile.modelData.printTime * 5).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Direct link to file URL - the working option */}
                  <a 
                    href={selectedFile.fileUrl.replace('http://localhost:5001', 'http://194.32.107.238:5001')} 
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      backgroundColor: '#1e3a8a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      fontSize: '15px'
                    }}
                  >
                    <FaDownload />
                    Download File
                  </a>
                  
                  {/* Associate with order button */}
                  <button 
                    onClick={() => {
                      // Ask user for order ID
                      const orderId = prompt('Enter order ID to associate with this file:');
                      if (orderId && orderId.trim()) {
                        // Ensure we have auth
                        const userInfo = sessionStorage.getItem('userInfo')
                          ? JSON.parse(sessionStorage.getItem('userInfo'))
                          : null;
                          
                        if (!userInfo || !userInfo.token) {
                          alert('Authentication required. Please login again.');
                          return;
                        }
                        
                        // Get token
                        const token = userInfo.token;
                        
                        // Make API call to associate file with order
                        fetch(`/api/orders/${orderId.trim()}/files`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ fileIds: [selectedFile.id] })
                        })
                        .then(response => {
                          if (!response.ok) {
                            throw new Error(`Failed to associate file: ${response.status}`);
                          }
                          return response.json();
                        })
                        .then(data => {
                          console.log('File association response:', data);
                          
                          // Update the selectedFile with the new order data
                          setSelectedFile(prev => ({
                            ...prev,
                            order_id: orderId.trim(),
                            order: {
                              id: orderId.trim(),
                              status: 'pending'
                            }
                          }));
                          
                          // Also update in the uploads list
                          setUploads(prev => 
                            prev.map(upload => 
                              upload.id === selectedFile.id ? {
                                ...upload,
                                order_id: orderId.trim(),
                                order: {
                                  id: orderId.trim(),
                                  status: 'pending'
                                }
                              } : upload
                            )
                          );
                          
                          setSuccess(`File successfully associated with order ${orderId}`);
                          
                          // Force refresh to make sure we get the latest data
                          setTimeout(() => {
                            fetchUploads();
                          }, 500);
                        })
                        .catch(error => {
                          console.error('Error associating file with order:', error);
                          setError(`Failed to associate file: ${error.message}`);
                        });
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <FaEdit />
                    Associate with Order
                  </button>
                  
                  {selectedFile.status === 'error' && (
                    <button 
                      onClick={() => handleReprocess(selectedFile.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      <FaSyncAlt />
                      Reprocess
                    </button>
                  )}
                </div>
                
                <button 
                  onClick={() => handleDeleteFile(selectedFile.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  <FaTrash />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Upload Statistics */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Upload Statistics</h2>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ 
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Total Uploads</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0284c7', margin: 0 }}>
                {loading ? '...' : uploads.length}
              </p>
            </div>
            
            <div style={{ 
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Processed Files</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>
                {loading ? '...' : uploads.filter(u => u.status === 'processed').length}
              </p>
            </div>
            
            <div style={{ 
              backgroundColor: '#fff7ed',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Pending Processing</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ea580c', margin: 0 }}>
                {loading ? '...' : uploads.filter(u => u.status === 'pending').length}
              </p>
            </div>
          </div>
          
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>File Type Distribution</h3>
          <div style={{ 
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ 
              flex: 1,
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px' }}>3D Models</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  {loading ? '...' : uploads.filter(u => u.fileType === '3d-model').length}
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                {!loading && uploads.length > 0 && (
                  <div
                    style={{
                      height: '100%',
                      width: `${(uploads.filter(u => u.fileType === '3d-model').length / uploads.length) * 100}%`,
                      backgroundColor: '#3b82f6',
                      borderRadius: '4px'
                    }}
                  />
                )}
              </div>
            </div>
            
            <div style={{ 
              flex: 1,
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px' }}>Vector Files</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  {loading ? '...' : uploads.filter(u => u.fileType === 'vector').length}
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                {!loading && uploads.length > 0 && (
                  <div
                    style={{
                      height: '100%',
                      width: `${(uploads.filter(u => u.fileType === 'vector').length / uploads.length) * 100}%`,
                      backgroundColor: '#8b5cf6',
                      borderRadius: '4px'
                    }}
                  />
                )}
              </div>
            </div>
            
            <div style={{ 
              flex: 1,
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px' }}>Images</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  {loading ? '...' : uploads.filter(u => u.fileType === 'image').length}
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                {!loading && uploads.length > 0 && (
                  <div
                    style={{
                      height: '100%',
                      width: `${(uploads.filter(u => u.fileType === 'image').length / uploads.length) * 100}%`,
                      backgroundColor: '#f59e0b',
                      borderRadius: '4px'
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withAdminAuth(AdminUploads);
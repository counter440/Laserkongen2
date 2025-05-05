import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FaCog, FaEnvelope, FaSave, FaPaperPlane, FaCheck, FaExclamationCircle, FaSpinner, FaGlobe } from 'react-icons/fa';
import AdminSidebar from '../../components/admin/AdminSidebar';
import withAdminAuth from '../../middleware/authAdminPage';

const AdminSettings = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('email');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Notification settings form
  const [notificationSettings, setNotificationSettings] = useState({
    notify_new_order: 'true',
    notify_order_status: 'true',
    notify_contact_form: 'true'
  });
  
  // Email settings form
  const [emailSettings, setEmailSettings] = useState({
    contact_recipients: '',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    smtp_from_email: '',
    smtp_from_name: 'Laserkongen',
    smtp_secure: 'false'
  });
  
  // Site settings form
  const [siteSettings, setSiteSettings] = useState({
    site_title: 'Laserkongen',
    site_description: 'Din partner for 3D-printing og lasergravering',
    company_name: 'Laserkongen AS',
    company_address: 'Industriveien 42, 1482 Nittedal',
    company_phone: '+47 123 45 678',
    company_email: 'kontakt@laserkongen.no'
  });
  
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
  
  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const userInfo = sessionStorage.getItem('userInfo')
        ? JSON.parse(sessionStorage.getItem('userInfo'))
        : null;
      
      if (!userInfo || !userInfo.token) {
        router.push('/admin-login');
      } else if (userInfo.role !== 'admin') {
        router.push('/');
      } else {
        fetchSettings();
      }
    };
    
    checkAuth();
  }, [router]);
  
  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
      
      // Fetch email settings
      const emailResponse = await fetch('/api/settings/email', {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`
        }
      });
      
      const emailData = await emailResponse.json();
      
      if (!emailResponse.ok) {
        if (emailResponse.status === 401 && emailData.tokenExpired) {
          // Token expired, clear auth and redirect to login
          sessionStorage.removeItem('userInfo');
          router.push('/admin-login?redirect=admin/settings&expired=true');
          throw new Error('Authentication expired');
        }
        throw new Error(emailData.message || 'Failed to fetch email settings');
      }
      
      // Update email settings form
      setEmailSettings(prevSettings => ({
        ...prevSettings,
        ...emailData
      }));
      
      // Fetch notification settings
      try {
        const notificationResponse = await fetch('/api/settings/notifications', {
          headers: {
            'Authorization': `Bearer ${userInfo.token}`
          }
        });
        
        const notificationData = await notificationResponse.json();
        
        if (notificationResponse.ok) {
          // Update notification settings form
          setNotificationSettings(prevSettings => ({
            ...prevSettings,
            ...notificationData
          }));
        } else {
          console.error('Notification settings error:', notificationData);
          // Continue without throwing since we don't want to stop the page from loading
        }
      } catch (notificationError) {
        console.error('Error fetching notification settings:', notificationError);
        // We don't want to stop the page from loading just because notification settings failed
      }
      
      // Fetch site settings
      try {
        const siteResponse = await fetch('/api/settings/site', {
          headers: {
            'Authorization': `Bearer ${userInfo.token}`
          }
        });
        
        const siteData = await siteResponse.json();
        
        if (!siteResponse.ok) {
          if (siteResponse.status === 401 && siteData.tokenExpired) {
            // Token expired, clear auth and redirect to login
            sessionStorage.removeItem('userInfo');
            router.push('/admin-login?redirect=admin/settings&expired=true');
            throw new Error('Authentication expired');
          }
          console.error('Site settings error:', siteData);
          // Continue without throwing since we don't want to stop the page from loading
        } else {
          // Update site settings form
          setSiteSettings(prevSettings => ({
            ...prevSettings,
            ...siteData
          }));
        }
      } catch (siteError) {
        console.error('Error fetching site settings:', siteError);
        // We don't want to stop the page from loading just because site settings failed
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e, formType = 'email') => {
    const { name, value, type, checked } = e.target;
    
    if (formType === 'email') {
      setEmailSettings(prevSettings => ({
        ...prevSettings,
        [name]: type === 'checkbox' ? (checked ? 'true' : 'false') : value
      }));
    } else if (formType === 'site') {
      setSiteSettings(prevSettings => ({
        ...prevSettings,
        [name]: value
      }));
    }
  };
  
  // Save email settings
  const handleSaveEmailSettings = async (e) => {
    e.preventDefault();
    
    try {
      setFormLoading(true);
      setError('');
      setSuccess('');
      
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
      
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify(emailSettings)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save email settings');
      }
      
      setSuccess('Email settings saved successfully');
      setFormLoading(false);
    } catch (error) {
      console.error('Error saving email settings:', error);
      setError(error.message || 'Failed to save email settings');
      setFormLoading(false);
    }
  };
  
  // Send test email
  const handleSendTestEmail = async () => {
    try {
      setTestEmailLoading(true);
      setError('');
      setSuccess('');
      
      // Validate that required email settings are filled in
      const requiredSettings = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from_email', 'contact_recipients'];
      const missingSettings = requiredSettings.filter(setting => !emailSettings[setting]);
      
      if (missingSettings.length > 0) {
        throw new Error(`Missing required email settings: ${missingSettings.join(', ')}`);
      }
      
      if (!emailSettings.contact_recipients.includes('@')) {
        throw new Error('Please enter a valid recipient email address');
      }
      
      const userInfo = sessionStorage.getItem('userInfo')
        ? JSON.parse(sessionStorage.getItem('userInfo'))
        : null;
        
      if (!userInfo || !userInfo.token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Use all recipients in comma-separated list
      const allRecipients = emailSettings.contact_recipients.trim();
      console.log('Sending test email to:', allRecipients);
      
      const response = await fetch('/api/settings/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ email: allRecipients })
      });
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse response:', jsonError);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        const errorMessage = data.message || 'Failed to send test email';
        const detailMessage = data.error 
          ? `${errorMessage} (${data.error})` 
          : errorMessage;
        throw new Error(detailMessage);
      }
      
      setSuccess('Test email sent successfully');
    } catch (error) {
      console.error('Error sending test email:', error);
      setError(error.message || 'Failed to send test email');
    } finally {
      setTestEmailLoading(false);
    }
  };
  
  // Save site settings
  const handleSaveSiteSettings = async (e) => {
    e.preventDefault();
    
    try {
      setFormLoading(true);
      setError('');
      setSuccess('');
      
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
      
      const response = await fetch('/api/settings/site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify(siteSettings)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save site settings');
      }
      
      setSuccess('Site settings saved successfully');
      setFormLoading(false);
    } catch (error) {
      console.error('Error saving site settings:', error);
      setError(error.message || 'Failed to save site settings');
      setFormLoading(false);
    }
  };
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Head>
        <title>Settings | Admin Dashboard</title>
        <meta name="description" content="Manage your site settings" />
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
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Settings</h1>
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
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Settings</h1>
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
        
        {/* Settings Tabs */}
        <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setActiveTab('email')}
            style={{
              padding: '12px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'email' ? '2px solid #1e3a8a' : 'none',
              color: activeTab === 'email' ? '#1e3a8a' : '#64748b',
              fontWeight: activeTab === 'email' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaEnvelope />
              Email Settings
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('site')}
            style={{
              padding: '12px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'site' ? '2px solid #1e3a8a' : 'none',
              color: activeTab === 'site' ? '#1e3a8a' : '#64748b',
              fontWeight: activeTab === 'site' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaGlobe />
              Site Settings
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('notifications')}
            style={{
              padding: '12px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'notifications' ? '2px solid #1e3a8a' : 'none',
              color: activeTab === 'notifications' ? '#1e3a8a' : '#64748b',
              fontWeight: activeTab === 'notifications' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaEnvelope />
              Notifications
            </div>
          </button>
        </div>
        
        {/* Settings Content */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
          ) : (
            <>
              {activeTab === 'email' && (
                <form onSubmit={handleSaveEmailSettings}>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Contact Form Email Configuration</h2>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="contact_recipients" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Recipient Email Addresses *
                    </label>
                    <input
                      type="text"
                      id="contact_recipients"
                      name="contact_recipients"
                      value={emailSettings.contact_recipients}
                      onChange={(e) => handleInputChange(e, 'email')}
                      required
                      placeholder="email@example.com, another@example.com"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db'
                      }}
                    />
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Separate multiple email addresses with commas
                    </p>
                  </div>
                  
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', marginTop: '32px' }}>SMTP Server Settings</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label htmlFor="smtp_host" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        SMTP Host *
                      </label>
                      <input
                        type="text"
                        id="smtp_host"
                        name="smtp_host"
                        value={emailSettings.smtp_host}
                        onChange={(e) => handleInputChange(e, 'email')}
                        required
                        placeholder="smtp.example.com"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="smtp_port" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        SMTP Port *
                      </label>
                      <input
                        type="text"
                        id="smtp_port"
                        name="smtp_port"
                        value={emailSettings.smtp_port}
                        onChange={(e) => handleInputChange(e, 'email')}
                        required
                        placeholder="587"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db'
                        }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label htmlFor="smtp_user" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        SMTP Username *
                      </label>
                      <input
                        type="text"
                        id="smtp_user"
                        name="smtp_user"
                        value={emailSettings.smtp_user}
                        onChange={(e) => handleInputChange(e, 'email')}
                        required
                        placeholder="username"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="smtp_password" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        SMTP Password *
                      </label>
                      <input
                        type="password"
                        id="smtp_password"
                        name="smtp_password"
                        value={emailSettings.smtp_password}
                        onChange={(e) => handleInputChange(e, 'email')}
                        required
                        placeholder="••••••••"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db'
                        }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label htmlFor="smtp_from_email" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        From Email *
                      </label>
                      <input
                        type="email"
                        id="smtp_from_email"
                        name="smtp_from_email"
                        value={emailSettings.smtp_from_email}
                        onChange={(e) => handleInputChange(e, 'email')}
                        required
                        placeholder="noreply@yourdomain.com"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="smtp_from_name" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        From Name
                      </label>
                      <input
                        type="text"
                        id="smtp_from_name"
                        name="smtp_from_name"
                        value={emailSettings.smtp_from_name}
                        onChange={(e) => handleInputChange(e, 'email')}
                        placeholder="Laserkongen"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db'
                        }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="smtp_secure"
                        checked={emailSettings.smtp_secure === 'true'}
                        onChange={(e) => handleInputChange(e, 'email')}
                        style={{ marginRight: '8px' }}
                      />
                      Use SSL/TLS (usually for port 465)
                    </label>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Enable this if your SMTP server requires a secure connection. Usually enabled for port 465, disabled for port 587.
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={testEmailLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        backgroundColor: '#1e40af',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: '500',
                        cursor: testEmailLoading ? 'not-allowed' : 'pointer',
                        opacity: testEmailLoading ? 0.7 : 1
                      }}
                    >
                      {testEmailLoading ? (
                        <>
                          <div style={{ animation: 'spin 1s linear infinite' }}>
                            <FaSpinner />
                          </div>
                          Testing...
                        </>
                      ) : (
                        <>
                          <FaPaperPlane />
                          Send Test Email
                        </>
                      )}
                    </button>
                    
                    <button
                      type="submit"
                      disabled={formLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        backgroundColor: '#1e3a8a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: '500',
                        cursor: formLoading ? 'not-allowed' : 'pointer',
                        opacity: formLoading ? 0.7 : 1
                      }}
                    >
                      {formLoading ? (
                        <>
                          <div style={{ animation: 'spin 1s linear infinite' }}>
                            <FaSpinner />
                          </div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave />
                          Save Settings
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
              
              {activeTab === 'notifications' && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  
                  const saveNotification = async () => {
                    try {
                      setFormLoading(true);
                      setError('');
                      setSuccess('');
                      
                      const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
                      
                      const response = await fetch('/api/settings/notifications', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${userInfo.token}`
                        },
                        body: JSON.stringify(notificationSettings)
                      });
                      
                      if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.message || 'Failed to save notification settings');
                      }
                      
                      setSuccess('Notification settings saved successfully');
                      setFormLoading(false);
                    } catch (error) {
                      console.error('Error saving notification settings:', error);
                      setError(error.message || 'Failed to save notification settings');
                      setFormLoading(false);
                    }
                  };
                  
                  saveNotification();
                }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Email Notification Settings</h2>
                  <p style={{ marginBottom: '16px' }}>Select which events should trigger email notifications to admin users.</p>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '12px' }}>
                      <input
                        type="checkbox"
                        name="notify_new_order"
                        checked={notificationSettings.notify_new_order === 'true'}
                        onChange={(e) => {
                          setNotificationSettings(prev => ({
                            ...prev,
                            notify_new_order: e.target.checked ? 'true' : 'false'
                          }));
                        }}
                        style={{ marginRight: '8px' }}
                      />
                      New order received
                    </label>
                    
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '12px' }}>
                      <input
                        type="checkbox"
                        name="notify_order_status"
                        checked={notificationSettings.notify_order_status === 'true'}
                        onChange={(e) => {
                          setNotificationSettings(prev => ({
                            ...prev,
                            notify_order_status: e.target.checked ? 'true' : 'false'
                          }));
                        }}
                        style={{ marginRight: '8px' }}
                      />
                      Order status changes
                    </label>
                    
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '12px' }}>
                      <input
                        type="checkbox"
                        name="notify_contact_form"
                        checked={notificationSettings.notify_contact_form === 'true'}
                        onChange={(e) => {
                          setNotificationSettings(prev => ({
                            ...prev,
                            notify_contact_form: e.target.checked ? 'true' : 'false'
                          }));
                        }}
                        style={{ marginRight: '8px' }}
                      />
                      New contact form submissions
                    </label>
                  </div>
                  
                  <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>
                    Admin notifications will be sent to the email addresses specified in the Email Settings tab.
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      disabled={formLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        backgroundColor: '#1e3a8a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: '500',
                        cursor: formLoading ? 'not-allowed' : 'pointer',
                        opacity: formLoading ? 0.7 : 1
                      }}
                    >
                      {formLoading ? (
                        <>
                          <div style={{ animation: 'spin 1s linear infinite' }}>
                            <FaSpinner />
                          </div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave />
                          Save Settings
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
              
              {activeTab === 'site' && (
                <form onSubmit={handleSaveSiteSettings}>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Site Information</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label htmlFor="site_title" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Site Title *
                      </label>
                      <input
                        type="text"
                        id="site_title"
                        name="site_title"
                        value={siteSettings.site_title}
                        onChange={(e) => handleInputChange(e, 'site')}
                        required
                        placeholder="Laserkongen"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="site_description" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Site Description
                      </label>
                      <input
                        type="text"
                        id="site_description"
                        name="site_description"
                        value={siteSettings.site_description}
                        onChange={(e) => handleInputChange(e, 'site')}
                        placeholder="Din partner for 3D-printing og lasergravering"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db'
                        }}
                      />
                    </div>
                  </div>
                  
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', marginTop: '32px' }}>Company Information</h2>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="company_name" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Company Name *
                    </label>
                    <input
                      type="text"
                      id="company_name"
                      name="company_name"
                      value={siteSettings.company_name}
                      onChange={(e) => handleInputChange(e, 'site')}
                      required
                      placeholder="Laserkongen AS"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="company_address" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Company Address
                    </label>
                    <input
                      type="text"
                      id="company_address"
                      name="company_address"
                      value={siteSettings.company_address}
                      onChange={(e) => handleInputChange(e, 'site')}
                      placeholder="Industriveien 42, 1482 Nittedal"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                    <div>
                      <label htmlFor="company_phone" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Company Phone
                      </label>
                      <input
                        type="text"
                        id="company_phone"
                        name="company_phone"
                        value={siteSettings.company_phone}
                        onChange={(e) => handleInputChange(e, 'site')}
                        placeholder="+47 123 45 678"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="company_email" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Company Email
                      </label>
                      <input
                        type="email"
                        id="company_email"
                        name="company_email"
                        value={siteSettings.company_email}
                        onChange={(e) => handleInputChange(e, 'site')}
                        placeholder="kontakt@laserkongen.no"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db'
                        }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      disabled={formLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        backgroundColor: '#1e3a8a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: '500',
                        cursor: formLoading ? 'not-allowed' : 'pointer',
                        opacity: formLoading ? 0.7 : 1
                      }}
                    >
                      {formLoading ? (
                        <>
                          <div style={{ animation: 'spin 1s linear infinite' }}>
                            <FaSpinner />
                          </div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave />
                          Save Settings
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default withAdminAuth(AdminSettings);
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const Setup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminSecretKey, setAdminSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;
      
    if (userInfo && userInfo.token) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!name || !email || !password || !adminSecretKey) {
      setError('All fields are required');
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if admin secret key is valid
      if (adminSecretKey !== 'laserkongen_admin_setup_key') {
        throw new Error('Invalid admin secret key');
      }
      
      // Create an actual admin user in the database
      const response = await fetch('/api/users/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password,
          adminSecretKey
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create admin user');
      }
      
      // Save the real user info to localStorage
      localStorage.setItem('userInfo', JSON.stringify(data));
      
      setSuccess(true);
      
      // Redirect to admin dashboard after 2 seconds
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh',
      backgroundColor: '#f1f5f9'
    }}>
      <Head>
        <title>Admin Setup | Laserkongen</title>
        <meta name="description" content="Setup admin account for Laserkongen." />
      </Head>
      
      <div style={{
        maxWidth: '500px',
        width: '100%',
        margin: '80px auto',
        padding: '30px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            color: '#0ea5e9'
          }}>Setup Admin Account</h1>
          <p style={{ 
            fontSize: '14px',
            color: '#64748b'
          }}>Create the first admin user for Laserkongen</p>
        </div>
        
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
        
        {success && (
          <div style={{
            backgroundColor: '#d1fae5',
            color: '#065f46',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            Admin account created successfully! Redirecting to admin dashboard...
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label 
              htmlFor="name" 
              style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '14px',
                fontWeight: '500',
                color: '#4b5563'
              }}
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
              placeholder="Your Name"
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
                color: '#4b5563'
              }}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
              placeholder="your.email@example.com"
              required
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label 
              htmlFor="password" 
              style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '14px',
                fontWeight: '500',
                color: '#4b5563'
              }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
              placeholder="••••••••"
              required
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label 
              htmlFor="confirmPassword" 
              style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '14px',
                fontWeight: '500',
                color: '#4b5563'
              }}
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
              placeholder="••••••••"
              required
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label 
              htmlFor="adminSecretKey" 
              style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '14px',
                fontWeight: '500',
                color: '#4b5563'
              }}
            >
              Admin Secret Key
            </label>
            <input
              type="password"
              id="adminSecretKey"
              value={adminSecretKey}
              onChange={(e) => setAdminSecretKey(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
              placeholder="Admin Secret Key"
              required
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
              For initial setup, use: laserkongen_admin_setup_key
            </p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
          </button>
          
          <div style={{ 
            marginTop: '16px', 
            textAlign: 'center', 
            fontSize: '14px',
            color: '#6b7280'
          }}>
            <a 
              href="/" 
              style={{ 
                color: '#0ea5e9', 
                textDecoration: 'none'
              }}
            >
              Return to homepage
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Setup;
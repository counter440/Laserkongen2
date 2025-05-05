import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { FaEnvelope, FaLock, FaExclamationCircle, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login, user } = useAuth();
  
  // Check if redirected due to expired token
  const [tokenExpired, setTokenExpired] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [windowWidth, setWindowWidth] = useState(null);
  
  // Handle window resize for responsiveness
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  // Determine if we're on mobile
  const isMobile = windowWidth && windowWidth < 768;
  
  useEffect(() => {
    // Check query parameters for token expiration
    const { expired, redirect } = router.query;
    if (expired === 'true') {
      setTokenExpired(true);
    }
    if (redirect) {
      setRedirectUrl(redirect);
    }
    
    // Check if user is already logged in
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/'); // Regular users shouldn't access admin
      }
    }
  }, [router, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Vennligst fyll inn både e-post og passord');
      return;
    }
    
    setLoading(true);
    
    // Call login from auth context
    const result = await login(email, password);
    
    if (result.success) {
      // Check if user is admin
      if (result.data.role === 'admin') {
        // Redirect to admin dashboard
        router.push('/admin');
      } else {
        // Not an admin user
        setError('Du har ikke administrator-tilgang');
      }
    } else {
      // Display error message
      setError(result.error || 'Innlogging mislyktes');
    }
    
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <Head>
        <title>Admin Innlogging | Laserkongen</title>
        <meta name="description" content="Logg inn på Laserkongen administrasjonspanel" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <div style={{ 
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 
        padding: isMobile ? '40px 20px' : '60px 24px', 
        color: 'white',
        textAlign: 'center',
        marginBottom: '-40px'
      }}>
        <h1 style={{ 
          fontSize: isMobile ? '28px' : '36px', 
          fontWeight: '800', 
          marginBottom: '16px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          letterSpacing: '-0.025em'
        }}>
          Administrasjonspanel
        </h1>
        <p style={{ 
          fontSize: isMobile ? '16px' : '18px', 
          maxWidth: '600px', 
          margin: '0 auto',
          opacity: '0.9'
        }}>
          Logg inn for å administrere produkter, bestillinger og brukere
        </p>
      </div>
      
      <div style={{ 
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto 60px',
        padding: isMobile ? '20px' : '0',
        flex: '1',
        position: 'relative',
        zIndex: '1'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
          padding: isMobile ? '24px' : '40px',
          position: 'relative'
        }}>
          {(error || tokenExpired) && (
            <div style={{
              backgroundColor: tokenExpired ? '#fff7ed' : '#fee2e2',
              color: tokenExpired ? '#c2410c' : '#b91c1c',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <FaExclamationCircle />
              <span>{tokenExpired ? 'Din økt har utløpt. Vennligst logg inn på nytt.' : error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label 
                htmlFor="email" 
                style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#334155'
                }}
              >
                E-postadresse
              </label>
              <div style={{ 
                position: 'relative',
                marginBottom: '16px'
              }}>
                <div style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  fontSize: '16px'
                }}>
                  <FaEnvelope />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 44px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '15px',
                    backgroundColor: '#f8fafc',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  placeholder="din.epost@eksempel.no"
                  required
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '28px' }}>
              <label 
                htmlFor="password" 
                style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#334155'
                }}
              >
                Passord
              </label>
              <div style={{ 
                position: 'relative',
                marginBottom: '8px'
              }}>
                <div style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  fontSize: '16px'
                }}>
                  <FaLock />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 44px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '15px',
                    backgroundColor: '#f8fafc',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.8 : 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                fontSize: '16px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  Logger inn...
                </>
              ) : (
                'Logg inn til administrasjon'
              )}
            </button>
            
            <div style={{
              marginTop: '28px',
              textAlign: 'center'
            }}>
              <Link 
                href="/" 
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#64748b', 
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  transition: 'all 0.2s ease'
                }}
              >
                Tilbake til hjemmesiden
              </Link>
            </div>
          </form>
        </div>
      </div>
      
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 15px rgba(59, 130, 246, 0.4);
        }
        
        button:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;
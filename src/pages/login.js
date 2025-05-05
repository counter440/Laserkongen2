import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import { FaEnvelope, FaLock, FaExclamationCircle, FaSpinner } from 'react-icons/fa';

const Login = () => {
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
  const { cartItems } = useCart();
  
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
      // Always redirect regular login to account page regardless of role
      router.push('/account');
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
      // Redirect to the redirect URL if provided, otherwise always to account page
      // regardless of user role
      if (redirectUrl) {
        router.push(`/${redirectUrl}`);
      } else {
        router.push('/account');
      }
    } else {
      setError(result.error || 'En feil oppstod under innloggingen');
    }
    
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <Head>
        <title>Logg inn | Laserkongen</title>
        <meta name="description" content="Logg inn på din Laserkongen konto for å håndtere bestillinger og opplastede filer." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <Header cartItemCount={cartItems.reduce((total, item) => total + item.quantity, 0)} />
      
      <div style={{ 
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', 
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
          Logg inn på din konto
        </h1>
        <p style={{ 
          fontSize: isMobile ? '16px' : '18px', 
          maxWidth: '600px', 
          margin: '0 auto',
          opacity: '0.9'
        }}>
          Få tilgang til din ordrehistorikk og administrer dine 3D-modeller
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
              <div style={{ textAlign: 'right' }}>
                <a 
                  href="/forgot-password" 
                  style={{ 
                    color: '#0284c7', 
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Glemt passordet?
                </a>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
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
                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  Logger inn...
                </>
              ) : (
                'Logg inn'
              )}
            </button>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              margin: '28px 0 0',
              position: 'relative'
            }}>
              <div style={{ height: '1px', flex: 1, backgroundColor: '#e2e8f0' }}></div>
              <span style={{ color: '#64748b', fontSize: '14px' }}>eller</span>
              <div style={{ height: '1px', flex: 1, backgroundColor: '#e2e8f0' }}></div>
            </div>
            
            <div style={{
              marginTop: '28px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '15px', color: '#334155', marginBottom: '20px' }}>
                Har du ikke en konto? 
                <a href="/register" style={{ 
                  color: '#0284c7', 
                  textDecoration: 'none',
                  fontWeight: '600',
                  marginLeft: '6px'
                }}>
                  Registrer deg
                </a>
              </p>
              
              <a 
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
              </a>
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
          border-color: #0ea5e9;
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 15px rgba(14, 165, 233, 0.4);
        }
        
        button:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default Login;
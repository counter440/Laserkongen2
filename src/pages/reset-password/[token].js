import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import { useCart } from '../../context/CartContext';
import { FaLock, FaExclamationCircle, FaSpinner, FaCheck } from 'react-icons/fa';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const router = useRouter();
  const { token } = router.query;
  const { cartItems } = useCart();
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

  // Validate token
  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          const response = await fetch(`/api/password-reset/verify/${token}`);
          const data = await response.json();
          
          setIsValid(data.valid);
          
          if (!data.valid) {
            setMessage({ 
              type: 'error', 
              text: data.message || 'Ugyldig eller utløpt tilbakestillingslenke. Vennligst be om en ny.'
            });
          }
        } catch (error) {
          console.error('Error validating token:', error);
          setIsValid(false);
          setMessage({ 
            type: 'error', 
            text: 'En feil oppstod ved validering av tilbakestillingslenken. Vennligst prøv igjen senere.'
          });
        } finally {
          setValidating(false);
        }
      }
    };
    
    if (token) {
      validateToken();
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    // Validate passwords
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Passordet må være minst 6 tegn langt' });
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passordene er ikke like' });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/password-reset/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: data.message || 'Passordet ditt er tilbakestilt. Du kan nå logge inn med ditt nye passord.'
        });
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || 'Kunne ikke tilbakestille passordet. Vennligst prøv igjen senere.'
        });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setMessage({ 
        type: 'error', 
        text: 'En uventet feil oppstod. Vennligst prøv igjen senere.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
      <Head>
        <title>Tilbakestill passord | Laserkongen</title>
        <meta name="description" content="Opprett et nytt passord for din Laserkongen konto." />
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
          Opprett nytt passord
        </h1>
        <p style={{ 
          fontSize: isMobile ? '16px' : '18px', 
          maxWidth: '600px', 
          margin: '0 auto',
          opacity: '0.9'
        }}>
          Vennligst oppgi ditt nye passord for å fullføre tilbakestillingen
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
          {validating ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              padding: '40px',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '15px'
            }}>
              <FaSpinner size={24} style={{ 
                color: '#0284c7',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{ 
                margin: 0, 
                color: '#64748b',
                fontSize: '15px'
              }}>
                Validerer tilbakestillingslenke...
              </p>
            </div>
          ) : isValid ? (
            <>
              {message.text && (
                <div style={{
                  backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fee2e2',
                  color: message.type === 'success' ? '#16a34a' : '#b91c1c',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {message.type === 'success' ? <FaCheck /> : <FaExclamationCircle />}
                  <span>{message.text}</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '24px' }}>
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
                    Nytt passord
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
                      placeholder="Minst 6 tegn"
                      required
                      disabled={message.type === 'success'}
                      minLength={6}
                    />
                  </div>
                </div>
                
                <div style={{ marginBottom: '28px' }}>
                  <label 
                    htmlFor="confirmPassword" 
                    style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#334155'
                    }}
                  >
                    Bekreft nytt passord
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
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                      placeholder="Gjenta nytt passord"
                      required
                      disabled={message.type === 'success'}
                      minLength={6}
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading || message.type === 'success'}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: (loading || message.type === 'success') ? 'not-allowed' : 'pointer',
                    opacity: (loading || message.type === 'success') ? 0.8 : 1,
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
                      Oppdaterer passord...
                    </>
                  ) : message.type === 'success' ? (
                    <>
                      <FaCheck />
                      Passord tilbakestilt
                    </>
                  ) : (
                    'Tilbakestill passord'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <FaExclamationCircle />
              <span>{message.text || 'Ugyldig eller utløpt tilbakestillingslenke. Vennligst be om en ny.'}</span>
            </div>
          )}
          
          <div style={{
            marginTop: '28px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '15px', color: '#334155', marginBottom: '20px' }}>
              <a href="/forgot-password" style={{ 
                color: '#0284c7', 
                textDecoration: 'none',
                fontWeight: '600'
              }}>
                Be om en ny tilbakestillingslenke
              </a>
            </p>
            
            <a 
              href="/login" 
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
              Tilbake til innlogging
            </a>
          </div>
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

export default ResetPassword;
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import { FaEnvelope, FaExclamationCircle, FaSpinner, FaCheck } from 'react-icons/fa';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const router = useRouter();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    if (!email) {
      setMessage({ type: 'error', text: 'Vennligst oppgi e-postadressen din' });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: data.message || 'Hvis e-postadressen finnes i systemet, vil du motta en e-post med instruksjoner for å tilbakestille passordet.'
        });
        setEmail('');
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || 'Kunne ikke sende tilbakestillingslenke. Vennligst prøv igjen senere.'
        });
      }
    } catch (error) {
      console.error('Error requesting password reset:', error);
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
        <title>Glemt passord | Laserkongen</title>
        <meta name="description" content="Tilbakestill passordet ditt for å få tilgang til Laserkongen kontoen din." />
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
          Glemt passordet ditt?
        </h1>
        <p style={{ 
          fontSize: isMobile ? '16px' : '18px', 
          maxWidth: '600px', 
          margin: '0 auto',
          opacity: '0.9'
        }}>
          Oppgi e-postadressen din, så sender vi deg en lenke for å tilbakestille passordet
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
            <div style={{ marginBottom: '28px' }}>
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
                  Sender...
                </>
              ) : (
                'Send tilbakestillingslenke'
              )}
            </button>
            
            <div style={{
              marginTop: '28px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '15px', color: '#334155', marginBottom: '20px' }}>
                Husker du passordet ditt? 
                <a href="/login" style={{ 
                  color: '#0284c7', 
                  textDecoration: 'none',
                  fontWeight: '600',
                  marginLeft: '6px'
                }}>
                  Logg inn
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

export default ForgotPassword;
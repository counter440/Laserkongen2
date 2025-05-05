import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../context/CartContext';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import Header from '../../components/Header';
import { FaMapMarkedAlt, FaMapPin, FaCity, FaGlobeEurope, FaSpinner, FaExclamationCircle, FaCheck, FaArrowLeft } from 'react-icons/fa';

// For debugging
const DEBUG = true;

const AddressPage = () => {
  const { user, updateProfile } = useAuth();
  const { cartItems } = useCart();
  const router = useRouter();
  const [windowWidth, setWindowWidth] = useState(null);
  
  const [street, setStreet] = useState(user?.address?.street || '');
  const [city, setCity] = useState(user?.address?.city || '');
  const [state, setState] = useState(user?.address?.state || '');
  const [postalCode, setPostalCode] = useState(user?.address?.postalCode || '');
  const [country, setCountry] = useState(user?.address?.country || 'Norge');
  const [phone, setPhone] = useState(user?.address?.phone || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
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
    setError('');
    setSuccess(false);
    
    try {
      setLoading(true);
      
      // Basic validation
      if (!street || !city || !postalCode || !country) {
        throw new Error('Vennligst fyll ut alle påkrevde felt');
      }
      
      if (DEBUG) {
        console.log('Submitting address with token:', user?.token?.substring(0, 20) + '...');
      }
      
      // Create the address object
      const addressData = {
        address: {
          street,
          city,
          state,
          postalCode,
          country,
          phone
        }
      };
      
      if (DEBUG) {
        console.log('Address data to send:', addressData);
      }
      
      // Call the updateProfile function with the new better error handling
      const result = await updateProfile(addressData);
      
      if (DEBUG) {
        console.log('Update profile result:', result);
      }
      
      if (!result || !result.success) {
        // Check if token expired or authentication failed
        if (result && result.tokenExpired) {
          // Redirect to login page
          console.log('Session expired, redirecting to login');
          setError('Økten din har utløpt. Du vil bli videresendt til innloggingssiden.');
          
          // Wait 2 seconds before redirecting to let the user see the message
          setTimeout(() => {
            router.push('/login');
          }, 2000);
          return;
        }
        
        // Handle HTML responses or other non-JSON responses
        if (result && result.error && result.error.includes('<!DOCTYPE')) {
          console.error('Received HTML response instead of JSON');
          setError('Serverfeil: Fikk uventet HTML-respons. Vennligst prøv igjen senere.');
          return;
        }
        
        // Use a safer approach to get the error message
        const errorMessage = result && result.error 
          ? result.error 
          : 'Kunne ikke oppdatere adresse. Vennligst prøv igjen senere.';
        
        setError(errorMessage);
        return;
      }
      
      setSuccess(true);
      
      // Force refresh user data from the server
      if (result.data) {
        console.log('Updating local user data with new data from server');
        console.log('New address data:', result.data.address);
      }
      
      // Reset the success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
      // Redirect back to account page after saving
      setTimeout(() => {
        if (success) {
          router.push('/account');
        }
      }, 1500);
    } catch (error) {
      console.error('Address update error:', error);
      setError(error.message || 'Kunne ikke oppdatere adresse');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
        <Head>
          <title>{user?.address ? 'Oppdater adresse' : 'Legg til adresse'} | Laserkongen</title>
          <meta name="description" content="Administrer leveringsadressen for din Laserkongen-konto." />
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
            {user?.address ? 'Oppdater leveringsadresse' : 'Legg til leveringsadresse'}
          </h1>
          <p style={{ 
            fontSize: isMobile ? '16px' : '18px', 
            maxWidth: '600px', 
            margin: '0 auto',
            opacity: '0.9'
          }}>
            Oppgi adressen hvor du ønsker å motta dine bestillinger
          </p>
        </div>

        <div style={{ 
          maxWidth: '600px',
          width: '100%',
          margin: '0 auto 60px',
          padding: isMobile ? '20px' : '0',
          position: 'relative',
          zIndex: '1'
        }}>
          <button
            onClick={() => router.push('/account')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: 'white',
              color: '#0284c7',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
              fontWeight: '500',
              fontSize: '15px',
              marginBottom: '16px',
              transition: 'all 0.2s ease'
            }}
          >
            <FaArrowLeft size={14} /> Tilbake til konto
          </button>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
            padding: isMobile ? '24px' : '40px',
            position: 'relative'
          }}>
            {error && (
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
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div style={{
                backgroundColor: '#d1fae5',
                color: '#065f46',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FaCheck />
                <span>Adressen din har blitt oppdatert</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label 
                  htmlFor="street" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#334155'
                  }}
                >
                  Gateadresse*
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
                    <FaMapMarkedAlt />
                  </div>
                  <input
                    type="text"
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
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
                    placeholder="Gatenavn og nummer"
                    required
                  />
                </div>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div>
                  <label 
                    htmlFor="postalCode" 
                    style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#334155'
                    }}
                  >
                    Postnummer*
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
                      <FaMapPin />
                    </div>
                    <input
                      type="text"
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
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
                      placeholder="f.eks. 0123"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label 
                    htmlFor="city" 
                    style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#334155'
                    }}
                  >
                    Sted*
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
                      <FaCity />
                    </div>
                    <input
                      type="text"
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
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
                      placeholder="f.eks. Oslo"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label 
                  htmlFor="state" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#334155'
                  }}
                >
                  Fylke (valgfritt)
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
                    <FaMapPin />
                  </div>
                  <input
                    type="text"
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
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
                    placeholder="f.eks. Oslo"
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label 
                  htmlFor="phone" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#334155'
                  }}
                >
                  Telefonnummer
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
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      fill="currentColor" 
                      viewBox="0 0 16 16"
                    >
                      <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
                    </svg>
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    placeholder="f.eks. 99999999"
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '28px' }}>
                <label 
                  htmlFor="country" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#334155'
                  }}
                >
                  Land*
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
                    <FaGlobeEurope />
                  </div>
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 14px 14px 44px',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      fontSize: '15px',
                      backgroundColor: '#f8fafc',
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                      appearance: 'none'
                    }}
                    required
                  >
                    <option value="Norge">Norge</option>
                    <option value="Sverige">Sverige</option>
                    <option value="Danmark">Danmark</option>
                    <option value="Finland">Finland</option>
                  </select>
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
                    Lagrer...
                  </>
                ) : (
                  'Lagre adresse'
                )}
              </button>
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
          
          input:focus, select:focus {
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
    </ProtectedRoute>
  );
};

export default AddressPage;
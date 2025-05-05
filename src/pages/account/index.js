import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../context/CartContext';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import Header from '../../components/Header';
import { FaUser, FaMapMarkerAlt, FaLink, FaShoppingBag, FaExclamationCircle, FaSpinner, FaSignOutAlt, FaArrowLeft, FaLock } from 'react-icons/fa';

const Account = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const [windowWidth, setWindowWidth] = useState(null);
  const [isManualLogout, setIsManualLogout] = useState(false);
  
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
    const fetchOrders = async () => {
      try {
        if (!user || !user.token) {
          console.error('No user or token available');
          setError('Authentication required');
          setLoading(false);
          return;
        }
        
        const response = await fetch('/api/orders/myorders', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        const data = await response.json();
        console.log('Orders API response:', data);

        if (!response.ok) {
          // Check if token is invalid/expired
          if (response.status === 401) {
            console.error('Authentication failed:', data.message);
            // If token expired, trigger logout to reset authentication
            if (data.tokenExpired) {
              logout();
              // Only show error if this wasn't a manual logout
              if (!isManualLogout) {
                setError('Din økt har utløpt. Vennligst logg inn på nytt.');
              }
            } else {
              setError('Autentisering mislyktes. Vennligst logg inn på nytt.');
            }
          } else {
            // Instead of throwing an error, just set the error state
            setError(data.message || 'Kunne ikke hente bestillinger');
          }
        } else {
          setOrders(data);
          // Clear any previous errors
          setError('');
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Kunne ikke laste ordrehistorikk. Vennligst prøv igjen senere.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user, logout]);

  const handleNavigate = (path) => {
    router.push(`/account/${path}`);
  };

  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
        <Head>
          <title>Min konto | Laserkongen</title>
          <meta name="description" content="Administrer din Laserkongen konto og se din ordrehistorikk." />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>

        <Header cartItemCount={cartItems.reduce((total, item) => total + item.quantity, 0)} />
        
        <div style={{ 
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', 
          padding: isMobile ? '40px 20px' : '60px 24px', 
          color: 'white',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            fontSize: isMobile ? '28px' : '36px', 
            fontWeight: '800', 
            marginBottom: '16px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            letterSpacing: '-0.025em'
          }}>
            Min konto
          </h1>
          <p style={{ 
            fontSize: isMobile ? '16px' : '18px', 
            maxWidth: '800px', 
            margin: '0 auto',
            opacity: '0.9'
          }}>
            Velkommen tilbake, {user?.name || 'bruker'}! Her finner du kontoinformasjon og ordrehistorikk.
          </p>
        </div>

        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: isMobile ? '20px' : '30px',
          marginTop: isMobile ? '-20px' : '-30px',
          position: 'relative',
          zIndex: 1 
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center',
            marginBottom: isMobile ? '20px' : '30px',
            gap: '12px'
          }}>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '10px 16px',
                backgroundColor: 'white',
                color: '#0284c7',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                fontWeight: '500',
                fontSize: '15px'
              }}
            >
              <FaArrowLeft size={14} /> Tilbake til butikk
            </button>
            
            <button
              onClick={() => {
                setIsManualLogout(true);
                logout();
              }}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)',
                fontWeight: '500',
                fontSize: '15px',
                transition: 'all 0.2s ease'
              }}
            >
              <FaSignOutAlt size={14} /> Logg ut
            </button>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
            gap: isMobile ? '16px' : '24px',
            marginBottom: isMobile ? '24px' : '36px'
          }}>
            {/* Account Info Card */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: isMobile ? '20px' : '25px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '18px'
              }}>
                <div style={{
                  backgroundColor: '#e0f2fe',
                  borderRadius: '10px',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7'
                }}>
                  <FaUser size={18} />
                </div>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: '700',
                  margin: '0',
                  color: '#0f172a',
                  letterSpacing: '-0.01em'
                }}>
                  Kontoopplysninger
                </h2>
              </div>
              
              <div style={{ 
                padding: '18px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ marginBottom: '14px' }}>
                  <p style={{ 
                    margin: '0', 
                    color: '#64748b', 
                    fontSize: '13px',
                    fontWeight: '500' 
                  }}>Navn</p>
                  <p style={{ 
                    margin: '4px 0 0 0', 
                    fontWeight: '600',
                    color: '#0f172a',
                    fontSize: '15px' 
                  }}>{user?.name || 'Ikke angitt'}</p>
                </div>
                
                <div>
                  <p style={{ 
                    margin: '0', 
                    color: '#64748b', 
                    fontSize: '13px',
                    fontWeight: '500' 
                  }}>E-post</p>
                  <p style={{ 
                    margin: '4px 0 0 0', 
                    fontWeight: '600',
                    color: '#0f172a',
                    fontSize: '15px' 
                  }}>{user?.email || 'Ikke angitt'}</p>
                </div>
              </div>
              
              <button
                onClick={() => handleNavigate('profile')}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  backgroundColor: '#f0f9ff',
                  color: '#0284c7',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '15px',
                  transition: 'all 0.2s ease'
                }}
              >
                Rediger profil
              </button>
            </div>
            
            {/* Address Card */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: isMobile ? '20px' : '25px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '18px'
              }}>
                <div style={{
                  backgroundColor: '#fef9c3',
                  borderRadius: '10px',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ca8a04'
                }}>
                  <FaMapMarkerAlt size={18} />
                </div>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: '700',
                  margin: '0',
                  color: '#0f172a',
                  letterSpacing: '-0.01em'
                }}>
                  Leveringsadresse
                </h2>
              </div>
              
              <div style={{ 
                padding: '18px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                marginBottom: '20px',
                minHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: user?.address ? 'flex-start' : 'center'
              }}>
                {user?.address && Object.keys(user.address).length > 0 ? (
                  <div>
                    <p style={{ 
                      margin: '0 0 4px 0',
                      fontWeight: '600',
                      color: '#0f172a',
                      fontSize: '15px' 
                    }}>{user.name}</p>
                    <p style={{ 
                      margin: '0 0 4px 0',
                      color: '#334155',
                      fontSize: '15px'
                    }}>{user.address.street || 'N/A'}</p>
                    <p style={{ 
                      margin: '0 0 4px 0',
                      color: '#334155',
                      fontSize: '15px'
                    }}>
                      {user.address.postalCode || ''} {user.address.city || ''}
                    </p>
                    <p style={{ 
                      margin: '0 0 4px 0',
                      color: '#334155',
                      fontSize: '15px'
                    }}>{user.address.country || 'Norge'}</p>
                    {user.address.phone && (
                      <p style={{ 
                        margin: '4px 0 0 0',
                        color: '#334155',
                        fontSize: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="14" 
                          height="14" 
                          fill="currentColor" 
                          viewBox="0 0 16 16"
                          style={{ color: '#64748b' }}
                        >
                          <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
                        </svg>
                        {user.address.phone}
                      </p>
                    )}
                  </div>
                ) : (
                  <p style={{ 
                    margin: '0',
                    color: '#64748b',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    fontSize: '15px'
                  }}>
                    Ingen adresse angitt
                  </p>
                )}
              </div>
              
              <button
                onClick={() => handleNavigate('address')}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  backgroundColor: '#fffbeb',
                  color: '#ca8a04',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '15px',
                  transition: 'all 0.2s ease'
                }}
              >
                {user?.address ? 'Oppdater adresse' : 'Legg til adresse'}
              </button>
            </div>
            
            {/* Quick Links Card */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: isMobile ? '20px' : '25px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '18px'
              }}>
                <div style={{
                  backgroundColor: '#f0fdf4',
                  borderRadius: '10px',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16a34a'
                }}>
                  <FaLink size={18} />
                </div>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: '700',
                  margin: '0',
                  color: '#0f172a',
                  letterSpacing: '-0.01em'
                }}>
                  Hurtiglenker
                </h2>
              </div>
              
              <ul style={{ 
                listStyle: 'none',
                padding: '0',
                margin: '0'
              }}>
                <li style={{ marginBottom: '12px' }}>
                  <a 
                    href="/account/orders" 
                    style={{ 
                      color: '#0284c7',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '14px',
                      backgroundColor: '#f0f9ff',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '15px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FaShoppingBag size={16} /> Ordrehistorikk
                  </a>
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <a 
                    href="/account/profile" 
                    style={{ 
                      color: '#0284c7',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '14px',
                      backgroundColor: '#f0f9ff',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '15px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FaUser size={16} /> Rediger profil
                  </a>
                </li>
                <li>
                  <a 
                    href="/account/password" 
                    style={{ 
                      color: '#0284c7',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '14px',
                      backgroundColor: '#f0f9ff',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '15px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FaLock size={16} /> Endre passord
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Recent Orders Section */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: isMobile ? '20px' : '25px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  backgroundColor: '#f0f9ff',
                  borderRadius: '10px',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7'
                }}>
                  <FaShoppingBag size={18} />
                </div>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: '700',
                  margin: '0',
                  color: '#0f172a',
                  letterSpacing: '-0.01em'
                }}>
                  Nylige bestillinger
                </h2>
              </div>
              
              <a 
                href="/account/orders" 
                style={{ 
                  color: '#0284c7',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  padding: '6px 12px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                Se alle bestillinger
              </a>
            </div>
            
            {loading ? (
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
                  Laster inn bestillinger...
                </p>
              </div>
            ) : error ? (
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#fee2e2', 
                color: '#b91c1c',
                borderRadius: '8px',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FaExclamationCircle size={18} />
                <span>{error}</span>
              </div>
            ) : orders.length === 0 ? (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                color: '#64748b',
                borderRadius: '8px',
                backgroundColor: '#f8fafc'
              }}>
                <p style={{ 
                  margin: '0 0 20px 0',
                  fontSize: '16px'
                }}>Du har ingen bestillinger ennå</p>
                <a 
                  href="/products" 
                  style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '15px',
                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FaShoppingBag size={14} /> Utforsk produkter
                </a>
              </div>
            ) : (
              <div>
                <div style={{ 
                  display: isMobile ? 'none' : 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  padding: '12px 16px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#64748b',
                  marginBottom: '12px'
                }}>
                  <div>Ordre ID</div>
                  <div>Dato</div>
                  <div>Status</div>
                  <div style={{ textAlign: 'right' }}>Sum</div>
                </div>
                
                {orders.slice(0, 5).map((order) => (
                  <div 
                    key={order.id} 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                      gridRowGap: isMobile ? '8px' : '0',
                      padding: '16px',
                      borderBottom: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      fontSize: '15px',
                      marginBottom: '8px',
                      backgroundColor: 'rgba(248, 250, 252, 0.5)'
                    }}
                  >
                    <div style={{ 
                      gridColumn: isMobile ? 'span 2' : 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600'
                    }}>
                      {isMobile && <span style={{ color: '#64748b', fontSize: '14px', minWidth: '70px' }}>Ordre ID:</span>}
                      <a 
                        href={`/account/orders/${order.id}`}
                        style={{ 
                          color: '#0284c7',
                          textDecoration: 'none',
                          fontWeight: '600'
                        }}
                      >
                        #{order.id || order._id}
                      </a>
                    </div>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {isMobile && <span style={{ color: '#64748b', fontSize: '14px', minWidth: '55px' }}>Dato:</span>}
                      {new Date(order.createdAt || order.created_at).toLocaleDateString('nb-NO')}
                    </div>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {isMobile && <span style={{ color: '#64748b', fontSize: '14px', minWidth: '55px' }}>Status:</span>}
                      <span style={{ 
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '13px',
                        fontWeight: '600',
                        backgroundColor: 
                          (order.status === 'delivered' || order.status === 'Levert') ? '#dcfce7' :
                          (order.status === 'shipped' || order.status === 'Sendt') ? '#e0f2fe' :
                          (order.status === 'processing' || order.status === 'Behandles') ? '#fef9c3' :
                          '#f3f4f6',
                        color: 
                          (order.status === 'delivered' || order.status === 'Levert') ? '#16a34a' :
                          (order.status === 'shipped' || order.status === 'Sendt') ? '#0284c7' :
                          (order.status === 'processing' || order.status === 'Behandles') ? '#ca8a04' :
                          '#64748b',
                      }}>
                        {order.status === 'pending' || order.status === 'Venter' ? 'Venter' :
                         order.status === 'processing' || order.status === 'Behandles' ? 'Behandles' :
                         order.status === 'shipped' || order.status === 'Sendt' ? 'Sendt' :
                         order.status === 'delivered' || order.status === 'Levert' ? 'Levert' :
                         order.status}
                      </span>
                    </div>
                    <div style={{ 
                      textAlign: isMobile ? 'left' : 'right',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600',
                      color: '#0f172a'
                    }}>
                      {isMobile && <span style={{ color: '#64748b', fontSize: '14px', minWidth: '55px' }}>Sum:</span>}
                      {parseFloat(order.totalPrice || order.total_price).toFixed(2)} kr
                    </div>
                  </div>
                ))}
              </div>
            )}
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
        
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 15px rgba(2, 132, 199, 0.3);
        }
        
        button:active:not(:disabled) {
          transform: translateY(0);
        }
        
        a:hover {
          filter: brightness(0.95);
        }
      `}</style>
    </ProtectedRoute>
  );
};

export default Account;
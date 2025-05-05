import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../context/CartContext';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import Header from '../../components/Header';
import { FaShoppingBag, FaArrowLeft, FaExclamationCircle, FaSpinner } from 'react-icons/fa';

const OrdersPage = () => {
  const { user } = useAuth();
  const { cartItems } = useCart();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
  // Handle responsive layout
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
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders/myorders', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        const data = await response.json();
        console.log('Orders page API response:', data);

        if (!response.ok) {
          // Check if token is invalid/expired
          if (response.status === 401) {
            console.error('Authentication failed:', data.message);
            setError('Autentisering mislyktes. Vennligst logg inn på nytt.');
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
    }
  }, [user]);
  
  // Global styles
  const globalStyles = `
    html, body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, 
        Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #f9fafb;
      color: #1f2937;
    }
    
    * {
      box-sizing: border-box;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  
  const formatPrice = (price) => {
    try {
      return `kr ${parseFloat(price).toFixed(2)}`;
    } catch (e) {
      return `kr ${price || 0}`;
    }
  };
  
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('no-NO', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };
  
  return (
    <ProtectedRoute>
      <>
        <style jsx global>{globalStyles}</style>
        <Head>
          <title>Ordrehistorikk | Laserkongen</title>
          <meta name="description" content="Se dine tidligere bestillinger hos Laserkongen." />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>

        <Header cartItemCount={cartItems.reduce((total, item) => total + item.quantity, 0)} />
        
        {/* Main container */}
        <div style={{ 
          maxWidth: '1000px', 
          margin: '2rem auto', 
          padding: '0 1rem' 
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '2rem',
            alignItems: 'center'
          }}>
            <h1 style={{ 
              fontSize: isMobile ? '1.5rem' : '1.75rem', 
              marginBottom: '0.5rem', 
              color: '#1f2937',
              fontWeight: '600',
              margin: 0
            }}>
              Ordrehistorikk
            </h1>
            
            <Link href="/account" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              padding: '0.625rem 1rem',
              textDecoration: 'none',
              color: '#4b5563',
              fontSize: '0.875rem',
              fontWeight: '500',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <FaArrowLeft style={{ fontSize: '0.75rem' }} /> Tilbake til konto
            </Link>
          </div>
          
          {/* Orders content */}
          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '200px', 
              flexDirection: 'column',
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                border: '4px solid #e2e8f0', 
                borderLeftColor: '#3b82f6', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ marginTop: '1rem', color: '#6b7280' }}>Laster ordrehistorikk...</p>
            </div>
          ) : error ? (
            <div style={{ 
              padding: '1.5rem', 
              backgroundColor: '#fee2e2', 
              color: '#b91c1c',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <FaExclamationCircle size={20} />
              <span>{error}</span>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ 
              padding: '3rem 2rem', 
              textAlign: 'center', 
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}>
              <p style={{ 
                fontSize: '1rem', 
                color: '#6b7280',
                marginBottom: '1.5rem'
              }}>
                Du har ingen bestillinger ennå
              </p>
              <Link href="/shop" style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#1d4ed8',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                textDecoration: 'none',
                fontWeight: '500',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}>
                <FaShoppingBag style={{ fontSize: '0.875rem' }} /> Utforsk produkter
              </Link>
            </div>
          ) : (
            <div>
              {/* Orders list */}
              {orders.map((order) => (
                <div key={order.id || order._id} style={{ 
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  backgroundColor: 'white',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  marginBottom: '1rem'
                }}>
                  {/* Order header */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '1rem 1.25rem',
                    backgroundColor: '#f9fafb',
                    borderBottom: '1px solid #e5e7eb',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h2 style={{ 
                        fontSize: '1rem', 
                        margin: 0,
                        fontWeight: '600'
                      }}>
                        Ordre #{order.id || order._id}
                      </h2>
                      <p style={{ 
                        margin: '0.25rem 0 0 0', 
                        fontSize: '0.875rem', 
                        color: '#6b7280' 
                      }}>
                        {formatDate(order.createdAt || order.created_at)}
                      </p>
                    </div>
                    <div>
                      <span style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.25rem 0.625rem',
                        backgroundColor: 
                          (order.status === 'delivered' || order.status === 'Levert') ? '#dcfce7' : 
                          (order.status === 'shipped' || order.status === 'Sendt') ? '#e0e7ff' : 
                          (order.status === 'processing' || order.status === 'Behandles') ? '#dbeafe' : '#fef3c7',
                        color: 
                          (order.status === 'delivered' || order.status === 'Levert') ? '#166534' : 
                          (order.status === 'shipped' || order.status === 'Sendt') ? '#3730a3' : 
                          (order.status === 'processing' || order.status === 'Behandles') ? '#1e40af' : '#92400e',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {order.status === 'delivered' || order.status === 'Levert' ? 'Levert' :
                         order.status === 'shipped' || order.status === 'Sendt' ? 'Sendt' :
                         order.status === 'processing' || order.status === 'Behandles' ? 'Behandles' : 'Venter'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Order content */}
                  <div style={{ 
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '1.25rem',
                    alignItems: isMobile ? 'stretch' : 'center'
                  }}>
                    {/* Order items preview */}
                    <div style={{ 
                      flex: '1', 
                      display: 'flex',
                      gap: '1rem'
                    }}>
                      {order.orderItems && order.orderItems.length > 0 ? (
                        <>
                          <div style={{ 
                            width: '60px', 
                            height: '60px', 
                            backgroundColor: '#f3f4f6',
                            borderRadius: '0.375rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {order.orderItems[0].image ? (
                              <img 
                                src={order.orderItems[0].image}
                                alt={order.orderItems[0].name}
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover', 
                                  borderRadius: '0.375rem',
                                  border: '1px solid #e5e7eb'
                                }}
                                onError={(e) => {
                                  // Try different fallback sources in order of preference
                                  const fallbacks = [];
                                  
                                  // 1. Custom options fileUrl from database
                                  if (order.orderItems[0].customOptions && order.orderItems[0].customOptions.fileUrl) {
                                    fallbacks.push(order.orderItems[0].customOptions.fileUrl);
                                  }
                                  
                                  // 2. Default images
                                  fallbacks.push('/images/placeholder-product.jpg');
                                  
                                  // Try the first fallback that hasn't been tried yet
                                  const currentSrc = e.target.src;
                                  const nextFallback = fallbacks.find(src => src !== currentSrc);
                                  
                                  if (nextFallback) {
                                    e.target.src = nextFallback;
                                  } else {
                                    // If no fallback, show placeholder div
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerHTML = `
                                      <div style="
                                        width: 100%; 
                                        height: 100%; 
                                        background-color: #e2e8f0;
                                        border-radius: 0.375rem;
                                        border: 1px solid #e5e7eb;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        color: #64748b;
                                        font-size: 0.75rem;
                                        font-weight: 500
                                      ">
                                        ${order.orderItems[0].customOptions?.type === '3d-printing' ? '3D' : 'LASER'}
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '100%', 
                                  height: '100%', 
                                  backgroundColor: '#e2e8f0',
                                  borderRadius: '0.375rem',
                                  border: '1px solid #e5e7eb',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#64748b',
                                  fontSize: '0.75rem',
                                  fontWeight: '500'
                                }}
                              >
                                {order.orderItems[0].customOptions?.type === '3d-printing' ? '3D' : 'LASER'}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 style={{
                              margin: '0 0 0.25rem 0',
                              fontSize: '0.9375rem',
                              fontWeight: '500',
                              color: '#1f2937'
                            }}>
                              {order.orderItems[0].name}
                            </h3>
                            {order.orderItems.length > 1 && (
                              <p style={{ 
                                margin: '0',
                                fontSize: '0.875rem',
                                color: '#6b7280'
                              }}>
                                + {order.orderItems.length - 1} flere varer
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <p style={{ margin: 0, color: '#6b7280' }}>
                          Ingen varer
                        </p>
                      )}
                    </div>
                    
                    {/* Order total and details button */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1rem',
                      marginLeft: isMobile ? '0' : 'auto'
                    }}>
                      <div style={{ 
                        textAlign: isMobile ? 'left' : 'right',
                        minWidth: '100px'
                      }}>
                        <div style={{ 
                          fontSize: '1rem', 
                          fontWeight: '600', 
                          color: '#1f2937'
                        }}>
                          {formatPrice(order.totalPrice || order.total_price)}
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => router.push(`/account/orders/${order.id || order._id}`)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          backgroundColor: '#1d4ed8',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        Se detaljer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    </ProtectedRoute>
  );
};

export default OrdersPage;
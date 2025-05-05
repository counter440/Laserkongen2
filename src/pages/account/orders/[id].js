import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../context/CartContext';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import Header from '../../../components/Header';
import { FaArrowLeft, FaCheck, FaSpinner, FaPrint } from 'react-icons/fa';

const OrderDetailsPage = () => {
  const { user } = useAuth();
  const { cartItems } = useCart();
  const router = useRouter();
  const { id } = router.query;
  
  const [order, setOrder] = useState(null);
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
    const fetchOrderDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        const response = await fetch(`/api/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch order details');
        }

        setOrder(data);
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (user && id) {
      fetchOrderDetails();
    }
  }, [id, user]);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('no-NO', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };
  
  const formatPrice = (price) => {
    try {
      return `kr ${parseFloat(price).toFixed(2)}`;
    } catch (e) {
      return `kr ${price || 0}`;
    }
  };
  
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
  
  if (loading) {
    return (
      <ProtectedRoute>
        <>
          <style jsx global>{globalStyles}</style>
          <Header cartItemCount={cartItems.reduce((total, item) => total + item.quantity, 0)} />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh', 
            flexDirection: 'column'
          }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              border: '4px solid #e2e8f0', 
              borderLeftColor: '#3b82f6', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ marginTop: '1rem', color: '#6b7280' }}>Laster ordredetaljer...</p>
          </div>
        </>
      </ProtectedRoute>
    );
  }
  
  if (error || !order) {
    return (
      <ProtectedRoute>
        <>
          <style jsx global>{globalStyles}</style>
          <Header cartItemCount={cartItems.reduce((total, item) => total + item.quantity, 0)} />
          <div style={{ 
            maxWidth: '800px', 
            margin: '5rem auto', 
            padding: '2rem', 
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
          }}>
            <h1 style={{ fontSize: '1.5rem', color: '#ef4444', marginBottom: '1rem' }}>
              {error || 'Ordre ikke funnet'}
            </h1>
            <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
              Vi kunne ikke finne ordren du leter etter. Vennligst sjekk ordre-ID eller kontakt kundeservice.
            </p>
            <Link href="/account/orders" style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#1d4ed8',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.25rem',
              textDecoration: 'none',
              fontWeight: '500',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <FaArrowLeft style={{ fontSize: '0.75rem' }} /> Tilbake til ordrehistorikk
            </Link>
          </div>
        </>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute>
      <>
        <style jsx global>{globalStyles}</style>
        <Head>
          <title>Ordredetaljer | Laserkongen</title>
          <meta name="description" content="Se detaljer for din bestilling hos Laserkongen." />
        </Head>
        
        <Header cartItemCount={cartItems.reduce((total, item) => total + item.quantity, 0)} />
        
        {/* Order details */}
        <div style={{ 
          maxWidth: '800px', 
          margin: '2rem auto', 
          padding: '0 1rem' 
        }}>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '2rem',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h1 style={{ 
                  fontSize: '1.5rem', 
                  margin: 0,
                  color: '#1f2937',
                  fontWeight: '600'
                }}>Ordre #{order.id || order._id}</h1>
                
                <span style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.25rem 0.625rem',
                  backgroundColor: 
                    order.status === 'delivered' ? '#dcfce7' : 
                    order.status === 'shipped' ? '#e0e7ff' : 
                    order.status === 'processing' ? '#dbeafe' : '#fef3c7',
                  color: 
                    order.status === 'delivered' ? '#166534' : 
                    order.status === 'shipped' ? '#3730a3' : 
                    order.status === 'processing' ? '#1e40af' : '#92400e',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  {order.status === 'delivered' ? 'Levert' :
                   order.status === 'shipped' ? 'Sendt' :
                   order.status === 'processing' ? 'Behandles' : 'Venter'}
                </span>
              </div>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Plassert {order.createdAt ? formatDate(order.createdAt) : 
                          (order.created_at ? formatDate(order.created_at) : 'N/A')}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => router.push('/account/orders')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  padding: '0.625rem 1rem',
                  cursor: 'pointer',
                  color: '#4b5563',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              >
                <FaArrowLeft style={{ fontSize: '0.75rem' }} /> Tilbake
              </button>
              
              <button 
                onClick={() => window.print()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  padding: '0.625rem 1rem',
                  cursor: 'pointer',
                  color: '#4b5563',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              >
                <FaPrint /> Skriv ut kvittering
              </button>
            </div>
          </div>
          
          {/* Order details */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', 
            gap: '2rem'
          }}>
            {/* Left column - Items */}
            <div>
              <h2 style={{ 
                fontSize: '1.25rem', 
                marginBottom: '1rem', 
                fontWeight: '600',
                color: '#1f2937'
              }}>Ordrevarer</h2>
              
              <div style={{ 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                backgroundColor: 'white',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}>
                {/* Items header */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '3fr 1fr 1fr', 
                  gap: '1rem', 
                  padding: '0.75rem 1rem', 
                  backgroundColor: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb',
                  color: '#6b7280',
                  fontWeight: '500',
                  fontSize: '0.875rem'
                }}>
                  <div>Produkt</div>
                  <div style={{ textAlign: 'center' }}>Antall</div>
                  <div style={{ textAlign: 'right' }}>Pris</div>
                </div>
                
                {/* Items list */}
                {order.orderItems && order.orderItems.length > 0 ? (
                  order.orderItems.map((item, index) => (
                    <div key={index} style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '3fr 1fr 1fr', 
                      gap: '1rem', 
                      padding: '1rem', 
                      borderBottom: index < order.orderItems.length - 1 ? '1px solid #e5e7eb' : 'none',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                          {/* Render product image with fallback to custom thumbnail */}
                          {item.image ? (
                            <img 
                              src={item.image}
                              alt={item.name}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover', 
                                borderRadius: '0.375rem',
                                border: '1px solid #e5e7eb'
                              }}
                              onError={(e) => {
                                console.log("Image error, trying fallback for:", e.target.src);
                                
                                // Try different fallback sources in order of preference
                                const fallbacks = [];
                                
                                // 1. Use the custom thumbnail (from our backend change)
                                if (item.customThumbnail) {
                                  fallbacks.push(item.customThumbnail);
                                }
                                
                                // 2. Custom options fileUrl from database
                                if (item.customOptions && item.customOptions.fileUrl) {
                                  fallbacks.push(item.customOptions.fileUrl);
                                }
                                
                                // 3. Custom options fileData (data URL)
                                if (item.customOptions && item.customOptions.fileData && 
                                    item.customOptions.fileData.startsWith('data:')) {
                                  fallbacks.push(item.customOptions.fileData);
                                }
                                
                                // 4. Check localStorage for saved preview
                                const savedPreview = localStorage.getItem('lastModelPreview');
                                if (savedPreview) {
                                  fallbacks.push(savedPreview);
                                }
                                
                                // 5. Default image
                                fallbacks.push('/images/placeholder-product.jpg');
                                
                                console.log(`Found ${fallbacks.length} fallback options`);
                                
                                // Try the first fallback that hasn't been tried yet
                                const currentSrc = e.target.src;
                                const nextFallback = fallbacks.find(src => src !== currentSrc);
                                
                                if (nextFallback) {
                                  console.log("Trying fallback:", nextFallback.substring(0, 30) + '...');
                                  e.target.src = nextFallback;
                                } else {
                                  // If no data URL, show placeholder div
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
                                      ${item.customOptions?.type === '3d-printing' ? '3D' : 'LASER'}
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
                              {item.customOptions?.type === '3d-printing' ? '3D' : 'LASER'}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 style={{ 
                            margin: '0 0 0.25rem 0', 
                            fontWeight: '500',
                            color: '#1f2937',
                            fontSize: '0.9375rem'
                          }}>{item.name}</h3>
                          {item.customOptions && Object.keys(item.customOptions).length > 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              {item.customOptions.material && (
                                <p style={{ margin: '0 0 0.125rem 0' }}>Materiale: {item.customOptions.material}</p>
                              )}
                              {item.customOptions.color && (
                                <p style={{ margin: 0 }}>Farge: {item.customOptions.color}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'center', color: '#4b5563' }}>
                        {item.quantity || item.qty}
                      </div>
                      
                      <div style={{ textAlign: 'right', fontWeight: '500', color: '#1f2937' }}>
                        {formatPrice((item.price) * (item.quantity || item.qty))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ 
                    padding: '2rem', 
                    textAlign: 'center', 
                    color: '#6b7280',
                    backgroundColor: 'white'
                  }}>
                    <p style={{ margin: 0 }}>Ingen varer funnet i denne ordren.</p>
                  </div>
                )}
              </div>
              
              <div style={{ marginTop: '2rem' }}>
                <h2 style={{ 
                  fontSize: '1.25rem', 
                  marginBottom: '1rem', 
                  fontWeight: '600',
                  color: '#1f2937'
                }}>Betalingsinformasjon</h2>
                
                <div style={{ 
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '1.25rem',
                  backgroundColor: 'white',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: '500', color: '#4b5563' }}>Betalingsmåte: </span>
                    <span style={{ color: '#1f2937' }}>{order.paymentMethod ? (
                      typeof order.paymentMethod === 'string' ? 
                        `${order.paymentMethod.charAt(0).toUpperCase()}${order.paymentMethod.slice(1).replace('-', ' ')}` : 
                        'Card'
                    ) : 'N/A'}</span>
                  </div>
                  
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: '500', color: '#4b5563' }}>Betalingsstatus: </span>
                    <span style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.25rem 0.625rem',
                      backgroundColor: order.isPaid ? '#dcfce7' : '#fee2e2',
                      color: order.isPaid ? '#166534' : '#b91c1c',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {order.isPaid ? 'Betalt' : 'Ikke betalt'}
                    </span>
                  </div>
                  
                  {order.paidAt && (
                    <div>
                      <span style={{ fontWeight: '500', color: '#4b5563' }}>Betalingsdato: </span>
                      <span style={{ color: '#1f2937' }}>{formatDate(order.paidAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right column - Summary & Shipping */}
            <div>
              <h2 style={{ 
                fontSize: '1.25rem', 
                marginBottom: '1rem', 
                fontWeight: '600',
                color: '#1f2937'
              }}>Ordresammendrag</h2>
              
              <div style={{ 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                marginBottom: '2rem',
                backgroundColor: 'white',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ color: '#6b7280' }}>Delsum</span>
                    <span style={{ color: '#1f2937' }}>{formatPrice(order.itemsPrice || 0)}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ color: '#6b7280' }}>Moms (25%)</span>
                    <span style={{ color: '#1f2937' }}>{formatPrice(order.taxPrice || (order.itemsPrice ? order.itemsPrice * 0.25 : 0))}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Frakt</span>
                    <span style={{ color: '#1f2937' }}>{formatPrice(order.shippingPrice || 0)}</span>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontWeight: 'bold',
                  fontSize: '1.125rem'
                }}>
                  <span style={{ color: '#1f2937' }}>Totalt</span>
                  <span style={{ color: '#1f2937' }}>{formatPrice(order.totalPrice || (order.itemsPrice ? order.itemsPrice * 1.25 : 0))}</span>
                </div>
              </div>
              
              <h2 style={{ 
                fontSize: '1.25rem', 
                marginBottom: '1rem', 
                fontWeight: '600',
                color: '#1f2937'
              }}>Leveringsinformasjon</h2>
              
              <div style={{ 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                backgroundColor: 'white',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}>
                {order.shippingAddress && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ 
                      marginTop: 0,
                      marginBottom: '0.5rem', 
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>{order.shippingAddress.fullName || order.shippingAddress.name}</p>
                    <p style={{ marginTop: 0, marginBottom: '0.25rem', color: '#4b5563' }}>
                      {order.shippingAddress.address || order.shippingAddress.street}
                    </p>
                    <p style={{ marginTop: 0, marginBottom: '0.25rem', color: '#4b5563' }}>
                      {order.shippingAddress.postalCode} {order.shippingAddress.city}
                    </p>
                    <p style={{ marginTop: 0, marginBottom: '0.75rem', color: '#4b5563' }}>
                      {order.shippingAddress.country}
                    </p>
                    
                    {(order.shippingAddress.phone) && (
                      <p style={{ marginTop: 0, marginBottom: '0.25rem', color: '#4b5563' }}>
                        <span style={{ color: '#6b7280' }}>Telefon: </span>
                        {order.shippingAddress.phone}
                      </p>
                    )}
                    
                    <p style={{ marginTop: 0, marginBottom: 0, color: '#4b5563' }}>
                      <span style={{ color: '#6b7280' }}>E-post: </span>
                      {order.shippingAddress.email}
                    </p>
                  </div>
                )}
                
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500', color: '#4b5563' }}>Ordrestatus:</span>
                    <span style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.25rem 0.625rem',
                      backgroundColor: 
                        order.status === 'delivered' ? '#dcfce7' : 
                        order.status === 'shipped' ? '#e0e7ff' : 
                        order.status === 'processing' ? '#dbeafe' : '#fef3c7',
                      color: 
                        order.status === 'delivered' ? '#166534' : 
                        order.status === 'shipped' ? '#3730a3' : 
                        order.status === 'processing' ? '#1e40af' : '#92400e',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {order.status === 'delivered' ? 'Levert' :
                       order.status === 'shipped' ? 'Sendt' :
                       order.status === 'processing' ? 'Behandles' : 'Venter'}
                    </span>
                  </div>
                  
                  {order.trackingNumber && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: '500', color: '#4b5563' }}>Sporingsnummer:</span>
                      <span style={{ color: '#1f2937' }}>{order.trackingNumber}</span>
                    </div>
                  )}
                  
                  {order.estimatedDeliveryDate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '500', color: '#4b5563' }}>Estimert levering:</span>
                      <span style={{ color: '#1f2937' }}>{formatDate(order.estimatedDeliveryDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    </ProtectedRoute>
  );
};

export default OrderDetailsPage;
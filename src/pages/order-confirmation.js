import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaCheck, FaSpinner, FaPrint, FaArrowLeft } from 'react-icons/fa';
import Header from '../components/Header';

const OrderConfirmation = () => {
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
    // Try to get order from localStorage first (for demo purposes)
    const storedOrder = localStorage.getItem('lastOrder');
    
    if (storedOrder) {
      try {
        const parsedOrder = JSON.parse(storedOrder);
        setOrder(parsedOrder);
        setLoading(false);
        
        // If we also have an ID, try to fetch fresh data but don't block UI
        if (id) {
          fetchOrder(id, false);
        }
      } catch (err) {
        console.error('Error parsing stored order:', err);
        // If localStorage parse fails but we have an ID, try API
        if (id) {
          fetchOrder(id);
        } else {
          setError('Invalid order data. Please check your order ID.');
          setLoading(false);
        }
      }
    } else if (id) {
      // No stored order but we have an ID
      fetchOrder(id);
    } else {
      // No ID and no stored order - show error
      setError('Order not found. Please check your order ID.');
      setLoading(false);
    }
  }, [id]);
  
  const fetchOrder = async (orderId, showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }
    
    try {
      console.log(`Fetching order with ID: ${orderId}`);
      const response = await fetch(`/api/orders/${orderId}`);
      
      // Create default placeholder data
      const defaultOrderData = {
        id: orderId,
        status: 'pending',
        orderItems: [],
        shippingAddress: {},
        itemsPrice: 0,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: 0,
        paymentMethod: 'card',
        isPaid: false
      };
      
      // Try to parse the response as JSON
      let orderData = defaultOrderData;
      try {
        const responseData = await response.json();
        
        // Check if response was successful
        if (!response.ok) {
          console.error('Order fetch error response:', responseData);
          // Don't throw here, just log the error and continue with default data
          if (showLoader) {
            setError(responseData.message || 'Order not found. Please check your order ID.');
          }
        } else {
          // If we got valid data, use it
          console.log('Order fetched successfully:', responseData);
          orderData = {
            ...defaultOrderData,
            ...responseData
          };
        }
      } catch (jsonError) {
        console.error('Error parsing response:', jsonError);
        if (showLoader) {
          setError('Error loading order details. Invalid response format.');
        }
      }
      
      // Always set some order data, even if it's just the default placeholder
      setOrder(orderData);
    } catch (err) {
      console.error('Error fetching order:', err);
      if (showLoader) {
        setError('Error loading order details. Please try again later.');
      }
    } finally {
      // Always reset loading state
      if (showLoader) {
        setLoading(false);
      }
    }
  };
  
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
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
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
      <>
        <style jsx global>{globalStyles}</style>
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
    );
  }
  
  if (error || !order) {
    return (
      <>
        <style jsx global>{globalStyles}</style>
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
          <Link href="/shop" style={{ 
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
            <FaArrowLeft style={{ fontSize: '0.75rem' }} /> Tilbake til butikken
          </Link>
        </div>
      </>
    );
  }
  
  return (
    <>
      <style jsx global>{globalStyles}</style>
      <Head>
        <title>Ordrebekreftelse | Laserkongen</title>
        <meta name="description" content="Din ordrebekreftelse" />
      </Head>
      
      <Header />
      
      {/* Order confirmation */}
      <div style={{ 
        maxWidth: '800px', 
        margin: '2rem auto', 
        padding: '0 1rem' 
      }}>
        <div style={{ 
          backgroundColor: '#dcfce7', 
          color: '#166534',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          border: '1px solid #bbf7d0'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '50%', 
            width: '40px', 
            height: '40px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#22c55e'
          }}>
            <FaCheck style={{ fontSize: '1.25rem' }} />
          </div>
          <div>
            <h2 style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '1.25rem' }}>Ordre bekreftet!</h2>
            <p style={{ margin: 0 }}>Takk for ditt kjøp. Vi behandler din ordre.</p>
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '2rem',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '1.5rem', 
              marginBottom: '0.5rem', 
              color: '#1f2937',
              fontWeight: '600'
            }}>Ordre #{order.id || order._id}</h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Plassert {order.createdAt ? formatDate(order.createdAt) : 
                        (order.created_at ? formatDate(order.created_at) : 'N/A')}
            </p>
          </div>
          
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
                        {/* Render image with multiple fallback options */}
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
                              
                              // 1. Custom options fileUrl from database
                              if (item.customOptions && item.customOptions.fileUrl) {
                                fallbacks.push(item.customOptions.fileUrl);
                              }
                              
                              // 2. Custom options fileData (data URL)
                              if (item.customOptions && item.customOptions.fileData && 
                                  item.customOptions.fileData.startsWith('data:')) {
                                fallbacks.push(item.customOptions.fileData);
                              }
                              
                              // 3. Check localStorage for saved preview
                              const savedPreview = localStorage.getItem('lastModelPreview');
                              if (savedPreview) {
                                fallbacks.push(savedPreview);
                              }
                              
                              // 4. Default image
                              fallbacks.push('/images/phone-stand.jpg');
                              
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
                                    backgroundColor: #e2e8f0;
                                    borderRadius: 0.375rem;
                                    border: 1px solid #e5e7eb;
                                    display: flex;
                                    alignItems: center;
                                    justifyContent: center;
                                    color: #64748b;
                                    fontSize: 0.75rem;
                                    fontWeight: 500
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
                      {item.quantity}
                    </div>
                    
                    <div style={{ textAlign: 'right', fontWeight: '500', color: '#1f2937' }}>
                      {formatPrice(item.price * item.quantity)}
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
                  }}>{order.shippingAddress.fullName}</p>
                  <p style={{ marginTop: 0, marginBottom: '0.25rem', color: '#4b5563' }}>{order.shippingAddress.address}</p>
                  <p style={{ marginTop: 0, marginBottom: '0.25rem', color: '#4b5563' }}>
                    {order.shippingAddress.postalCode} {order.shippingAddress.city}
                  </p>
                  <p style={{ marginTop: 0, marginBottom: '0.75rem', color: '#4b5563' }}>{order.shippingAddress.country}</p>
                  
                  {order.shippingAddress.phone && (
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
        
        {/* Actions */}
        <div style={{ 
          marginTop: '3rem', 
          textAlign: 'center', 
          borderTop: '1px solid #e5e7eb', 
          paddingTop: '2rem' 
        }}>
          <p style={{ 
            marginTop: 0,
            marginBottom: '1.5rem', 
            color: '#6b7280' 
          }}>
            Hvis du har spørsmål om din ordre, vennligst kontakt kundeservice.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
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
              Fortsett å handle
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderConfirmation;
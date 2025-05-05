import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaTrashAlt, FaArrowLeft, FaExclamationCircle, FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';

const Cart = () => {
  const router = useRouter();
  const { cartItems, cartTotal, updateCartQuantity, removeFromCart, clearCart, debugCart, isInitialized } = useCart();
  const [error, setError] = useState('');
  const [localCartItems, setLocalCartItems] = useState([]);
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
  
  // Debug cart on mount
  useEffect(() => {
    if (isInitialized) {
      const cartInfo = debugCart();
      console.log('Cart debug info:', cartInfo);
      setLocalCartItems(cartItems);
    }
  }, [debugCart, isInitialized, cartItems]);

  const formatPrice = (price) => {
    return `kr ${parseFloat(price).toFixed(2)}`;
  };

  const handleQuantityChange = (itemId, newQuantity, customOptions) => {
    if (newQuantity < 1) newQuantity = 1;
    updateCartQuantity(itemId, newQuantity, customOptions);
  };

  const handleRemoveItem = (itemId, customOptions) => {
    removeFromCart(itemId, customOptions);
  };

  const handleCheckout = () => {
    // For now, redirect to the checkout page
    router.push('/checkout');
  };

  return (
    <div>
      <Head>
        <title>Handlekurv | Laserkongen</title>
        <meta name="description" content="Se dine varer i handlekurven" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <Header cartItemCount={cartItems.reduce((total, item) => total + item.quantity, 0)} />
      
      {/* Back button */}
      <div style={{ maxWidth: '1200px', margin: '1rem auto', padding: '0 ' + (isMobile ? '1rem' : '1rem') }}>
        <Link href="/shop" style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#64748b',
          textDecoration: 'none',
          padding: '0.5rem'
        }}>
          <FaArrowLeft /> Fortsett å handle
        </Link>
      </div>
      
      {/* Main content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 ' + (isMobile ? '1rem' : '1rem') + ' 3rem' }}>
        <h1 style={{ 
          fontSize: isMobile ? '1.75rem' : '2.25rem', 
          marginBottom: isMobile ? '1.5rem' : '2rem',
          fontWeight: '800',
          letterSpacing: '-0.025em',
          fontFamily: "'Outfit', sans-serif",
          color: '#0f172a'
        }}>Handlekurv</h1>
        
        {!isInitialized && (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            color: '#64748b'
          }}>
            Laster handlekurv...
          </div>
        )}
        
        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            color: '#b91c1c',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <FaExclamationCircle />
            {error}
          </div>
        )}
        
        {isInitialized && cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <FaShoppingCart style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }} />
            <p style={{ marginBottom: '1.5rem' }}>Handlekurven din er tom</p>
            <Link href="/shop" style={{ 
              display: 'inline-block',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
              transition: 'all 0.2s ease'
            }}>
              Se produkter
            </Link>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '3fr 1fr', 
            gap: isMobile ? '1.5rem' : '2rem' 
          }}>
            {/* Cart items */}
            <div>
              {/* Cart header - hide on mobile */}
              {!isMobile && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '3fr 1fr 1fr 1fr auto', 
                  gap: '1rem', 
                  padding: '0.85rem 0', 
                  borderBottom: '1px solid #e2e8f0',
                  color: '#475569',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  fontFamily: "'Outfit', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <div>Produkt</div>
                  <div style={{ textAlign: 'center' }}>Pris</div>
                  <div style={{ textAlign: 'center' }}>Antall</div>
                  <div style={{ textAlign: 'right' }}>Sum</div>
                  <div></div>
                </div>
              )}
              
              {/* Cart items */}
              {cartItems.map((item, index) => (
                <div key={`${item.id}-${JSON.stringify(item.customOptions)}`} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : '3fr 1fr 1fr 1fr auto', 
                  gap: isMobile ? '0.75rem' : '1rem', 
                  padding: isMobile ? '1rem 0' : '1.5rem 0', 
                  borderBottom: '1px solid #e2e8f0',
                  alignItems: 'center'
                }}>
                  {/* Product */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: isMobile ? 'flex-start' : 'center',
                    gap: isMobile ? '0.875rem' : '1.25rem'
                  }}>
                    <div style={{ 
                      width: isMobile ? '80px' : '90px', 
                      height: isMobile ? '80px' : '90px', 
                      flexShrink: 0
                    }}>
                      <img 
                        src={item.image || '/placeholder-product.jpg'} 
                        alt={item.name}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover', 
                          borderRadius: '0.75rem',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                        }}
                      />
                    </div>
                    <div>
                      <h3 style={{ 
                        marginBottom: '0.35rem',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: isMobile ? '1rem' : '1.1rem',
                        fontWeight: '600',
                        color: '#0f172a',
                        letterSpacing: '-0.01em'
                      }}>{item.name}</h3>
                      {Object.keys(item.customOptions).length > 0 && (
                        <div style={{ 
                          fontSize: isMobile ? '0.8125rem' : '0.875rem', 
                          color: '#64748b',
                          fontFamily: "'Outfit', sans-serif", 
                        }}>
                          {item.customOptions.material && (
                            <p style={{ 
                              marginBottom: '0.2rem',
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              gap: '0.3rem' 
                            }}>
                              <span style={{ fontWeight: '600', color: '#475569' }}>Materiale:</span> {item.customOptions.material}
                            </p>
                          )}
                          {item.customOptions.color && (
                            <p style={{ 
                              marginBottom: '0.2rem',
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              gap: '0.3rem'  
                            }}>
                              <span style={{ fontWeight: '600', color: '#475569' }}>Farge:</span> {item.customOptions.color}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Mobile-only price and remove button */}
                      {isMobile && (
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginTop: '0.75rem'
                        }}>
                          <span style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: '700',
                            fontSize: '1rem',
                            color: '#0284c7'
                          }}>
                            {formatPrice(item.price)}
                          </span>
                          
                          <button 
                            onClick={() => handleRemoveItem(item.id, item.customOptions)}
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.5rem',
                              borderRadius: '8px',
                              width: '36px',
                              height: '36px',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 5px rgba(239, 68, 68, 0.15)'
                            }}
                            aria-label="Fjern produkt"
                          >
                            <FaTrashAlt size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Desktop-only Price */}
                  {!isMobile && (
                    <div style={{ textAlign: 'center' }}>
                      <span style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: '600',
                        fontSize: '1rem',
                        color: '#0f172a',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        display: 'inline-block'
                      }}>
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  )}
                  
                  {/* Quantity */}
                  <div style={{ 
                    textAlign: isMobile ? 'left' : 'center',
                    gridColumn: isMobile ? 'span 1' : 'auto',
                    marginTop: isMobile ? '0.75rem' : '0'
                  }}>
                    {isMobile && (
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '500', 
                        color: '#475569',
                        marginBottom: '0.4rem'
                      }}>
                        Antall:
                      </div>
                    )}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: isMobile ? 'flex-start' : 'center'
                    }}>
                      <button 
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.customOptions)}
                        style={{
                          width: isMobile ? '32px' : '34px',
                          height: isMobile ? '32px' : '34px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.5rem 0 0 0.5rem',
                          backgroundColor: 'rgba(226, 232, 240, 0.5)',
                          cursor: 'pointer',
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: '600',
                          color: '#475569',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        -
                      </button>
                      <input 
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value), item.customOptions)}
                        min="1"
                        style={{
                          width: isMobile ? '40px' : '45px',
                          height: isMobile ? '32px' : '34px',
                          border: '1px solid #e2e8f0',
                          borderLeft: 'none',
                          borderRight: 'none',
                          textAlign: 'center',
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: '600',
                          color: '#0f172a',
                          fontSize: '0.9rem'
                        }}
                      />
                      <button 
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.customOptions)}
                        style={{
                          width: isMobile ? '32px' : '34px',
                          height: isMobile ? '32px' : '34px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0 0.5rem 0.5rem 0',
                          backgroundColor: 'rgba(226, 232, 240, 0.5)',
                          cursor: 'pointer',
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: '600',
                          color: '#475569',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  {/* Mobile Total */}
                  {isMobile && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginTop: '0.75rem',
                      padding: '0.75rem 0 0',
                      borderTop: '1px dashed #e2e8f0'
                    }}>
                      <span style={{ fontWeight: '500', color: '#475569' }}>Sum:</span>
                      <span style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: '700',
                        fontSize: '1.1rem',
                        color: '#0284c7'
                      }}>
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  )}
                  
                  {/* Desktop Total */}
                  {!isMobile && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: '700',
                        fontSize: '1.1rem',
                        color: '#0284c7',
                        display: 'block'
                      }}>
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  )}
                  
                  {/* Desktop Remove */}
                  {!isMobile && (
                    <div>
                      <button 
                        onClick={() => handleRemoveItem(item.id, item.customOptions)}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.65rem',
                          borderRadius: '8px',
                          width: '40px',
                          height: '40px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 5px rgba(239, 68, 68, 0.15)'
                        }}
                        aria-label="Fjern produkt"
                      >
                        <FaTrashAlt size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Actions */}
              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between', 
                gap: isMobile ? '1rem' : '0',
                marginTop: '1.5rem' 
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? '0.75rem' : '10px'
                }}>
                  <button 
                    onClick={clearCart}
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '8px',
                      padding: '0.6rem 1rem',
                      cursor: 'pointer',
                      color: '#ef4444',
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.01em',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Tøm handlekurv
                  </button>
                  
                  {!isMobile && (
                    <button
                      onClick={() => {
                        const debug = debugCart();
                        setError(`Debug-modus: ${debug.cartItems.length} varer, sum: ${debug.cartTotal}. Sjekk konsollen for detaljer.`);
                      }}
                      style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '8px',
                        padding: '0.6rem 1rem',
                        cursor: 'pointer',
                        color: '#3b82f6',
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Debug handlekurv
                    </button>
                  )}
                </div>
                
                <Link href="/shop" style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(14, 165, 233, 0.08)',
                  border: '1px solid rgba(14, 165, 233, 0.3)',
                  borderRadius: '8px',
                  padding: '0.6rem 1.2rem',
                  cursor: 'pointer',
                  color: '#0284c7',
                  textDecoration: 'none',
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}>
                  <FaArrowLeft style={{ fontSize: '0.75rem' }} /> Fortsett å handle
                </Link>
              </div>
            </div>
            
            {/* Order summary */}
            <div>
              <div style={{ 
                border: '1px solid #e2e8f0', 
                borderRadius: '0.75rem', 
                padding: isMobile ? '1.25rem' : '1.75rem',
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)'
              }}>
                <h2 style={{ 
                  fontSize: isMobile ? '1.25rem' : '1.375rem', 
                  marginBottom: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '700',
                  letterSpacing: '-0.025em',
                  fontFamily: "'Outfit', sans-serif",
                  color: '#0f172a'
                }}>Ordreoppsummering</h2>
                
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ 
                      color: '#64748b',
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: isMobile ? '0.9rem' : '0.95rem',
                      fontWeight: '500'
                    }}>Delsum</span>
                    <span style={{ 
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: '600'
                    }}>{formatPrice(cartTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ 
                      color: '#64748b',
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: isMobile ? '0.9rem' : '0.95rem',
                      fontWeight: '500'
                    }}>Frakt</span>
                    <span style={{ 
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: '600'
                    }}>Gratis</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <span style={{ 
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: '700',
                    fontSize: isMobile ? '1.0625rem' : '1.125rem',
                    color: '#0f172a'
                  }}>Totalt</span>
                  <span style={{ 
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: '700',
                    fontSize: isMobile ? '1.0625rem' : '1.125rem',
                    color: '#0284c7'
                  }}>{formatPrice(cartTotal)}</span>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.85rem' : '0.95rem',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: isMobile ? '0.9rem' : '0.95rem',
                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                    transition: 'all 0.2s ease',
                    fontFamily: "'Outfit', sans-serif",
                    letterSpacing: '-0.01em',
                    textTransform: 'uppercase'
                  }}
                >
                  GÅ TIL BETALING
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
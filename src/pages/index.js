import React from 'react';
import Head from 'next/head';
import { FaPrint, FaStore, FaLaptop, FaCubes, FaUpload, FaCube, FaShoppingCart } from 'react-icons/fa';
import { FaPencil, FaFire } from 'react-icons/fa6';
import { GiLaserWarning } from 'react-icons/gi';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';

const Footer = () => {
  const [windowWidth, setWindowWidth] = React.useState(null);
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  const isMobile = windowWidth && windowWidth < 768;
  
  return (
    <footer style={{ 
      padding: isMobile ? '16px' : '20px', 
      borderTop: '1px solid #ddd', 
      marginTop: isMobile ? '24px' : '40px', 
      textAlign: 'center',
      fontSize: isMobile ? '14px' : '16px'
    }}>
      <p>© {new Date().getFullYear()} Laserkongen. Alle rettigheter reservert.</p>
    </footer>
  );
};

const ProductCard = ({ product }) => (
  <div style={{ 
    border: '1px solid #e5e7eb', 
    borderRadius: '12px', 
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.2s, box-shadow 0.2s'
  }}>
    <div style={{ 
      height: '200px', 
      backgroundColor: '#f1f5f9', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <span style={{ color: '#94a3b8' }}>Produktbilde</span>
    </div>
    <div style={{ padding: '20px' }}>
      <h3 style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '18px' }}>{product.norwegianName || product.name}</h3>
      <p style={{ 
        fontSize: '14px', 
        color: '#6b7280', 
        marginBottom: '16px', 
        minHeight: '40px' 
      }}>{product.norwegianDescription || product.description}</p>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: 'auto'
      }}>
        <span style={{ 
          fontWeight: 'bold', 
          fontSize: '18px',
          color: '#0284c7'
        }}>kr {(product.price * 10.5).toFixed(2)}</span>
        <button 
          style={{ 
            backgroundColor: '#0284c7', 
            color: 'white', 
            border: 'none', 
            padding: '10px 16px', 
            borderRadius: '8px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.2s'
          }}
          onClick={() => alert('Lagt til i handlekurven!')}
        >
          <FaShoppingCart size={14} />
          Legg i kurv
        </button>
      </div>
    </div>
  </div>
);

const HeroSection = () => {
  const [windowWidth, setWindowWidth] = React.useState(null);
  
  // Handle window resize for responsiveness
  React.useEffect(() => {
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
  
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', 
      padding: isMobile ? '60px 20px' : '80px 24px', 
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative elements - hidden on smaller screens */}
      {!isMobile && (
        <>
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '5%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
            zIndex: 1
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '10%',
            right: '5%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
            zIndex: 1
          }}></div>
        </>
      )}
      
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        position: 'relative',
        zIndex: 2,
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '24px',
          gap: '16px'
        }}>
          <FaCube size={isMobile ? 36 : 48} style={{ color: 'white' }} />
          <GiLaserWarning size={isMobile ? 36 : 48} style={{ color: 'white' }} />
        </div>
        
        <h1 style={{ 
          fontSize: isMobile ? '28px' : '42px', 
          fontWeight: '800', 
          marginBottom: '16px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          lineHeight: '1.2',
          padding: '0 10px'
        }}>
          Gi liv til ideene dine<br/>
          <span style={{ color: '#bae6fd' }}>med 3D-utskrift og lasergravering</span>
        </h1>
        
        <p style={{ 
          fontSize: isMobile ? '16px' : '18px', 
          maxWidth: '600px', 
          margin: '0 auto 32px',
          opacity: '0.9',
          lineHeight: '1.5',
          padding: '0 10px'
        }}>
          Last opp dine design og få et øyeblikkelig pristilbud. Høykvalitets 3D-utskrift og lasergravering med rask leveringstid.
        </p>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '16px' : '20px', 
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <a href="/upload" style={{ 
            backgroundColor: 'white', 
            color: '#0284c7', 
            border: 'none', 
            padding: '14px 28px', 
            borderRadius: '8px', 
            fontWeight: '600', 
            textDecoration: 'none', 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}>
            <FaUpload />
            Last opp design
          </a>
          
          <a href="/shop" style={{ 
            backgroundColor: 'transparent', 
            color: 'white', 
            border: '2px solid white', 
            padding: '14px 28px', 
            borderRadius: '8px', 
            fontWeight: '600', 
            textDecoration: 'none', 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'background-color 0.2s',
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}>
            <FaStore />
            Utforsk butikk
          </a>
        </div>
      </div>
    </div>
  );
};

const FeaturedProducts = () => {
  const [featuredProducts, setFeaturedProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [windowWidth, setWindowWidth] = React.useState(null);
  const { addToCart } = useCart();
  
  // Handle window resize for responsiveness
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  React.useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        console.log('FeaturedProducts: Fetching from API...');
        
        // Make a direct call to the featured endpoint
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/products/featured?_t=${timestamp}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch featured products');
        }
        
        const products = await response.json();
        console.log('FeaturedProducts: Received featured products:', products);
        
        // The featured endpoint returns an array directly, not an object with products property
        setFeaturedProducts(products || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching featured products:', error);
        setError('Kunne ikke laste inn utvalgte produkter');
        setLoading(false);
      }
    };
    
    fetchFeaturedProducts();
  }, []);

  const handleAddToCart = (product) => {
    const productToAdd = {
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      images: product.images,
    };
    
    addToCart(productToAdd, 1);
  };

  // Determine if we're on mobile
  const isMobile = windowWidth && windowWidth < 768;

  return (
    <section style={{ padding: isMobile ? '40px 20px' : '60px 24px', backgroundColor: '#f1f5f9' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          marginBottom: isMobile ? '24px' : '32px',
          gap: isMobile ? '16px' : '0'
        }}>
          <div>
            <h2 style={{ 
              fontSize: isMobile ? '24px' : '30px', 
              fontWeight: 'bold',
              color: '#0f172a', 
              position: 'relative',
              display: 'inline-block'
            }}>
              Utvalgte produkter
              <span style={{ 
                position: 'absolute',
                bottom: '-8px',
                left: '0',
                width: '60%',
                height: '4px',
                background: 'linear-gradient(90deg, #0ea5e9, transparent)',
                borderRadius: '2px'
              }}></span>
            </h2>
          </div>
          <a href="/shop" style={{ 
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '500',
            textDecoration: 'none'
          }}>
            Se alle produkter
            <span>→</span>
          </a>
        </div>
        
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '3rem' 
          }}>
            <div style={{ 
              color: '#0284c7',
              display: 'inline-block',
              width: '2rem',
              height: '2rem',
              border: '3px solid rgba(14, 165, 233, 0.3)',
              borderRadius: '50%',
              borderTopColor: '#0284c7',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        ) : error ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            color: '#ef4444' 
          }}>
            {error}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            color: '#64748b' 
          }}>
            Ingen utvalgte produkter tilgjengelig for øyeblikket.
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile 
              ? '1fr' 
              : windowWidth && windowWidth < 1024
                ? 'repeat(2, 1fr)'
                : 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: isMobile ? '24px' : '32px'
          }}>
            {featuredProducts.map(product => (
              <div key={product.id} style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '12px', 
                overflow: 'hidden',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                backgroundColor: 'white'
              }}>
                <div style={{ 
                  height: '200px', 
                  backgroundColor: '#f1f5f9', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ color: '#94a3b8' }}>Produktbilde</span>
                  )}
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '18px' }}>{product.norwegianName || product.name}</h3>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#6b7280', 
                    marginBottom: '16px', 
                    minHeight: '40px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {product.norwegianDescription || 
                      (product.description && product.description.length > 100 
                        ? product.description.substring(0, 100) + '...' 
                        : product.description)
                    }
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginTop: 'auto'
                  }}>
                    <span style={{ 
                      fontWeight: 'bold', 
                      fontSize: '18px',
                      color: '#0284c7'
                    }}>kr {parseFloat(product.price).toFixed(2)}</span>
                    <a 
                      href={`/product/${product.id}`}
                      style={{ 
                        textDecoration: 'none', 
                        color: '#0284c7',
                        fontWeight: '500',
                        fontSize: '14px'
                      }}
                    >
                      Se detaljer
                    </a>
                  </div>
                  <button 
                    style={{ 
                      backgroundColor: '#0284c7', 
                      color: 'white', 
                      border: 'none', 
                      padding: '10px 16px', 
                      borderRadius: '8px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      width: '100%',
                      justifyContent: 'center',
                      marginTop: '12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleAddToCart(product)}
                  >
                    <FaShoppingCart size={14} />
                    <span>Legg i handlekurv</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
};

export default function Home() {
  // Use the CartContext directly
  const { cartItems } = useCart();
  const [windowWidth, setWindowWidth] = React.useState(null);
  
  // Handle window resize for responsiveness
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>Laserkongen | 3D-utskrift og Lasergraveringstjenester</title>
        <meta name="description" content="Profesjonelle tjenester for 3D-utskrift og lasergravering. Last opp dine design eller handle fra vårt utvalg av produkter." />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Header cartItemCount={cartItems?.length || 0} />

      <main style={{ flexGrow: 1 }}>
        <HeroSection />

        <section style={{ 
          padding: windowWidth && windowWidth < 768 ? '40px 20px' : '60px 24px', 
          backgroundColor: '#f8fafc',
          position: 'relative'
        }}>
          {/* Decorative geometric shapes in background - hide on mobile */}
          {(!windowWidth || windowWidth >= 768) && (
            <>
              <div style={{
                position: 'absolute',
                top: '50px',
                left: '5%',
                width: '180px',
                height: '180px',
                borderRadius: '24px',
                backgroundColor: 'rgba(14, 165, 233, 0.04)',
                transform: 'rotate(15deg)',
                zIndex: 0
              }}></div>
              <div style={{
                position: 'absolute',
                bottom: '80px',
                right: '5%',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: 'rgba(14, 165, 233, 0.04)',
                zIndex: 0
              }}></div>
            </>
          )}
          
          <div style={{ 
            maxWidth: '1000px', 
            margin: '0 auto', 
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{ textAlign: 'center', marginBottom: windowWidth && windowWidth < 768 ? '40px' : '60px' }}>
              <h2 style={{ 
                fontSize: windowWidth && windowWidth < 768 ? '24px' : '30px', 
                fontWeight: 'bold', 
                marginBottom: '16px',
                color: '#0f172a',
                display: 'inline-block',
                position: 'relative'
              }}>
                Slik fungerer det
                <span style={{ 
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '80px',
                  height: '4px',
                  background: 'linear-gradient(90deg, transparent, #0ea5e9, transparent)',
                  borderRadius: '2px'
                }}></span>
              </h2>
              <p style={{ 
                fontSize: windowWidth && windowWidth < 768 ? '14px' : '16px', 
                color: '#64748b', 
                marginBottom: '0', 
                maxWidth: '600px', 
                margin: '0 auto',
                padding: '0 10px'
              }}>
                Vår enkle prosess gjør det lett å få dine design skrevet ut eller gravert.
              </p>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: windowWidth && windowWidth < 640 
                ? '1fr' 
                : windowWidth && windowWidth < 1024 
                  ? 'repeat(2, 1fr)' 
                  : 'repeat(3, 1fr)', 
              gap: windowWidth && windowWidth < 768 ? '24px' : '32px'
            }}>
              <div style={{ 
                position: 'relative', 
                padding: '32px 24px',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  left: '24px', 
                  top: '-20px', 
                  backgroundColor: '#0ea5e9', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: '40px', 
                  height: '40px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 'bold',
                  boxShadow: '0 4px 6px rgba(14, 165, 233, 0.25)'
                }}>1</div>
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  height: '100%'
                }}>
                  <FaUpload size={windowWidth && windowWidth < 768 ? 28 : 32} style={{ color: '#0ea5e9', marginBottom: '16px' }} />
                  <h3 style={{ 
                    fontSize: windowWidth && windowWidth < 768 ? '18px' : '20px', 
                    fontWeight: 'bold', 
                    marginBottom: '12px',
                    color: '#0f172a'
                  }}>Last opp din design</h3>
                  <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: windowWidth && windowWidth < 768 ? '14px' : '16px' }}>
                    Last opp din 3D-modell eller bildefil for lasergravering gjennom vårt enkle grensesnitt.
                  </p>
                </div>
              </div>
              
              <div style={{ 
                position: 'relative', 
                padding: '32px 24px',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  left: '24px', 
                  top: '-20px', 
                  backgroundColor: '#0ea5e9', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: '40px', 
                  height: '40px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 'bold',
                  boxShadow: '0 4px 6px rgba(14, 165, 233, 0.25)'
                }}>2</div>
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  height: '100%'
                }}>
                  <FaLaptop size={windowWidth && windowWidth < 768 ? 28 : 32} style={{ color: '#0ea5e9', marginBottom: '16px' }} />
                  <h3 style={{ 
                    fontSize: windowWidth && windowWidth < 768 ? '18px' : '20px', 
                    fontWeight: 'bold', 
                    marginBottom: '12px',
                    color: '#0f172a'
                  }}>Få øyeblikkelig pristilbud</h3>
                  <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: windowWidth && windowWidth < 768 ? '14px' : '16px' }}>
                    Vårt system beregner automatisk pris basert på materialbruk og kompleksitet.
                  </p>
                </div>
              </div>
              
              <div style={{ 
                position: 'relative', 
                padding: '32px 24px',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  left: '24px', 
                  top: '-20px', 
                  backgroundColor: '#0ea5e9', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: '40px', 
                  height: '40px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 'bold',
                  boxShadow: '0 4px 6px rgba(14, 165, 233, 0.25)'
                }}>3</div>
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  height: '100%'
                }}>
                  <FaStore size={windowWidth && windowWidth < 768 ? 28 : 32} style={{ color: '#0ea5e9', marginBottom: '16px' }} />
                  <h3 style={{ 
                    fontSize: windowWidth && windowWidth < 768 ? '18px' : '20px', 
                    fontWeight: 'bold', 
                    marginBottom: '12px',
                    color: '#0f172a'
                  }}>Motta din bestilling</h3>
                  <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: windowWidth && windowWidth < 768 ? '14px' : '16px' }}>
                    Vi produserer og sender bestillingen din direkte til din dørstokk.
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '48px', textAlign: 'center' }}>
              <a 
                href="/upload" 
                style={{ 
                  backgroundColor: '#0ea5e9', 
                  color: 'white', 
                  padding: '14px 32px', 
                  borderRadius: '8px', 
                  textDecoration: 'none', 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  boxShadow: '0 4px 6px rgba(14, 165, 233, 0.25)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  width: windowWidth && windowWidth < 768 ? '100%' : 'auto',
                  justifyContent: windowWidth && windowWidth < 768 ? 'center' : 'flex-start'
                }}
              >
                <FaUpload size={16} />
                Start ditt prosjekt nå
              </a>
            </div>
          </div>
        </section>

        <FeaturedProducts />
      </main>

      <Footer />
    </div>
  );
}
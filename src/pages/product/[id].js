import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaShoppingCart, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import Header from '../../components/Header';

// Custom Footer component
const Footer = () => (
  <footer style={{ padding: '20px', borderTop: '1px solid #ddd', marginTop: '40px', textAlign: 'center' }}>
    <p>© {new Date().getFullYear()} Laserkongen. Alle rettigheter reservert.</p>
  </footer>
);

const ProductDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const { addToCart, cartCount } = useCart();

  // Fetch product detail
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch product details');
        }
        
        const data = await response.json();
        setProduct(data);
        
        // Set default selections
        if (data.materials && data.materials.length > 0) {
          setSelectedMaterial(data.materials[0].name);
        }
        
        if (data.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product details:', error);
        setError('Failed to load product details. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    setQuantity(value < 1 ? 1 : value);
  };

  const [buttonState, setButtonState] = useState('normal');
  
  const handleAddToCart = () => {
    if (!product) return;
    
    const customOptions = {
      material: selectedMaterial,
      color: selectedColor
    };
    
    // Set button to "Added" state
    setButtonState('added');
    
    // Add to cart
    addToCart(product, quantity, customOptions);
    
    // Reset button state after 1.5 seconds
    setTimeout(() => {
      setButtonState('normal');
    }, 1500);
  };

  const formatPrice = (price) => {
    return `kr ${parseFloat(price).toFixed(2)}`;
  };

  const getMaterialPrice = () => {
    if (!product || !selectedMaterial) return 0;
    
    const material = product.materials.find(m => m.name === selectedMaterial);
    return material ? material.price : 0;
  };

  const getTotalPrice = () => {
    if (!product) return 0;
    
    const basePrice = parseFloat(product.price);
    const materialPrice = getMaterialPrice();
    
    return (basePrice + materialPrice) * quantity;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <FaSpinner style={{ fontSize: '2rem', color: '#64748b', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        {error || 'Product not found'}
        <div style={{ marginTop: '1rem' }}>
          <Link href="/shop" style={{ color: '#1e3a8a', textDecoration: 'underline' }}>
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>{product.name} | Laserkongen</title>
        <meta name="description" content={product.description} />
      </Head>
      
      <Header cartItemCount={cartCount} />
      
      {/* Back button */}
      <div style={{ maxWidth: '1400px', margin: '2rem auto 1rem', padding: '0 24px' }}>
        <Link href="/shop" style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#64748b',
          textDecoration: 'none',
          padding: '0.5rem',
          fontWeight: '500'
        }}>
          <FaArrowLeft /> Tilbake til Butikk
        </Link>
      </div>
      
      {/* Product detail */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 3rem', flexGrow: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Product images */}
          <div>
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '12px', 
              overflow: 'hidden',
              height: '400px',
              backgroundColor: '#f1f5f9'
            }}>
              <img 
                src={product.images && product.images.length > 0 ? product.images[selectedImage] : '/placeholder-product.jpg'} 
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            
            {product.images && product.images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                {product.images.map((image, index) => (
                  <button 
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    style={{ 
                      border: selectedImage === index ? '2px solid #0284c7' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      padding: 0,
                      cursor: 'pointer',
                      width: '80px',
                      height: '80px'
                    }}
                  >
                    <img 
                      src={image} 
                      alt={`${product.name} - Image ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Product info */}
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>{product.name}</h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#0284c7' }}>
                {formatPrice(product.price)}
              </span>
              
              <span style={{ 
                backgroundColor: product.inStock ? '#dcfce7' : '#fee2e2',
                color: product.inStock ? '#166534' : '#b91c1c',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                {product.inStock ? 'På lager' : 'Utsolgt'}
              </span>
            </div>
            
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              {product.description}
            </p>
            
            <div style={{ borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: '1rem 0', marginBottom: '1.5rem' }}>
              {/* Materials selection */}
              {product.materials && product.materials.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Materiale:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {product.materials.map(material => (
                      <button 
                        key={material.name}
                        onClick={() => setSelectedMaterial(material.name)}
                        style={{
                          border: selectedMaterial === material.name ? '2px solid #0284c7' : '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '0.5rem 1rem',
                          backgroundColor: selectedMaterial === material.name ? '#eff6ff' : 'white',
                          cursor: 'pointer'
                        }}
                      >
                        {material.name}
                        {material.price > 0 && ` (+${formatPrice(material.price)})`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Colors selection */}
              {product.colors && product.colors.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Farge:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {product.colors.map(color => (
                      <button 
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        style={{
                          border: selectedColor === color ? '2px solid #0284c7' : '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '0.5rem 1rem',
                          backgroundColor: selectedColor === color ? '#eff6ff' : 'white',
                          cursor: 'pointer'
                        }}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Dimensions */}
              {product.dimensions && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ marginBottom: '0.25rem', fontWeight: '500' }}>Dimensjoner:</p>
                  <p style={{ color: '#6b7280' }}>
                    {product.dimensions.width} x {product.dimensions.height} x {product.dimensions.depth} {product.dimensions.unit}
                  </p>
                </div>
              )}
              
              {/* Weight */}
              {product.weight && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ marginBottom: '0.25rem', fontWeight: '500' }}>Vekt:</p>
                  <p style={{ color: '#6b7280' }}>
                    {product.weight.value} {product.weight.unit}
                  </p>
                </div>
              )}
              
              {/* Print time */}
              {product.printTime && (
                <div>
                  <p style={{ marginBottom: '0.25rem', fontWeight: '500' }}>Utskriftstid:</p>
                  <p style={{ color: '#6b7280' }}>
                    {product.printTime} timer
                  </p>
                </div>
              )}
            </div>
            
            {/* Quantity and add to cart */}
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="quantity" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Antall:
                </label>
                <input 
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="1"
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    width: '80px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontWeight: '500' }}>Total: <span style={{ color: '#0284c7', fontWeight: 'bold' }}>{formatPrice(getTotalPrice())}</span></p>
              </div>
              
              <button 
                onClick={handleAddToCart}
                disabled={!product.inStock || buttonState === 'added'}
                style={{ 
                  backgroundColor: buttonState === 'added' ? '#059669' : (product.inStock ? '#0284c7' : '#94a3b8'), 
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
                  cursor: buttonState === 'added' ? 'default' : (product.inStock ? 'pointer' : 'not-allowed'),
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {buttonState === 'added' ? (
                  <>
                    <div style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: '100%',
                      backgroundColor: '#059669',
                      transform: 'translateX(-100%)',
                      animation: 'slideIn 1.5s ease forwards'
                    }}></div>
                    <svg 
                      style={{ 
                        height: 14, 
                        width: 14, 
                        zIndex: 1, 
                        position: 'relative'
                      }}
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span style={{ zIndex: 1, position: 'relative' }}>Lagt til</span>
                  </>
                ) : (
                  <>
                    <FaShoppingCart size={14} />
                    <span>{product.inStock ? 'Legg i handlekurv' : 'Utsolgt'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
      
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
        @media (max-width: 900px) {
          .products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 1rem !important;
          }
        }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .products-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductDetail;
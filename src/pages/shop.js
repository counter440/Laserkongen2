import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaSearch, FaSpinner, FaShoppingCart, FaCube } from 'react-icons/fa';
import { GiLaserWarning } from 'react-icons/gi';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';

// Custom Footer component
const Footer = () => (
  <footer style={{ padding: '20px', borderTop: '1px solid #ddd', marginTop: '40px', textAlign: 'center' }}>
    <p>© {new Date().getFullYear()} Laserkongen. Alle rettigheter reservert.</p>
  </footer>
);

// Product card component matching index.js styling
const ProductCard = ({ product, handleAddToCart }) => {
  const [buttonState, setButtonState] = React.useState('normal');
  
  const handleClick = () => {
    // Set button to "Added" state
    setButtonState('added');
    
    // Call the add to cart function
    handleAddToCart(product);
    
    // Reset button state after 1.5 seconds
    setTimeout(() => {
      setButtonState('normal');
    }, 1500);
  };

  return (
    <div style={{ 
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
            (product.description.length > 100 
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
            backgroundColor: buttonState === 'added' ? '#059669' : '#0284c7', 
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
            cursor: buttonState === 'added' ? 'default' : 'pointer',
            position: 'relative',
            overflow: 'hidden'
          }}
          onClick={handleClick}
          disabled={buttonState === 'added'}
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
              <span>Legg i handlekurv</span>
            </>
          )}
        </button>
      </div>
      
      <style jsx>{`
        @keyframes slideIn {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart, cartCount } = useCart();

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let url = '/api/products';
        
        // Add filters
        if (selectedCategory) {
          url += `?category=${selectedCategory}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data.products);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(data.products.map(product => product.category))];
        setCategories(uniqueCategories);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Kunne ikke laste produkter. Prøv igjen senere.');
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [selectedCategory]);

  // Filter products by search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToCart = (product) => {
    // Make sure we're passing all needed product data
    const productToAdd = {
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      images: product.images,
      // Add any other fields that might be needed
    };
    
    addToCart(productToAdd, 1);
    
    // Verify the cart was updated (debug only)
    if (window.localStorage) {
      try {
        const cartData = window.localStorage.getItem('laserkongen_cart');
        console.log('Current localStorage cart data:', cartData);
      } catch (error) {
        console.error('Error reading cart from localStorage:', error);
      }
    }
    
    // No alert - UI feedback is now handled by the button state
  };

  const getCategoryLabel = (category) => {
    switch(category) {
      case '3d-printing': return '3D-utskrift';
      case 'laser-engraving': return 'Lasergravering';
      case 'custom': return 'Tilpassede produkter';
      case 'ready-made': return 'Ferdiglagde produkter';
      default: return category;
    }
  };
  
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>Butikk | Laserkongen</title>
        <meta name="description" content="Kjøp 3D-printede gjenstander og lasergraverte produkter" />
      </Head>
      
      <Header cartItemCount={cartCount} />
      
      {/* Hero */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', 
        padding: '60px 24px', 
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          position: 'relative',
          zIndex: 2,
          textAlign: 'center'
        }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: '800', 
            marginBottom: '16px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            Butikk
          </h1>
          <p style={{ 
            fontSize: '18px', 
            maxWidth: '700px', 
            margin: '0 auto',
            opacity: '0.9'
          }}>
            Utforsk vårt utvalg av 3D-printede gjenstander og lasergraverte produkter. Tilpassede design alternativer er tilgjengelige!
          </p>
        </div>
      </div>
      
      {/* Main content */}
      <div style={{ width: '100%', maxWidth: '1400px', margin: '2rem auto', padding: '0 24px', flexGrow: 1 }}>
        {/* Filters */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '2rem', 
          flexWrap: 'wrap', 
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setSelectedCategory('')}
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: selectedCategory === '' ? '#0284c7' : '#f1f5f9', 
                color: selectedCategory === '' ? 'white' : '#1e293b',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              Alle produkter
            </button>
            
            {categories.map(category => (
              <button 
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{ 
                  padding: '0.5rem 1rem', 
                  backgroundColor: selectedCategory === category ? '#0284c7' : '#f1f5f9', 
                  color: selectedCategory === category ? 'white' : '#1e293b',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                {getCategoryLabel(category)}
              </button>
            ))}
          </div>
          
          <div style={{ position: 'relative', minWidth: '300px' }}>
            <input 
              type="text"
              placeholder="Søk produkter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.5rem 1rem 0.5rem 2.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                width: '100%',
                fontSize: '14px'
              }}
            />
            <FaSearch style={{ 
              position: 'absolute', 
              left: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#94a3b8' 
            }} />
          </div>
        </div>
        
        {/* Products grid */}
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '3rem',
            marginTop: '2rem'
          }}>
            <FaSpinner style={{ 
              fontSize: '2rem', 
              color: '#0284c7', 
              animation: 'spin 1s linear infinite' 
            }} />
          </div>
        ) : error ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            color: '#ef4444',
            marginTop: '2rem'
          }}>
            {error}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            color: '#64748b',
            marginTop: '2rem'
          }}>
            Ingen produkter funnet. Prøv å endre filtre eller søkeord.
          </div>
        ) : (
          <div className="products-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            width: '100%',
            margin: '0 auto',
            gap: '1.5rem'
          }}>
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                handleAddToCart={handleAddToCart} 
              />
            ))}
          </div>
        )}
      </div>
      
      <Footer />
      
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 1200px) {
          .products-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 1.25rem !important;
          }
        }
        @media (max-width: 900px) {
          .products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 1rem !important;
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

export default Shop;
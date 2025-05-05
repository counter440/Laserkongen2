import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FaShoppingCart, FaBars, FaTimes, FaUser } from 'react-icons/fa';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ cartItemCount = 0 }) {
  const router = useRouter();
  const path = router.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(null);
  const { user, logout, isAuthenticated } = useAuth();
  
  // Handle window resize and set initial width
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
        if (window.innerWidth >= 768) {
          setMobileMenuOpen(false);
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  // Check if we're on an admin page
  const isAdminPage = path.startsWith('/admin');
  
  // If we're on an admin page, use the old header
  if (isAdminPage) {
    return (
      <header style={{ 
        backgroundColor: '#1d4ed8', 
        color: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          height: '4rem',
          alignItems: 'center'
        }}>
          <Link href="/admin" style={{ 
            display: 'flex', 
            alignItems: 'center',
            textDecoration: 'none'
          }}>
            <span style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: 'white' 
            }}>Laserkongen Admin</span>
          </Link>
        </div>
      </header>
    );
  }

  // Navigation links array for both desktop and mobile
  const navLinks = [
    { href: '/upload', text: 'Last opp design' },
    { href: '/shop', text: 'Butikk' },
    { href: '/kontakt', text: 'Kontakt' },
    { href: '/om-oss', text: 'Om oss' }
  ];
  
  // Use the header from the upload page for all non-admin pages
  return (
    <div style={{
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        height: '70px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: windowWidth && windowWidth < 768 ? '16px' : '32px'
        }}>
          <a href="/" style={{
            fontSize: windowWidth && windowWidth < 768 ? '20px' : '24px',
            fontWeight: '800',
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '-0.03em',
            background: 'linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0px 2px 4px rgba(0,0,0,0.05)',
            textDecoration: 'none'
          }}>LASERKONGEN</a>
          
          {/* Desktop Navigation */}
          {windowWidth && windowWidth >= 768 && (
            <nav style={{
              display: 'flex',
              gap: '32px'
            }}>
              {navLinks.map((link) => (
                <a 
                  key={link.href}
                  href={link.href} 
                  style={{
                    fontWeight: '600',
                    color: path === link.href ? '#0284c7' : '#4b5563',
                    textDecoration: 'none',
                    paddingBottom: '4px',
                    borderBottom: path === link.href ? '2px solid #0284c7' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {link.text}
                </a>
              ))}
            </nav>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* User Account Button - Direct link without dropdown */}
          <div>
            <a
              href={isAuthenticated() ? "/account" : "/login"}
              style={{
                textDecoration: 'none',
                cursor: 'pointer',
                color: isAuthenticated() ? '#0284c7' : '#4b5563',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: '50%',
                backgroundColor: isAuthenticated() ? '#e0f2fe' : 'transparent'
              }}
              aria-label={isAuthenticated() ? "My account" : "Login"}
            >
              <FaUser size={18} />
            </a>
          </div>
          
          {/* Shopping Cart */}
          <a href="/cart" style={{
            color: '#4b5563',
            textDecoration: 'none',
            position: 'relative'
          }}>
            <FaShoppingCart style={{ height: '20px', width: '20px' }} />
            {cartItemCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#0284c7',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                borderRadius: '50%',
                height: '18px',
                width: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {cartItemCount}
              </span>
            )}
          </a>
          
          {/* Mobile Menu Toggle Button */}
          {windowWidth && windowWidth < 768 && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#4b5563',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px'
              }}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          )}
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {windowWidth && windowWidth < 768 && mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '70px',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 50,
          animation: 'slideDown 0.3s ease-out forwards'
        }}>
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 24px'
          }}>
            {navLinks.map((link) => (
              <a 
                key={link.href}
                href={link.href} 
                style={{
                  fontWeight: '600',
                  color: path === link.href ? '#0284c7' : '#4b5563',
                  textDecoration: 'none',
                  padding: '12px 0',
                  borderBottom: '1px solid #e5e7eb',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.text}
              </a>
            ))}
            
            {/* Mobile menu account link */}
            <a 
              href={isAuthenticated() ? "/account" : "/login"} 
              style={{
                fontWeight: '600',
                color: path === '/account' || path === '/login' ? '#0284c7' : '#4b5563',
                textDecoration: 'none',
                padding: '12px 0',
                borderBottom: '1px solid #e5e7eb',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              {isAuthenticated() ? 'Min konto' : 'Logg inn'}
            </a>
          </nav>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
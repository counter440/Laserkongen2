import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);
  
  // For debug purposes
  const DEBUG = true;

  useEffect(() => {
    if (DEBUG) {
      console.log('ProtectedRoute state:', { 
        loading, 
        authenticated: !!user,
        path: router.pathname 
      });
    }
    
    // If user is logged in, show content
    if (user) {
      setShowContent(true);
    } else if (!loading) {
      // Only redirect if not loading
      console.log('No authenticated user, redirecting to login');
      router.push({
        pathname: '/login',
        query: { 
          expired: 'true', 
          redirect: router.pathname.replace('/', ''),
          ts: Date.now() // Add timestamp to prevent caching
        }
      });
    }
  }, [loading, router, user, DEBUG]);

  // Show loader while checking authentication
  if (!showContent) {
    return (
      <div style={{ 
        display: 'flex',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(0, 132, 199, 0.2)',
          borderTop: '4px solid #0284c7',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If authenticated, show the protected content
  return children;
};

export default ProtectedRoute;
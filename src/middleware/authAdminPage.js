import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// Middleware to ensure only admin users can access admin pages
export function withAdminAuth(WrappedComponent) {
  return function WithAdminAuth(props) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      // Delay checking auth until after component mounts to ensure
      // sessionStorage is available (Next.js SSR safety)
      const checkAuth = () => {
        try {
          // Check if the user has an auth token and is an admin
          const userInfo = sessionStorage.getItem('userInfo')
            ? JSON.parse(sessionStorage.getItem('userInfo'))
            : null;
          
          if (!userInfo || !userInfo.token) {
            // No auth token, redirect to admin login
            router.replace('/admin-login');
            return;
          }

          if (userInfo.role !== 'admin') {
            // User is not an admin, redirect to homepage
            router.replace('/');
            return;
          }
          
          // User is authorized
          setIsAuthorized(true);
        } catch (error) {
          console.error('Auth check error:', error);
          router.replace('/admin-login');
        } finally {
          setIsLoading(false);
        }
      };
      
      checkAuth();
    }, [router]);

    // Show loading state while checking auth
    if (isLoading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          width: '100vw',
          backgroundColor: '#f8fafc'
        }}>
          <style jsx global>{`
            html, body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, 
                Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              background-color: #f8fafc;
            }
            
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div 
            style={{ 
              width: '48px', 
              height: '48px', 
              border: '4px solid rgba(30, 58, 138, 0.1)', 
              borderLeftColor: '#1e3a8a', 
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} 
          />
        </div>
      );
    }

    // Only render the protected component if user is authorized
    return isAuthorized ? <WrappedComponent {...props} /> : null;
  };
}

export default withAdminAuth;
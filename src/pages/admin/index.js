import { useEffect } from 'react';
import { useRouter } from 'next/router';
import withAdminAuth from '../../middleware/authAdminPage';

function AdminIndex() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);
  
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
          background-color: '#f8fafc';
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

export default withAdminAuth(AdminIndex);
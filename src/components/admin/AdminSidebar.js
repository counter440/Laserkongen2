import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FaHome, 
  FaBoxOpen, 
  FaUsers, 
  FaUpload, 
  FaCreditCard, 
  FaChartLine, 
  FaCog,
  FaSignOutAlt,
  FaStore
} from 'react-icons/fa';

export default function AdminSidebar({ isMobile, onCloseMobile }) {
  const router = useRouter();
  
  const handleNavigation = (path) => (e) => {
    e.preventDefault();
    router.push(path, undefined, { shallow: true });
    
    // Close mobile menu if on mobile
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };
  
  const handleLogout = () => {
    sessionStorage.removeItem('userInfo');
    router.push('/admin-login');
  };
  
  return (
    <div style={{ 
      width: isMobile ? '100%' : '240px', 
      backgroundColor: '#1e293b', 
      color: 'white', 
      padding: '20px 0', 
      minHeight: isMobile ? 'auto' : '100vh',
      position: isMobile ? 'fixed' : 'relative',
      top: isMobile ? '0' : 'auto',
      left: isMobile ? '0' : 'auto',
      right: isMobile ? '0' : 'auto',
      bottom: isMobile ? '0' : 'auto',
      zIndex: isMobile ? '1000' : '1',
      overflowY: 'auto'
    }}>
      <div style={{ 
        padding: '0 20px', 
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Admin Panel</h1>
        {isMobile && (
          <button
            onClick={onCloseMobile}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ×
          </button>
        )}
      </div>
      
      <nav>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li>
            <Link 
              href="/admin/dashboard"
              onClick={handleNavigation('/admin/dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '10px 20px',
                fontSize: '14px',
                textAlign: 'left',
                backgroundColor: router.pathname === '/admin/dashboard' || router.pathname === '/admin' ? '#334155' : 'transparent',
                color: 'white',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <span style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}><FaHome /></span>
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              href="/admin/orders"
              onClick={handleNavigation('/admin/orders')}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '10px 20px',
                fontSize: '14px',
                textAlign: 'left',
                backgroundColor: router.pathname === '/admin/orders' ? '#334155' : 'transparent',
                color: 'white',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <span style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}><FaBoxOpen /></span>
              Orders
            </Link>
          </li>
          <li>
            <Link 
              href="/admin/products"
              onClick={handleNavigation('/admin/products')}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '10px 20px',
                fontSize: '14px',
                textAlign: 'left',
                backgroundColor: router.pathname === '/admin/products' ? '#334155' : 'transparent',
                color: 'white',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <span style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}><FaStore /></span>
              Products
            </Link>
          </li>
          <li>
            <Link 
              href="/admin/users"
              onClick={handleNavigation('/admin/users')}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '10px 20px',
                fontSize: '14px',
                textAlign: 'left',
                backgroundColor: router.pathname === '/admin/users' ? '#334155' : 'transparent',
                color: 'white',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <span style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}><FaUsers /></span>
              Users
            </Link>
          </li>
          <li>
            <Link 
              href="/admin/uploads"
              onClick={handleNavigation('/admin/uploads')}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '10px 20px',
                fontSize: '14px',
                textAlign: 'left',
                backgroundColor: router.pathname === '/admin/uploads' ? '#334155' : 'transparent',
                color: 'white',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <span style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}><FaUpload /></span>
              Uploads
            </Link>
          </li>
          <li>
            <Link 
              href="/admin/payments"
              onClick={handleNavigation('/admin/payments')}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '10px 20px',
                fontSize: '14px',
                textAlign: 'left',
                backgroundColor: router.pathname === '/admin/payments' ? '#334155' : 'transparent',
                color: 'white',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <span style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}><FaCreditCard /></span>
              Payments
            </Link>
          </li>
          <li>
            <Link 
              href="/admin/reports"
              onClick={handleNavigation('/admin/reports')}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '10px 20px',
                fontSize: '14px',
                textAlign: 'left',
                backgroundColor: router.pathname === '/admin/reports' ? '#334155' : 'transparent',
                color: 'white',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <span style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}><FaChartLine /></span>
              Reports
            </Link>
          </li>
          <li>
            <Link 
              href="/admin/settings"
              onClick={handleNavigation('/admin/settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '10px 20px',
                fontSize: '14px',
                textAlign: 'left',
                backgroundColor: router.pathname === '/admin/settings' ? '#334155' : 'transparent',
                color: 'white',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <span style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}><FaCog /></span>
              Settings
            </Link>
          </li>
        </ul>
        
        <div style={{ borderTop: '1px solid #334155', margin: '20px 0', padding: '0 20px' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '10px 0',
              fontSize: '14px',
              textAlign: 'left',
              backgroundColor: 'transparent',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <span style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}><FaSignOutAlt /></span>
            Logg ut
          </button>
        </div>
      </nav>
    </div>
  );
}
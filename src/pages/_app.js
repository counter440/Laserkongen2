// Temporarily commenting out the globals.css import to avoid Tailwind issues
// import '@/styles/globals.css';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../contexts/AuthContext';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <CartProvider>
        <Component {...pageProps} />
      </CartProvider>
    </AuthProvider>
  );
}

export default MyApp;
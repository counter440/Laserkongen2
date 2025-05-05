import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FaCheck, FaArrowRight, FaSpinner } from 'react-icons/fa';
import Header from '../../components/Header';

const PaymentSuccess = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      // Vipps provides orderId as either 'orderId' or 'order_id' in the URL parameters
      const vippsOrderId = orderId || router.query.order_id;
      
      if (!vippsOrderId) return;

      try {
        setLoading(true);
        
        console.log('Fetching order details for order ID:', vippsOrderId);
        
        // Check the payment status
        const response = await fetch(`/api/payments/vipps/status?orderId=${vippsOrderId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Could not retrieve order details');
        }
        
        console.log('Payment status response:', data);
        setOrder(data.order);
        
        // Save order ID for confirmation page
        if (data.order && data.order.id) {
          localStorage.setItem('lastOrder', JSON.stringify(data.order));
          
          // Redirect to order confirmation after a short delay
          setTimeout(() => {
            router.push(`/order-confirmation?id=${data.order.id}`);
          }, 3000);
        } else {
          throw new Error('Order details incomplete');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError('Unable to retrieve your order details. Please contact customer support.');
      } finally {
        setLoading(false);
      }
    };

    // Only run the fetch once we have the router query parameters
    if (router.isReady) {
      fetchOrderDetails();
    }
  }, [orderId, router.query, router.isReady, router]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      <Header />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        padding: '2rem'
      }}>
      <Head>
        <title>Payment Successful | Laserkongen</title>
        <meta name="description" content="Your payment was successful" />
      </Head>
      
      <div style={{ 
        maxWidth: '500px', 
        width: '100%', 
        backgroundColor: 'white', 
        borderRadius: '0.75rem',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <FaSpinner style={{ fontSize: '2rem', color: '#0ea5e9', animation: 'spin 1s linear infinite' }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
              Verifying your payment...
            </h1>
            <p style={{ color: '#64748b' }}>Please wait while we verify your payment status.</p>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              backgroundColor: '#fee2e2', 
              borderRadius: '50%', 
              width: '4rem', 
              height: '4rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <span style={{ fontSize: '2rem', color: '#dc2626' }}>!</span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
              Payment Verification Error
            </h1>
            <p style={{ color: '#64748b' }}>{error}</p>
            <Link href="/cart" style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              color: '#0ea5e9', 
              fontWeight: 'bold',
              marginTop: '1rem',
              textDecoration: 'none'
            }}>
              Return to cart <FaArrowRight />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              backgroundColor: '#dcfce7', 
              borderRadius: '50%', 
              width: '4rem', 
              height: '4rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <FaCheck style={{ fontSize: '2rem', color: '#16a34a' }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
              Payment Successful!
            </h1>
            <p style={{ color: '#64748b' }}>
              Thank you for your purchase. Your order #{order?.id} has been confirmed.
            </p>
            <p style={{ color: '#64748b' }}>
              You'll be redirected to the order confirmation page shortly...
            </p>
            <div style={{ 
              margin: '1rem 0',
              width: '100%',
              height: '4px',
              backgroundColor: '#e2e8f0',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '30%',
                backgroundColor: '#10b981',
                borderRadius: '2px',
                animation: 'progress 3s linear forwards'
              }}></div>
            </div>
            <Link href={`/order-confirmation?id=${order?.id}`} style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              color: '#0ea5e9', 
              fontWeight: 'bold',
              textDecoration: 'none'
            }}>
              View order details <FaArrowRight />
            </Link>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
            Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
      </div>
    </div>
  );
};

export default PaymentSuccess;
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaExclamationCircle } from 'react-icons/fa';
import Header from '../../components/Header';

const PaymentCancel = () => {
  const router = useRouter();
  const [orderId, setOrderId] = useState(null);
  
  useEffect(() => {
    // Try to extract order ID from Vipps parameters if available
    if (router.isReady) {
      const vippsOrderId = router.query.orderId || router.query.order_id;
      
      if (vippsOrderId) {
        setOrderId(vippsOrderId);
        
        // Optional: Notify the backend that the payment was cancelled
        try {
          fetch(`/api/payments/vipps/status?orderId=${vippsOrderId}`).then(() => {
            console.log('Payment status checked after cancellation');
          });
        } catch (error) {
          console.error('Error notifying backend of cancelled payment:', error);
        }
      }
    }
  }, [router.isReady, router.query]);
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
        <title>Payment Cancelled | Laserkongen</title>
        <meta name="description" content="Your payment was cancelled" />
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
            <FaExclamationCircle style={{ fontSize: '2rem', color: '#dc2626' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
            Payment Cancelled
          </h1>
          <p style={{ color: '#64748b' }}>
            Your payment has been cancelled. No charges have been made to your account.
          </p>
          {orderId && (
            <p style={{ color: '#64748b', fontWeight: '500' }}>
              Order reference: #{orderId}
            </p>
          )}
          <p style={{ color: '#64748b' }}>
            You can return to the checkout page to try again or choose a different payment method.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <Link href="/cart" style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              backgroundColor: '#e2e8f0',
              color: '#334155',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              textDecoration: 'none'
            }}>
              <FaArrowLeft /> Return to cart
            </Link>
            <Link href="/checkout" style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              backgroundColor: '#0ea5e9',
              color: 'white',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              textDecoration: 'none'
            }}>
              Try again
            </Link>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
            Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
      `}</style>
      </div>
    </div>
  );
};

export default PaymentCancel;
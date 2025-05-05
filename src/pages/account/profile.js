import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import Header from '../../components/Header';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    try {
      setLoading(true);
      
      // Basic validation
      if (!name || !email) {
        throw new Error('Navn og e-post er påkrevd');
      }
      
      // Call the updateProfile function
      await updateProfile({
        name,
        email,
        phone
      });
      
      setSuccess(true);
      
      // Reset the success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message || 'Kunne ikke oppdatere profil');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Head>
          <title>Rediger profil | Laserkongen</title>
          <meta name="description" content="Oppdater din profilinformasjon på Laserkongen." />
        </Head>

        <Header />

        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold',
              color: '#1e3a8a'
            }}>Rediger profil</h1>
            
            <button
              onClick={() => router.push('/account')}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Tilbake til konto
            </button>
          </div>
          
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            {error && (
              <div style={{
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            
            {success && (
              <div style={{
                backgroundColor: '#dcfce7',
                color: '#166534',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                Profilen din har blitt oppdatert
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="name" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#64748b'
                  }}
                >
                  Navn
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px'
                  }}
                  placeholder="Ditt fulle navn"
                  required
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="email" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#64748b'
                  }}
                >
                  E-post
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px'
                  }}
                  placeholder="din.epost@eksempel.no"
                  required
                />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label 
                  htmlFor="phone" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#64748b'
                  }}
                >
                  Telefon
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px'
                  }}
                  placeholder="9XXXXXXXX"
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => router.push('/account/password')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Endre passord
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#1e3a8a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.9 : 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {loading && (
                    <div
                      style={{ 
                        width: '16px', 
                        height: '16px', 
                        border: '2px solid rgba(255, 255, 255, 0.3)', 
                        borderLeftColor: 'white', 
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}
                    />
                  )}
                  {loading ? 'Lagrer...' : 'Lagre endringer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;
import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import Header from '../../components/Header';

const PasswordPage = () => {
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('Alle feltene er påkrevd');
      }
      
      if (newPassword !== confirmPassword) {
        throw new Error('Passordene matcher ikke');
      }
      
      if (newPassword.length < 6) {
        throw new Error('Passordet må være minst 6 tegn');
      }
      
      // Call the updateProfile function with the password update
      await updateProfile({
        currentPassword,
        password: newPassword
      });
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setSuccess(true);
      
      // Reset the success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Password update error:', error);
      setError(error.message || 'Kunne ikke oppdatere passord');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Head>
          <title>Endre passord | Laserkongen</title>
          <meta name="description" content="Oppdater passordet for din Laserkongen-konto." />
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
            }}>Endre passord</h1>
            
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
                Passordet ditt har blitt oppdatert
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="currentPassword" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#64748b'
                  }}
                >
                  Nåværende passord
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px'
                  }}
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="newPassword" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#64748b'
                  }}
                >
                  Nytt passord
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px'
                  }}
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label 
                  htmlFor="confirmPassword" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#64748b'
                  }}
                >
                  Bekreft nytt passord
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px'
                  }}
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => router.push('/account/profile')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Tilbake til profil
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
                  {loading ? 'Oppdaterer...' : 'Oppdater passord'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default PasswordPage;
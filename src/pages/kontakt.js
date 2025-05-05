import React, { useState } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import { useCart } from '../context/CartContext';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';

export default function Kontakt() {
  const { cartItems } = useCart();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      setError('Vennligst fyll ut alle påkrevde felt');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Noe gikk galt. Vennligst prøv igjen senere.');
      }
      
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Noe gikk galt. Vennligst prøv igjen senere.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>Kontakt oss | Laserkongen</title>
        <meta name="description" content="Ta kontakt med Laserkongen for spørsmål om 3D-utskrift, lasergravering eller andre henvendelser." />
      </Head>
      
      <Header cartItemCount={cartItems.reduce((total, item) => total + item.quantity, 0)} />
      
      <main style={{ flexGrow: 1, backgroundColor: '#f8fafc' }}>
        {/* Hero section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', 
          padding: '60px 24px', 
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ 
              fontSize: '36px', 
              fontWeight: 'bold',
              marginBottom: '16px',
              letterSpacing: '-0.025em'
            }}>
              Kontakt Oss
            </h1>
            <p style={{ 
              fontSize: '18px',
              opacity: '0.9',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Vi er her for å hjelpe deg med alle dine spørsmål om 3D-utskrift og lasergravering.
            </p>
          </div>
        </div>
        
        {/* Contact content */}
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '60px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '40px',
          alignItems: 'start'
        }}>
          {/* Contact form */}
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            padding: '32px',
            gridColumn: { sm: 'span 1', md: 'span 2' }
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              marginBottom: '24px',
              color: '#0f172a'
            }}>
              Send oss en melding
            </h2>
            
            {submitted ? (
              <div style={{ 
                backgroundColor: '#dcfce7', 
                color: '#166534',
                padding: '16px',
                borderRadius: '6px',
                marginBottom: '16px'
              }}>
                <p style={{ margin: 0 }}>Takk for din henvendelse! Vi kommer tilbake til deg snarest mulig.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div style={{ 
                    backgroundColor: '#fee2e2', 
                    color: '#b91c1c',
                    padding: '16px',
                    borderRadius: '6px',
                    marginBottom: '16px'
                  }}>
                    <p style={{ margin: 0 }}>{error}</p>
                  </div>
                )}
                
                <div style={{ marginBottom: '20px' }}>
                  <label htmlFor="name" style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Navn *
                  </label>
                  <input 
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '16px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label htmlFor="email" style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    E-post *
                  </label>
                  <input 
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '16px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label htmlFor="subject" style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Emne
                  </label>
                  <input 
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '16px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <label htmlFor="message" style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Melding *
                  </label>
                  <textarea 
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '16px',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: '#0284c7',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? (
                    <>
                      <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                      Sender...
                    </>
                  ) : (
                    'Send melding'
                  )}
                </button>
              </form>
            )}
          </div>
          
          {/* Contact info */}
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            padding: '32px'
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              marginBottom: '24px',
              color: '#0f172a'
            }}>
              Kontaktinformasjon
            </h2>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                <div style={{ backgroundColor: '#e0f2fe', borderRadius: '50%', padding: '12px' }}>
                  <FaEnvelope size={20} color="#0284c7" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>E-post</h3>
                  <p style={{ color: '#64748b', margin: 0 }}>
                    <a href="mailto:kontakt@laserkongen.no" style={{ color: '#0284c7', textDecoration: 'none' }}>
                      kontakt@laserkongen.no
                    </a>
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                <div style={{ backgroundColor: '#e0f2fe', borderRadius: '50%', padding: '12px' }}>
                  <FaPhone size={20} color="#0284c7" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Telefon</h3>
                  <p style={{ color: '#64748b', margin: 0 }}>
                    <a href="tel:+4712345678" style={{ color: '#0284c7', textDecoration: 'none' }}>
                      +47 123 45 678
                    </a>
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ backgroundColor: '#e0f2fe', borderRadius: '50%', padding: '12px' }}>
                  <FaMapMarkerAlt size={20} color="#0284c7" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Adresse</h3>
                  <p style={{ color: '#64748b', margin: 0 }}>
                    Industriveien 42<br />
                    1482 Nittedal<br />
                    Norge
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Åpningstider</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Mandag - Fredag:</span>
                <span style={{ fontWeight: '600' }}>09:00 - 17:00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Lørdag:</span>
                <span style={{ fontWeight: '600' }}>10:00 - 15:00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Søndag:</span>
                <span style={{ fontWeight: '600' }}>Stengt</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer style={{ padding: '24px', borderTop: '1px solid #e2e8f0', marginTop: '40px', textAlign: 'center', backgroundColor: 'white' }}>
        <p style={{ margin: 0, color: '#64748b' }}>© {new Date().getFullYear()} Laserkongen. Alle rettigheter reservert.</p>
      </footer>
    </div>
  );
}
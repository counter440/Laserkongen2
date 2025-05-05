import React from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import { FaHistory, FaBullseye, FaPrint, FaLightbulb, FaUsers, FaAward } from 'react-icons/fa';
import { useCart } from '../context/CartContext';

export default function OmOss() {
  const { cartItems } = useCart();
  
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>Om Oss | Laserkongen</title>
        <meta name="description" content="Les om historien til Laserkongen, vår visjon og hva vi tilbyr av 3D-utskrift og lasergravering." />
      </Head>
      
      <Header cartItemCount={cartItems.reduce((total, item) => total + item.quantity, 0)} />
      
      <main style={{ flexGrow: 1, backgroundColor: '#f8fafc' }}>
        {/* Hero section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', 
          padding: '80px 24px', 
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative elements */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '5%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
            zIndex: 1
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '10%',
            right: '5%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
            zIndex: 1
          }}></div>
          
          <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto',
            position: 'relative',
            zIndex: 2,
            textAlign: 'center'
          }}>
            <h1 style={{ 
              fontSize: '42px', 
              fontWeight: '800', 
              marginBottom: '16px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              letterSpacing: '-0.025em'
            }}>
              Om Laserkongen
            </h1>
            <p style={{ 
              fontSize: '18px', 
              maxWidth: '600px', 
              margin: '0 auto',
              opacity: '0.9',
              lineHeight: '1.5'
            }}>
              Et ledende selskap innen 3D-utskrift og lasergravering i Norge
            </p>
          </div>
        </div>
        
        {/* Our story section */}
        <section style={{ padding: '80px 24px', backgroundColor: 'white' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              marginBottom: '48px'
            }}>
              <div style={{ 
                backgroundColor: '#e0f2fe', 
                borderRadius: '50%', 
                width: '80px', 
                height: '80px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <FaHistory size={32} color="#0284c7" />
              </div>
              <h2 style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                marginBottom: '16px',
                color: '#0f172a'
              }}>
                Vår Historie
              </h2>
              <div style={{ 
                width: '80px', 
                height: '4px', 
                background: 'linear-gradient(90deg, transparent, #0ea5e9, transparent)', 
                marginBottom: '32px' 
              }}></div>
            </div>
            
            <div style={{ 
              lineHeight: '1.8', 
              color: '#334155',
              fontSize: '17px'
            }}>
              <p>
                Laserkongen ble grunnlagt i 2016 av tre venner med en lidenskap for teknologi og innovasjon i den sjarmerende kommunen Nittedal, like nord for Oslo. Det hele startet i et nedlagt brannstasjonslokale i Hakadal, som vi omgjorde til vårt første verksted.
              </p>
              
              <p>
                Grunnleggerne, Erik Nilsen, Marte Svendsen og Lars Johansen, hadde alle bakgrunn fra ulike tekniske felt. Erik var ingeniør med spesialisering i mekanisk design, Marte kom fra en bakgrunn innen grafisk design, og Lars hadde erfaring med programmering og digitale fabrikasjonsteknikker.
              </p>
              
              <p>
                Den første maskinen var en hjemmebygget 3D-printer som Erik hadde satt sammen i garasjen sin. På den tiden var 3D-printing fortsatt en relativt ny teknologi for allmennheten, og vi så et stort potensial i å gjøre denne teknologien tilgjengelig for lokale bedrifter og privatpersoner i Nittedalsområdet.
              </p>
              
              <p>
                Etter hvert som bestillingene begynte å strømme inn fra lokale kunder, investerte vi i profesjonelt utstyr og utvidet tjenestene til å omfatte lasergravering. Navnet "Laserkongen" kom faktisk fra et kallenavn Lars fikk etter å ha brukt utallige timer på å perfeksjonere lasergravering på ulike materialer, og navnet festet seg raskt.
              </p>
              
              <p>
                Et gjennombrudd kom i 2019 da vi fikk et stort oppdrag fra Nittedal kommune for å produsere spesialtilpassede komponenter til deres nye kulturhus. Dette prosjektet satte oss virkelig på kartet og ga oss muligheten til å flytte til større lokaler i Industriveien, der vi fortsatt holder til i dag.
              </p>
              
              <p>
                I løpet av årene har vi utvidet teamet vårt til å inkludere flere dyktige teknikere, designere og kundeservicerepresentanter. Vi har også investert betydelig i toppmoderne utstyr for å kunne tilby raskere leveringstider, høyere kvalitet og mer komplekse design til våre kunder.
              </p>
              
              <p>
                I dag er Laserkongen kjent som den ledende leverandøren av 3D-utskrift og lasergravering i Nittedal og omegn, og vi betjener kunder over hele Norge gjennom vår nettbutikk og leveringstjeneste.
              </p>
            </div>
          </div>
        </section>
        
        {/* Vision and mission */}
        <section style={{ padding: '80px 24px', backgroundColor: '#f1f5f9' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '80px',
              flexWrap: 'wrap'
            }}>
              <div style={{ 
                maxWidth: '450px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <div style={{ 
                  backgroundColor: '#e0f2fe', 
                  borderRadius: '50%', 
                  width: '80px', 
                  height: '80px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <FaBullseye size={32} color="#0284c7" />
                </div>
                <h2 style={{ 
                  fontSize: '28px', 
                  fontWeight: 'bold', 
                  marginBottom: '16px',
                  color: '#0f172a'
                }}>
                  Vår Visjon
                </h2>
                <div style={{ 
                  width: '60px', 
                  height: '4px', 
                  background: 'linear-gradient(90deg, transparent, #0ea5e9, transparent)', 
                  marginBottom: '24px' 
                }}></div>
                
                <p style={{ lineHeight: '1.8', color: '#334155' }}>
                  Vi ønsker å demokratisere tilgangen til moderne produksjonsteknologier, slik at alle – fra privatpersoner til små og mellomstore bedrifter – kan realisere sine kreative ideer og innovative løsninger gjennom 3D-utskrift og lasergravering.
                </p>
              </div>
              
              <div style={{ 
                maxWidth: '450px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <div style={{ 
                  backgroundColor: '#e0f2fe', 
                  borderRadius: '50%', 
                  width: '80px', 
                  height: '80px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <FaLightbulb size={32} color="#0284c7" />
                </div>
                <h2 style={{ 
                  fontSize: '28px', 
                  fontWeight: 'bold', 
                  marginBottom: '16px',
                  color: '#0f172a'
                }}>
                  Vår Misjon
                </h2>
                <div style={{ 
                  width: '60px', 
                  height: '4px', 
                  background: 'linear-gradient(90deg, transparent, #0ea5e9, transparent)', 
                  marginBottom: '24px' 
                }}></div>
                
                <p style={{ lineHeight: '1.8', color: '#334155' }}>
                  Å levere førsteklasses 3D-utskrifter og lasergravering med høy kvalitet, rask leveringstid og personlig service, samtidig som vi fremmer bærekraft og innovasjon i alt vi gjør.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Our values */}
        <section style={{ padding: '80px 24px', backgroundColor: 'white' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              marginBottom: '48px'
            }}>
              <div style={{ 
                backgroundColor: '#e0f2fe', 
                borderRadius: '50%', 
                width: '80px', 
                height: '80px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <FaUsers size={32} color="#0284c7" />
              </div>
              <h2 style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                marginBottom: '16px',
                color: '#0f172a'
              }}>
                Våre Verdier
              </h2>
              <div style={{ 
                width: '80px', 
                height: '4px', 
                background: 'linear-gradient(90deg, transparent, #0ea5e9, transparent)', 
                marginBottom: '32px' 
              }}></div>
            </div>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '32px'
            }}>
              <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#0f172a' }}>Kvalitet</h3>
                <p style={{ color: '#334155', lineHeight: '1.6' }}>
                  Vi er kompromissløse når det gjelder kvaliteten på våre produkter og tjenester. Hver utskrift og gravering gjennomgår streng kvalitetskontroll før den sendes til kunden.
                </p>
              </div>
              
              <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#0f172a' }}>Innovasjon</h3>
                <p style={{ color: '#334155', lineHeight: '1.6' }}>
                  Vi omfavner konstant utvikling og holder oss oppdatert på de nyeste teknologiene og teknikkene innen 3D-utskrift og lasergravering.
                </p>
              </div>
              
              <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#0f172a' }}>Bærekraft</h3>
                <p style={{ color: '#334155', lineHeight: '1.6' }}>
                  Vi er forpliktet til miljøvennlige løsninger, ved å bruke bærekraftige materialer og minimere avfall i våre produksjonsprosesser.
                </p>
              </div>
              
              <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#0f172a' }}>Kundefokus</h3>
                <p style={{ color: '#334155', lineHeight: '1.6' }}>
                  Vi setter våre kunder i sentrum av alt vi gjør, og streber etter å overstige deres forventninger med personlig service og raske leveringstider.
                </p>
              </div>
              
              <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#0f172a' }}>Samarbeid</h3>
                <p style={{ color: '#334155', lineHeight: '1.6' }}>
                  Vi tror på styrken i samarbeid, både internt i vårt team og med våre kunder og partnere, for å oppnå de beste resultatene.
                </p>
              </div>
              
              <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#0f172a' }}>Lokalsamfunnet</h3>
                <p style={{ color: '#334155', lineHeight: '1.6' }}>
                  Vi er stolte av vår tilknytning til Nittedal og støtter aktivt lokale initiativer, skoler og bedrifter gjennom ulike sponsorprogrammer.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Our team */}
        <section style={{ padding: '80px 24px', backgroundColor: '#f1f5f9' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              marginBottom: '48px'
            }}>
              <div style={{ 
                backgroundColor: '#e0f2fe', 
                borderRadius: '50%', 
                width: '80px', 
                height: '80px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <FaAward size={32} color="#0284c7" />
              </div>
              <h2 style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                marginBottom: '16px',
                color: '#0f172a'
              }}>
                Våre Prestasjoner
              </h2>
              <div style={{ 
                width: '80px', 
                height: '4px', 
                background: 'linear-gradient(90deg, transparent, #0ea5e9, transparent)', 
                marginBottom: '32px' 
              }}></div>
            </div>
            
            <div style={{ 
              lineHeight: '1.8', 
              color: '#334155',
              fontSize: '17px',
              textAlign: 'center',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              <p>
                Vi er stolte over å ha blitt kåret til "Årets gründerbedrift i Nittedal" i 2020, og vi har vært nominert til flere priser innen innovasjon og håndverk. I 2022 ble vi omtalt i fagbladet "Moderne Produksjon" for vårt banebrytende arbeid med 3D-printet medisinsk utstyr.
              </p>
              
              <p>
                Vårt team har vokst fra tre til femten engasjerte medarbeidere, og vi har ekspandert fra et lite verksted til moderne fasiliteter på over 500 kvadratmeter. Vi har betjent mer enn 2000 kunder, fra enkeltpersoner med kreative ideer til bedrifter som trenger prototyper og spesialtilpassede komponenter.
              </p>
              
              <p>
                Men det vi er mest stolte av, er alle de kreative prosjektene vi har hjulpet våre kunder med å realisere og de positive tilbakemeldingene vi mottar hver dag.
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <footer style={{ padding: '24px', borderTop: '1px solid #e2e8f0', marginTop: '0', textAlign: 'center', backgroundColor: 'white' }}>
        <p style={{ margin: 0, color: '#64748b' }}>© {new Date().getFullYear()} Laserkongen. Alle rettigheter reservert.</p>
      </footer>
    </div>
  );
}
import React, { useState } from 'react';
import Head from 'next/head';

export default function SimplePage() {
  const [modelData, setModelData] = useState({
    volume: 125, // cm³
    weight: 150, // grams
    dimensions: { x: 10, y: 8, z: 5 }, // cm
    printTime: 3.5, // hours
  });
  
  const [options, setOptions] = useState({
    material: 'pla',
    quality: 'standard',
    infill: 20
  });
  
  const calculatePrice = () => {
    const materialPrices = {
      pla: 0.05,
      abs: 0.06,
      petg: 0.07,
    };
    
    const qualityMultipliers = {
      draft: 0.8,
      standard: 1.0,
      high: 1.3,
    };
    
    const materialCost = modelData.weight * materialPrices[options.material];
    const qualityCost = materialCost * qualityMultipliers[options.quality];
    const infillMultiplier = 0.7 + (options.infill / 100) * 0.6;
    const adjustedCost = qualityCost * infillMultiplier;
    const timeCost = modelData.printTime * 5; // $5 per hour
    
    return (adjustedCost + timeCost).toFixed(2);
  };
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <Head>
        <title>3D Print Calculator | Laserkongen</title>
        <meta name="description" content="Calculate the price of your 3D prints based on material, quality, and infill settings." />
      </Head>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        Laserkongen 3D Print Calculator
      </h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '5px', padding: '15px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
            Model Information
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>Volume:</div>
            <div>{modelData.volume} cm³</div>
            
            <div>Weight:</div>
            <div>{modelData.weight} g</div>
            
            <div>Dimensions:</div>
            <div>
              {modelData.dimensions.x} × {modelData.dimensions.y} × {modelData.dimensions.z} cm
            </div>
            
            <div>Print Time:</div>
            <div>{modelData.printTime} hours</div>
          </div>
        </div>
        
        <div style={{ border: '1px solid #ddd', borderRadius: '5px', padding: '15px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
            Print Settings
          </h2>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Material</label>
            <select 
              value={options.material}
              onChange={(e) => setOptions({...options, material: e.target.value})}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="pla">PLA</option>
              <option value="abs">ABS</option>
              <option value="petg">PETG</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Quality</label>
            <select 
              value={options.quality}
              onChange={(e) => setOptions({...options, quality: e.target.value})}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="draft">Draft (0.3mm layer height)</option>
              <option value="standard">Standard (0.2mm layer height)</option>
              <option value="high">High (0.1mm layer height)</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Infill: {options.infill}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={options.infill}
              onChange={(e) => setOptions({...options, infill: parseInt(e.target.value)})}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        
        <div style={{ border: '1px solid #ddd', borderRadius: '5px', padding: '15px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
            Price Calculation
          </h2>
          
          <div style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            textAlign: 'center',
            margin: '20px 0'
          }}>
            ${calculatePrice()}
          </div>
          
          <button 
            onClick={() => alert('Added to cart!')}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#0284c7',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Add to Cart
          </button>
        </div>
      </div>
      
      <div style={{ marginTop: '30px', padding: '20px 0', borderTop: '1px solid #ddd' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
          Admin Dashboard Preview
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '10px',
          marginBottom: '20px'
        }}>
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '5px', 
            padding: '10px',
            backgroundColor: '#eff6ff' 
          }}>
            <div style={{ fontWeight: 'bold' }}>Total Orders</div>
            <div style={{ fontSize: '18px' }}>124</div>
          </div>
          
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '5px', 
            padding: '10px',
            backgroundColor: '#f0fdf4' 
          }}>
            <div style={{ fontWeight: 'bold' }}>Revenue</div>
            <div style={{ fontSize: '18px' }}>$12,850.75</div>
          </div>
          
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '5px', 
            padding: '10px',
            backgroundColor: '#fefce8' 
          }}>
            <div style={{ fontWeight: 'bold' }}>Pending Orders</div>
            <div style={{ fontSize: '18px' }}>18</div>
          </div>
        </div>
        
        <p style={{ color: '#666', marginTop: '20px' }}>
          The full application includes comprehensive order management, advanced 3D model analysis,
          and a complete e-commerce platform with products, user accounts, and more.
        </p>
      </div>
    </div>
  );
}
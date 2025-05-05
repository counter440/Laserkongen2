import React, { useEffect, useState } from 'react';
import { FaQuestionCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function ModelAnalysisPanel({ modelData, options = {}, onOptionsChange }) {
  const [recommendations, setRecommendations] = useState(null);
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (modelData) {
      // In a real app, this would call the backend API to get recommendations
      // and cost breakdown. Here we're simulating it with local calculations.
      generateRecommendations(modelData);
      calculateCostBreakdown(modelData, options);
    }
  }, [modelData, options]);

  const generateRecommendations = (data) => {
    // Simulate backend recommendation logic
    const recs = {
      suggestedMaterial: null,
      suggestedQuality: null,
      suggestedInfill: null,
      warningMessages: [],
      optimizationTips: []
    };
    
    // Recommend material based on model size
    if (data.dimensions.z > 15) {
      recs.suggestedMaterial = 'pla';
      recs.optimizationTips.push('Use PLA for tall prints to minimize warping');
    } else if (data.volume > 200) {
      recs.suggestedMaterial = 'petg';
      recs.optimizationTips.push('PETG is recommended for large volumes for better layer adhesion');
    }
    
    // Recommend quality based on complexity
    const complexity = data.triangleCount > 100000 ? 'high' : data.triangleCount > 50000 ? 'medium' : 'low';
    if (complexity === 'high') {
      recs.suggestedQuality = 'high';
      recs.optimizationTips.push('High quality recommended for complex geometry');
    } else if (complexity === 'low') {
      recs.suggestedQuality = 'draft';
      recs.optimizationTips.push('Draft quality is sufficient for simple geometry');
    } else {
      recs.suggestedQuality = 'standard';
    }
    
    // Recommend infill based on model properties
    if (data.weight > 200) {
      recs.suggestedInfill = 15;
      recs.optimizationTips.push('Lower infill recommended for heavy models to save material');
    } else if (data.dimensions.z > 10 && data.dimensions.x < 5 && data.dimensions.y < 5) {
      recs.suggestedInfill = 30;
      recs.optimizationTips.push('Higher infill recommended for tall, thin objects for stability');
    } else {
      recs.suggestedInfill = 20;
    }
    
    // Add warnings for large models
    if (data.printTime > 8) {
      recs.warningMessages.push('Print time exceeds 8 hours, consider splitting the model if possible');
    }
    
    if (data.dimensions.x > 20 || data.dimensions.y > 20 || data.dimensions.z > 20) {
      recs.warningMessages.push('Model exceeds 20cm in one or more dimensions, check printer build volume');
    }
    
    setRecommendations(recs);
  };

  const calculateCostBreakdown = (data, opts) => {
    const material = opts.material || 'pla';
    const quality = opts.quality || 'standard';
    const infill = opts.infill || 20;
    
    // Material cost based on weight and material price per gram
    const materialPrices = {
      pla: 0.04,  // $ per gram (further increased)
      abs: 0.045,
      petg: 0.05,
      tpu: 0.08,
      nylon: 0.1
    };
    
    // Quality multipliers affect both material and time
    const qualityMultipliers = {
      draft: 0.8,
      standard: 1.0,
      high: 1.6 // significant premium for high quality
    };
    
    // Infill affects material cost
    const infillMultiplier = 0.7 + (infill / 100) * 0.7; // stronger infill impact
    
    // Calculate costs
    const materialCost = data.weight * materialPrices[material];
    const adjustedMaterialCost = materialCost * qualityMultipliers[quality] * infillMultiplier;
    
    // Machine time cost
    const hourlyRate = 6.5; // $6.50/hour
    const timeScalingFactor = 0.9; // only 10% reduction
    const timeCost = data.printTime * hourlyRate * timeScalingFactor;
    
    // Apply final pricing adjustment
    const totalPriceDiscountFactor = 1.0; // no discount at all
    const rawTotalCost = adjustedMaterialCost + timeCost;
    let totalCost = rawTotalCost * totalPriceDiscountFactor;
    
    // Apply minimum price of 99 NOK (equivalent to $9.43 at 10.5 exchange rate)
    const minPriceUSD = 99 / 10.5;
    totalCost = Math.max(totalCost, minPriceUSD);
    
    // Adjust component costs proportionally if minimum price is applied
    let adjustedMaterialCostFinal = adjustedMaterialCost * totalPriceDiscountFactor;
    let timeCostFinal = timeCost * totalPriceDiscountFactor;
    
    if (totalCost > rawTotalCost * totalPriceDiscountFactor) {
      const ratio = totalCost / (rawTotalCost * totalPriceDiscountFactor);
      adjustedMaterialCostFinal *= ratio;
      timeCostFinal *= ratio;
    }
    
    setCostBreakdown({
      materialCost: adjustedMaterialCostFinal.toFixed(2),
      timeCost: timeCostFinal.toFixed(2),
      totalCost: totalCost.toFixed(2),
      breakdown: {
        material,
        quality,
        infill,
        baseMaterialCost: materialCost.toFixed(2),
        qualityMultiplier: qualityMultipliers[quality],
        infillMultiplier: infillMultiplier.toFixed(2),
        hourlyRate,
        timeScalingFactor: timeScalingFactor,
        totalPriceDiscountFactor: totalPriceDiscountFactor
      }
    });
  };

  const applyRecommendations = () => {
    if (!recommendations) return;
    
    const newOptions = { ...options };
    if (recommendations.suggestedMaterial) {
      newOptions.material = recommendations.suggestedMaterial;
    }
    if (recommendations.suggestedQuality) {
      newOptions.quality = recommendations.suggestedQuality;
    }
    if (recommendations.suggestedInfill) {
      newOptions.infill = recommendations.suggestedInfill;
    }
    
    onOptionsChange(newOptions);
  };

  if (!modelData) {
    return (
      <div style={{padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px'}}>
        <p style={{color: '#6b7280'}}>Last opp en 3D-modell for å se analyse</p>
      </div>
    );
  }

  return (
    <div style={{padding: '24px', border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: 'white'}}>
      <h2 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center'}}>
        Modellanalyse
        <FaInfoCircle style={{marginLeft: '8px', color: '#0ea5e9', cursor: 'pointer'}} title="Analyse av din 3D-modell" />
      </h2>
      
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
        <div>
          <h3 style={{fontWeight: 'bold', marginBottom: '12px'}}>Modellegenskaper</h3>
          <table style={{width: '100%', fontSize: '14px'}}>
            <tbody>
              <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                <td style={{padding: '8px 0', fontWeight: '500'}}>Volum</td>
                <td style={{padding: '8px 0', textAlign: 'right'}}>{modelData.volume} cm³</td>
              </tr>
              <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                <td style={{padding: '8px 0', fontWeight: '500'}}>Estimert vekt</td>
                <td style={{padding: '8px 0', textAlign: 'right'}}>{modelData.weight} g</td>
              </tr>
              <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                <td style={{padding: '8px 0', fontWeight: '500'}}>Dimensjoner</td>
                <td style={{padding: '8px 0', textAlign: 'right'}}>
                  {modelData.dimensions.x} × {modelData.dimensions.y} × {modelData.dimensions.z} cm
                </td>
              </tr>
              <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                <td style={{padding: '8px 0', fontWeight: '500'}}>Estimert utskriftstid</td>
                <td style={{padding: '8px 0', textAlign: 'right'}}>{modelData.printTime} timer</td>
              </tr>
              {showAdvanced && (
                <>
                  <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                    <td style={{padding: '8px 0', fontWeight: '500'}}>Antall trekanter</td>
                    <td style={{padding: '8px 0', textAlign: 'right'}}>{modelData.triangleCount?.toLocaleString()}</td>
                  </tr>
                  <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                    <td style={{padding: '8px 0', fontWeight: '500'}}>Antall lag (est.)</td>
                    <td style={{padding: '8px 0', textAlign: 'right'}}>{modelData.layerCount}</td>
                  </tr>
                  <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                    <td style={{padding: '8px 0', fontWeight: '500'}}>Kompleksitet</td>
                    <td style={{padding: '8px 0', textAlign: 'right'}}>{modelData.complexity || 'Medium'}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
          
          <button 
            style={{color: '#0ea5e9', fontSize: '14px', marginTop: '8px', background: 'none', border: 'none', cursor: 'pointer'}}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Vis mindre' : 'Vis avanserte målinger'}
          </button>
        </div>
        
        <div>
          <h3 style={{fontWeight: 'bold', marginBottom: '12px'}}>Kostnadsberegning</h3>
          {costBreakdown && (
            <>
              <div style={{backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '8px', marginBottom: '16px'}}>
                <div style={{fontSize: '24px', fontWeight: 'bold', textAlign: 'center', color: '#0284c7'}}>
                  kr {(parseFloat(costBreakdown.totalCost) * 10.5).toFixed(2)}
                </div>
                <div style={{fontSize: '12px', textAlign: 'center', color: '#6b7280'}}>
                  {(parseFloat(costBreakdown.totalCost) * 10.5).toFixed(2) === '99.00' ? 
                    'Minstepris (kr 99) anvendt' : 
                    'Estimert totalkostnad'}
                </div>
              </div>
              
              <table style={{width: '100%', fontSize: '14px'}}>
                <tbody>
                  <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                    <td style={{padding: '8px 0', fontWeight: '500'}}>Materialkostnad</td>
                    <td style={{padding: '8px 0', textAlign: 'right'}}>
                      kr {(parseFloat(costBreakdown.materialCost) * 10.5).toFixed(2)}
                    </td>
                  </tr>
                  <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                    <td style={{padding: '8px 0', fontWeight: '500'}}>Maskintidskostnad</td>
                    <td style={{padding: '8px 0', textAlign: 'right'}}>
                      kr {(parseFloat(costBreakdown.timeCost) * 10.5).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
              
              {showAdvanced && (
                <div style={{marginTop: '16px'}}>
                  <h4 style={{fontWeight: '500', marginBottom: '8px'}}>Prisberegningsfaktorer</h4>
                  <div style={{fontSize: '12px', color: '#6b7280'}}>
                    <div style={{marginBottom: '4px'}}>- Basismaterialkostnad: kr {(parseFloat(costBreakdown.breakdown.baseMaterialCost) * 10.5).toFixed(2)} (basert på vekt og materiale)</div>
                    <div style={{marginBottom: '4px'}}>- Kvalitetsmultiplikator: {costBreakdown.breakdown.qualityMultiplier}x (basert på laghøyde)</div>
                    <div style={{marginBottom: '4px'}}>- Fyllingsmultiplikator: {costBreakdown.breakdown.infillMultiplier}x (basert på fyllingsgrad %)</div>
                    <div style={{marginBottom: '4px'}}>- Maskintakst: kr {(costBreakdown.breakdown.hourlyRate * 10.5).toFixed(2)}/time</div>
                    <div style={{marginBottom: '4px'}}>- Tidskostnad rabatt: {costBreakdown.breakdown.timeScalingFactor}x (10% reduksjon)</div>
                    <div style={{marginBottom: '4px'}}>- Minsteprisen er kr 99 (uavhengig av størrelse)</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {recommendations && recommendations.warningMessages.length > 0 && (
        <div style={{marginTop: '24px', backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px', padding: '16px'}}>
          <h3 style={{fontWeight: 'bold', display: 'flex', alignItems: 'center', color: '#854d0e', marginBottom: '8px'}}>
            <FaExclamationTriangle style={{marginRight: '8px'}} /> Advarsler
          </h3>
          <ul style={{fontSize: '14px', color: '#854d0e', paddingLeft: '20px', listStyleType: 'disc'}}>
            {recommendations.warningMessages.map((warning, index) => (
              <li key={`warning-${index}`} style={{marginBottom: '4px'}}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      
      {recommendations && recommendations.optimizationTips.length > 0 && (
        <div style={{marginTop: '16px'}}>
          <h3 style={{fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center'}}>
            <FaQuestionCircle style={{marginRight: '8px', color: '#0ea5e9'}} /> Anbefalte utskriftsinnstillinger
          </h3>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px'}}>
            {recommendations.suggestedMaterial && (
              <div style={{backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px'}}>
                <div style={{fontWeight: '500'}}>Materiale</div>
                <div style={{textTransform: 'uppercase'}}>{recommendations.suggestedMaterial}</div>
              </div>
            )}
            
            {recommendations.suggestedQuality && (
              <div style={{backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px'}}>
                <div style={{fontWeight: '500'}}>Kvalitet</div>
                <div style={{textTransform: 'capitalize'}}>{recommendations.suggestedQuality}</div>
              </div>
            )}
            
            {recommendations.suggestedInfill && (
              <div style={{backgroundColor: '#faf5ff', padding: '12px', borderRadius: '8px'}}>
                <div style={{fontWeight: '500'}}>Fyllingsgrad</div>
                <div>{recommendations.suggestedInfill}%</div>
              </div>
            )}
          </div>
          
          <button 
            style={{
              backgroundColor: '#0ea5e9',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer'
            }}
            onClick={applyRecommendations}
          >
            Bruk anbefalte innstillinger
          </button>
          
          <div style={{marginTop: '16px'}}>
            <h4 style={{fontWeight: '500', marginBottom: '8px'}}>Optimaliseringstips</h4>
            <ul style={{fontSize: '14px', color: '#4b5563', paddingLeft: '20px', listStyleType: 'disc'}}>
              {recommendations.optimizationTips.map((tip, index) => (
                <li key={`tip-${index}`} style={{marginBottom: '4px'}}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
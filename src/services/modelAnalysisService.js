/**
 * Frontend service for interacting with the model analysis API
 */

const API_URL = '/api/model-analysis';

/**
 * Upload and analyze a 3D model
 * @param {File} modelFile - The 3D model file to analyze
 * @param {Object} options - Print options (material, quality, infill)
 * @returns {Promise<Object>} Analysis results including model data and cost breakdown
 */
export const analyzeModel = async (modelFile, options = {}) => {
  try {
    const formData = new FormData();
    formData.append('model', modelFile);
    
    // Add options to form data
    if (options.material) formData.append('material', options.material);
    if (options.quality) formData.append('quality', options.quality);
    if (options.infill) formData.append('infill', options.infill.toString());
    
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error analyzing model');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in model analysis service:', error);
    throw error;
  }
};

/**
 * Get the current model analyzer settings
 * @returns {Promise<Object>} Current settings
 */
export const getAnalyzerSettings = async () => {
  try {
    const response = await fetch(`${API_URL}/settings`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error getting analyzer settings');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting analyzer settings:', error);
    throw error;
  }
};

/**
 * Update model analyzer settings
 * @param {Object} settings - New settings to apply
 * @returns {Promise<Object>} Success message
 */
export const updateAnalyzerSettings = async (settings) => {
  try {
    const response = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error updating analyzer settings');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating analyzer settings:', error);
    throw error;
  }
};

/**
 * Mock implementation for frontend testing without a backend
 * @param {File} modelFile - The 3D model file
 * @returns {Promise<Object>} Mock analysis data
 */
export const mockAnalyzeModel = async (modelFile) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate realistic mock data based on file size
  const fileSizeInMB = modelFile.size / (1024 * 1024);
  
  // Model data
  const volume = Math.floor(fileSizeInMB * 50 + 30);
  const weight = Math.floor(volume * 1.24 * 0.7); // PLA density * infill factor
  const maxDimension = Math.pow(volume, 1/3) * 2;
  
  const dimensions = {
    x: (Math.random() * maxDimension + maxDimension/2).toFixed(1),
    y: (Math.random() * maxDimension + maxDimension/2).toFixed(1),
    z: (Math.random() * maxDimension + maxDimension/4).toFixed(1)
  };
  
  const printTime = (volume / 6000).toFixed(1);
  const triangleCount = Math.floor(fileSizeInMB * 10000 + 1000);
  const layerCount = Math.floor(dimensions.z / 0.2);
  
  return {
    success: true,
    modelData: {
      volume,
      weight,
      dimensions,
      printTime,
      triangleCount,
      layerCount,
      complexity: triangleCount > 100000 ? 'high' : triangleCount > 50000 ? 'medium' : 'low',
      hollowness: 70,
      surfaceArea: Math.floor(volume * 1.5)
    },
    recommendations: {
      suggestedMaterial: dimensions.z > 15 ? 'pla' : (volume > 200 ? 'petg' : null),
      suggestedQuality: triangleCount > 100000 ? 'high' : (triangleCount < 50000 ? 'draft' : 'standard'),
      suggestedInfill: weight > 200 ? 15 : (dimensions.z > 10 && dimensions.x < 5 && dimensions.y < 5 ? 30 : 20),
      warningMessages: [
        ...(printTime > 8 ? ['Print time exceeds 8 hours, consider splitting the model if possible'] : []),
        ...(Math.max(dimensions.x, dimensions.y, dimensions.z) > 20 ? ['Model exceeds 20cm in one or more dimensions, check printer build volume'] : [])
      ],
      optimizationTips: [
        ...(dimensions.z > 15 ? ['Use PLA for tall prints to minimize warping'] : []),
        ...(volume > 200 ? ['PETG is recommended for large volumes for better layer adhesion'] : []),
        triangleCount > 100000 ? 'High quality recommended for complex geometry' : (triangleCount < 50000 ? 'Draft quality is sufficient for simple geometry' : '')
      ].filter(Boolean)
    },
    fileInfo: {
      filename: modelFile.name,
      originalname: modelFile.name,
      size: modelFile.size
    }
  };
};
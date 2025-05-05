/**
 * Controller for 3D model analysis
 */

const ModelAnalyzerService = require('../services/ModelAnalyzerService');

// Analyze a 3D model file
exports.analyzeModel = async (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Get options from request body
    const options = {
      material: req.body.material || 'pla',
      quality: req.body.quality || 'standard',
      infill: req.body.infill ? parseInt(req.body.infill) : 20
    };
    
    // Analyze the model
    const analysisResults = await ModelAnalyzerService.analyzeModel(file, options);
    
    // Calculate cost with fresh data (not from cache)
    const costBreakdown = ModelAnalyzerService.calculatePrintCost(analysisResults, options);
    
    // Get recommendations
    const recommendations = ModelAnalyzerService.getRecommendations(analysisResults);
    
    // Return the full analysis results
    res.status(200).json({
      success: true,
      modelData: analysisResults,
      costBreakdown,
      recommendations,
      fileInfo: {
        filename: file.filename,
        originalname: file.originalname,
        size: file.size
      }
    });
  } catch (error) {
    console.error('Error analyzing model:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error analyzing model',
      error: error.message
    });
  }
};

// Update analyzer settings
exports.updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    if (!settings) {
      return res.status(400).json({ message: 'No settings provided' });
    }
    
    ModelAnalyzerService.updateConfig(settings);
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating settings',
      error: error.message
    });
  }
};

// Get current analyzer settings
exports.getSettings = async (req, res) => {
  try {
    const settings = {
      materialDensities: ModelAnalyzerService.materialDensities,
      printSpeeds: ModelAnalyzerService.printSpeeds,
      machineHourlyRate: ModelAnalyzerService.machineHourlyRate,
      defaultInfill: ModelAnalyzerService.defaultInfill
    };
    
    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error getting settings',
      error: error.message
    });
  }
};

// Clear the cache to refresh analysis results
exports.clearCache = async (req, res) => {
  try {
    const result = ModelAnalyzerService.clearCache();
    
    res.status(200).json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error clearing cache',
      error: error.message
    });
  }
};
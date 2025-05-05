/**
 * Routes for 3D model analysis
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const modelAnalysisController = require('../controllers/modelAnalysisController');

// Set up storage for uploaded 3D models
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/3d-models/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'model-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for 3D models
const fileFilter = function (req, file, cb) {
  const allowedExtensions = ['.stl', '.obj', '.3mf'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only 3D model files (STL, OBJ, 3MF) are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Route to analyze a 3D model
router.post('/analyze', upload.single('model'), modelAnalysisController.analyzeModel);

// Route to update analyzer settings
router.put('/settings', modelAnalysisController.updateSettings);

// Route to get current analyzer settings
router.get('/settings', modelAnalysisController.getSettings);

// Route to clear analysis cache
router.post('/clear-cache', modelAnalysisController.clearCache);

module.exports = router;
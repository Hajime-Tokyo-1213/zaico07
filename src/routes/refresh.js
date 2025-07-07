const express = require('express');
const router = express.Router();
const dataProcessor = require('../services/dataProcessor');

router.post('/', async (req, res) => {
  try {
    dataProcessor.clearCache();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in refresh route:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const googleSheetsService = require('../services/googleSheetsService');
const dataProcessor = require('../services/dataProcessor');

router.get('/', async (req, res) => {
  try {
    const googleSheetsData = await googleSheetsService.getAllSheetData();
    const processedData = await dataProcessor.processAllData(googleSheetsData, []);
    
    res.json({
      success: true,
      data: processedData.completed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in history route:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;
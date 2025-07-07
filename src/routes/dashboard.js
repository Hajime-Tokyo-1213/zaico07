const express = require('express');
const router = express.Router();
const googleSheetsService = require('../services/googleSheetsService');
const zaicoService = require('../services/zaicoService');
const dataProcessor = require('../services/dataProcessor');

router.get('/', async (req, res) => {
  try {
    const [googleSheetsData, zaicoData] = await Promise.all([
      googleSheetsService.getAllSheetData(),
      zaicoService.getAllInventories()
    ]);

    const processedData = await dataProcessor.processAllData(googleSheetsData, zaicoData);
    
    res.json({
      success: true,
      data: processedData.pending,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in dashboard route:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;
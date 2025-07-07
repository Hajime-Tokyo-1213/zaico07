const { google } = require('googleapis');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.initializeClient();
  }

  async initializeClient() {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      const client = await auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: client });
    } catch (error) {
      console.error('Error initializing Google Sheets client:', error);
      throw new Error('Failed to initialize Google Sheets API');
    }
  }

  async getSheetData(spreadsheetId, range) {
    try {
      if (!this.sheets) {
        await this.initializeClient();
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      return response.data.values || [];
    } catch (error) {
      console.error(`Error fetching sheet data from ${spreadsheetId}:`, error);
      throw new Error('Failed to fetch data from Google Sheets');
    }
  }

  async getInShippingData() {
    const spreadsheetId = '12Z57k2YC-URoSP-kA3Y5qozE5yIe5We8LP5qUiNKEv0';
    const ranges = [
      'ebay用仕入れ!A:L',
      'スイッチライト!A:L',
      'スイッチタブレット!A:L'
    ];

    const allData = [];
    
    for (const range of ranges) {
      const data = await this.getSheetData(spreadsheetId, range);
      const processedData = this.processInShippingData(data, range.split('!')[0]);
      allData.push(...processedData);
    }

    return allData;
  }

  processInShippingData(rawData, sheetName) {
    if (!rawData || rawData.length <= 1) return [];

    return rawData.slice(1).map(row => ({
      source: '入受出荷管理',
      sheetName,
      managementNumber: row[1] || '',
      supplier: row[2] || '',
      productName: row[3] || '',
      shipDate: row[8] || '',
      shippedCheck: row[11] === 'TRUE' || row[11] === true,
    })).filter(item => item.managementNumber);
  }

  async getInvoiceData() {
    const spreadsheetId = '1yOBlT5PbKGQOILcd0LUqo0_Ql_27g6MbQLb-g5cHVyw';
    const range = '全体!A:H';
    
    const data = await this.getSheetData(spreadsheetId, range);
    return this.processInvoiceData(data);
  }

  processInvoiceData(rawData) {
    if (!rawData || rawData.length <= 1) return [];

    return rawData.slice(1).map(row => ({
      source: 'インボイス',
      partner: row[1] || '',
      invoiceNumber: row[2] || '',
      productName: row[4] || '',
      quantity: parseInt(row[5]) || 0,
    })).filter(item => item.invoiceNumber);
  }

  async getGermanShippingData() {
    const spreadsheetId = '133cDct4krrsJDeXpO9l0fIrd3-ZYDc39u6-JpQvcxv4';
    const range = '独発送管理!A:G';
    
    const data = await this.getSheetData(spreadsheetId, range);
    return this.processGermanShippingData(data);
  }

  processGermanShippingData(rawData) {
    if (!rawData || rawData.length <= 1) return [];

    return rawData.slice(1).map(row => ({
      source: '独発送管理',
      invoiceNumber: row[1] || '',
      shippedQuantity: parseInt(row[6]) || 0,
    })).filter(item => item.invoiceNumber);
  }

  async getAllSheetData() {
    try {
      const [inShippingData, invoiceData, germanShippingData] = await Promise.all([
        this.getInShippingData(),
        this.getInvoiceData(),
        this.getGermanShippingData()
      ]);

      return {
        inShippingData,
        invoiceData,
        germanShippingData
      };
    } catch (error) {
      console.error('Error fetching all sheet data:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();
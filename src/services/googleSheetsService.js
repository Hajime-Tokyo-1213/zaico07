const { google } = require('googleapis');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    // 2025/07/25修正: サーバー起動時のクラッシュを防ぐため、初期化処理をコンストラクタから削除。
    // APIクライアントは、初回データ取得時に遅延初期化される。
    // this.initializeClient();
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

  async getAllSheetNames(spreadsheetId) {
    try {
      if (!this.sheets) {
        await this.initializeClient();
      }

      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties.title'
      });

      return response.data.sheets.map(sheet => sheet.properties.title);
    } catch (error) {
      console.error(`Error fetching sheet names from ${spreadsheetId}:`, error);
      throw new Error('Failed to fetch sheet names from Google Sheets');
    }
  }

  async getInShippingData() {
    const spreadsheetId = '12Z57k2YC-URoSP-kA3Y5qozE5yIe5We8LP5qUiNKEv0';
    
    try {
      // 動的に全シート名を取得
      const sheetNames = await this.getAllSheetNames(spreadsheetId);
      console.log(`Found ${sheetNames.length} sheets:`, sheetNames);
      
      const allData = [];
      
      for (const sheetName of sheetNames) {
        try {
          const range = `${sheetName}!A:L`;
          const data = await this.getSheetData(spreadsheetId, range);
          const processedData = this.processInShippingData(data, sheetName);
          allData.push(...processedData);
        } catch (error) {
          console.warn(`Warning: Could not process sheet '${sheetName}'. Error: ${error.message}. Skipping.`);
        }
      }
      
      return allData;
    } catch (error) {
      console.error('Error in getInShippingData:', error);
      throw error;
    }
  }

  processInShippingData(rawData, sheetName) {
    if (!rawData || rawData.length <= 1) return [];

    return rawData.slice(1).map(row => ({
      source: '入受出荷管理',
      sheetName,
      // 2025/07/25修正: データが数値の場合も想定し、Stringに変換後trimを実行
      managementNumber: String(row[1] || '').trim(),
      supplier: row[2] || '',
      productName: row[3] || '',
      receiveDate: row[7] || '',  // H列：受取日
      shipDate: row[8] || '',     // I列：発送日
      shippedCheck: row[11] === 'TRUE' || row[11] === true,  // L列：発送済みチェック
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
      // 2025/07/25修正: データが数値の場合も想定し、Stringに変換後trimを実行
      invoiceNumber: String(row[2] || '').trim(),
      productName: row[4] || '',
      quantity: parseInt(row[5]) || 0,
    })).filter(item => item.invoiceNumber);
  }

  // 2025/07/25変更: 複数の発送管理シートを対象にするため、`getGermanShippingData`から`getShippingData`に改名
  async getShippingData() {
    const spreadsheetId = '133cDct4krrsJDeXpO9l0fIrd3-ZYDc39u6-JpQvcxv4';
    // 2025/07/25変更: 調査対象シートを追加。'like発送管理'は集計から除外。
    const ranges = [
      '独発送管理!A:G',
      'デボン発送管理!A:Z',
      'サミー発送管理!A:Z'
    ];
    
    const allData = [];
    for (const range of ranges) {
      try {
        const data = await this.getSheetData(spreadsheetId, range);
        // 2025/07/25変更: `processShippingData`を呼び出すように修正
        const processedData = this.processShippingData(data, range.split('!')[0]);
        allData.push(...processedData);
      } catch (error) {
        // 存在しないシートがあっても処理を続行するための警告表示
        console.warn(`Warning: Could not fetch or process sheet range '${range}'. Error: ${error.message}. Skipping.`);
      }
    }
    return allData;
  }

  // 2025/07/25変更: 複数の発送管理シートに対応するため、汎用的な処理に修正
  processShippingData(rawData, sheetName) {
    if (!rawData || rawData.length <= 1) return [];

    return rawData.slice(1).map(row => {
      // 2025/07/25修正: データが数値の場合も想定し、Stringに変換後trimを実行
      const invoiceNumber = String(row[1] || '').trim();
      if (!invoiceNumber) return null;

      let shippedQuantity = 0;
      // 2025/07/25変更: シート名に応じて、数量が記載されている開始列を動的に変更
      // '独発送管理'はG列(index 6)から、その他はC列(index 2)から集計する
      const startColumn = sheetName === '独発送管理' ? 6 : 2;
      for (let i = startColumn; i < row.length; i++) {
        const val = parseInt(row[i], 10);
        if (!isNaN(val)) {
          shippedQuantity += val;
        }
      }
      
      return {
        source: sheetName,
        invoiceNumber,
        shippedQuantity,
      };
    }).filter(item => item !== null && item.invoiceNumber);
  }

  async getAllSheetData() {
    try {
      // 2025/07/25変更: getShippingDataを呼び出すように修正
      const [inShippingData, invoiceData, shippingData] = await Promise.all([
        this.getInShippingData(),
        this.getInvoiceData(),
        this.getShippingData()
      ]);

      return {
        inShippingData,
        invoiceData,
        germanShippingData: shippingData // プロパティ名は既存の利用箇所に合わせて維持
      };
    } catch (error) {
      console.error('Error fetching all sheet data:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();
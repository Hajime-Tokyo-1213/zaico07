class DataProcessor {
  constructor() {
    this.cache = {
      data: null,
      timestamp: null,
      ttl: 5 * 60 * 1000 // 5分間のキャッシュ
    };
  }

  isValidCache() {
    if (!this.cache.data || !this.cache.timestamp) return false;
    return Date.now() - this.cache.timestamp < this.cache.ttl;
  }

  clearCache() {
    this.cache.data = null;
    this.cache.timestamp = null;
  }

  async processAllData(googleSheetsData, zaicoData) {
    if (this.isValidCache()) {
      return this.cache.data;
    }

    const { inShippingData, invoiceData, germanShippingData } = googleSheetsData;

    // 国内取引の分類
    const domesticTransactions = this.processDomesticTransactions(inShippingData);

    // 直接取引の分類
    const directTransactions = this.processDirectTransactions(invoiceData, germanShippingData);

    // Zaicoデータを追加
    const zaicoTransactions = this.processZaicoData(zaicoData);

    const result = {
      pending: {
        domestic: domesticTransactions.pending,
        direct: directTransactions.pending,
        zaico: zaicoTransactions
      },
      completed: {
        domestic: domesticTransactions.completed,
        direct: directTransactions.completed
      }
    };

    this.cache.data = result;
    this.cache.timestamp = Date.now();

    return result;
  }

  processDomesticTransactions(inShippingData) {
    const pending = [];
    const completed = [];

    inShippingData.forEach(item => {
      // 管理番号を数値に変換
      const managementNum = parseInt(item.managementNumber, 10);
      
      // アカウント別のフィルタリング
      if (!isNaN(managementNum)) {
        if (managementNum >= 7000 && managementNum <= 7659) {
          // メインアカウント：7659まで完了済み
          return;
        } else if (managementNum < 7000 && managementNum <= 1608) {
          // サブアカウント：1608まで完了済み
          return;
        }
      }
      
      const isCompleted = item.shipDate || item.shippedCheck || item.receiveDate;
      
      const transaction = {
        type: 'domestic',
        source: item.source,
        sheetName: item.sheetName,
        managementNumber: item.managementNumber,
        supplier: item.supplier,
        productName: item.productName,
        receiveDate: item.receiveDate,
        shipDate: item.shipDate,
        shippedCheck: item.shippedCheck,
        status: isCompleted ? 'completed' : 'pending'
      };

      if (isCompleted) {
        completed.push(transaction);
      } else {
        pending.push(transaction);
      }
    });

    return { pending, completed };
  }

  processDirectTransactions(invoiceData, germanShippingData) {
    const pending = [];
    const completed = [];

    // 発送データを集計するためのマップを作成
    const shippingMap = new Map();
    germanShippingData.forEach(item => {
      // 2025/07/25修正: 複数の発送管理シートに同じ取引番号が存在する場合を考慮し、
      // 数量を上書きせず、加算して集計する。
      const key = (item.invoiceNumber || '').trim();
      if (!key) return;
      const existingQuantity = shippingMap.get(key) || 0;
      shippingMap.set(key, existingQuantity + item.shippedQuantity);
    });

    invoiceData.forEach(invoice => {
      const key = (invoice.invoiceNumber || '').trim();
      if (!key) return;
      
      const shippedQuantity = shippingMap.get(key) || 0;
      
      const invoiceNum = parseInt(key, 10);
      let isCompleted = shippedQuantity >= invoice.quantity;

      // 2025/07/25追加: 取引番号が250以下の場合は、強制的に「完了」扱いにするビジネスロジック
      if (!isNaN(invoiceNum) && invoiceNum <= 250) {
        isCompleted = true;
      }

      const transaction = {
        type: 'direct',
        source: invoice.source,
        partner: invoice.partner,
        invoiceNumber: key,
        productName: invoice.productName,
        quantity: invoice.quantity,
        shippedQuantity: shippedQuantity,
        remainingQuantity: Math.max(0, invoice.quantity - shippedQuantity),
        status: isCompleted ? 'completed' : 'pending'
      };

      if (isCompleted) {
        completed.push(transaction);
      } else {
        pending.push(transaction);
      }
    });

    return { pending, completed };
  }

  processZaicoData(zaicoData) {
    if (!zaicoData || !Array.isArray(zaicoData)) return [];

    return zaicoData.map(item => ({
      type: 'zaico',
      id: item.id,
      title: item.title || '',
      code: item.code || '',
      quantity: item.quantity || 0,
      unit: item.unit || '',
      category: item.category || '',
      place: item.place || '',
      lastUpdated: item.updated_at || ''
    }));
  }
}

module.exports = new DataProcessor();
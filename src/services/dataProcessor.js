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
      const isCompleted = item.shipDate || item.shippedCheck;
      
      const transaction = {
        type: 'domestic',
        source: item.source,
        sheetName: item.sheetName,
        managementNumber: item.managementNumber,
        supplier: item.supplier,
        productName: item.productName,
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

    // 独発送データをマップ化
    const shippingMap = new Map();
    germanShippingData.forEach(item => {
      shippingMap.set(item.invoiceNumber, item.shippedQuantity);
    });

    invoiceData.forEach(invoice => {
      const shippedQuantity = shippingMap.get(invoice.invoiceNumber) || 0;
      const isCompleted = shippedQuantity >= invoice.quantity;

      const transaction = {
        type: 'direct',
        source: invoice.source,
        partner: invoice.partner,
        invoiceNumber: invoice.invoiceNumber,
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
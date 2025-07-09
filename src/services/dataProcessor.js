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
        domesticTotalAmount: domesticTransactions.totalAmount,
        direct: directTransactions.pending,
        zaico: zaicoTransactions.flat,
        zaicoByCategory: zaicoTransactions.grouped
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
    let totalAmount = 0;

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
        purchasePrice: item.purchasePrice || 0,
        trackingNumber: item.trackingNumber || '',
        receiveDate: item.receiveDate,
        shipDate: item.shipDate,
        shippedCheck: item.shippedCheck,
        status: isCompleted ? 'completed' : 'pending'
      };

      if (isCompleted) {
        completed.push(transaction);
      } else {
        pending.push(transaction);
        totalAmount += item.purchasePrice || 0;
      }
    });

    return { pending, completed, totalAmount };
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
      
      // Likeの取引はスキップし、デボンの取引のみ処理
      const partner = (invoice.partner || '').toLowerCase();
      if (partner.includes('like')) {
        return; // Likeの取引はスキップ
      }
      
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
    if (!zaicoData || !Array.isArray(zaicoData)) {
      return { flat: [], grouped: {} };
    }

    // カテゴリごとにグループ化
    const groupedByCategory = {};
    
    zaicoData.forEach(item => {
      const category = item.category || '未分類';
      
      if (!groupedByCategory[category]) {
        groupedByCategory[category] = {
          items: [],
          totalAmount: 0
        };
      }
      
      // 仕入単価を取得
      let unitPrice = 0;
      if (item.optional_attributes && Array.isArray(item.optional_attributes)) {
        const priceAttr = item.optional_attributes.find(attr => attr.name === '仕入単価');
        if (priceAttr && priceAttr.value) {
          unitPrice = parseFloat(priceAttr.value) || 0;
        }
      }
      
      const quantity = parseFloat(item.quantity) || 0;
      const totalPrice = unitPrice * quantity;
      
      groupedByCategory[category].items.push({
        type: 'zaico',
        id: item.id,
        title: item.title || '',
        quantity: quantity,
        unit: item.unit || '',
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        etc: item.etc || '',
        lastUpdated: item.updated_at || ''
      });
      
      // カテゴリの合計金額を更新
      groupedByCategory[category].totalAmount += totalPrice;
    });

    // カテゴリごとにソートしてフラットな配列として返す
    const sortedCategories = Object.keys(groupedByCategory).sort();
    const flat = [];
    
    sortedCategories.forEach(category => {
      // カテゴリ内の商品を商品名でソート
      groupedByCategory[category].items.sort((a, b) => 
        (a.title || '').localeCompare(b.title || '', 'ja')
      );
      flat.push(...groupedByCategory[category].items);
    });

    return { flat, grouped: groupedByCategory };
  }
}

module.exports = new DataProcessor();
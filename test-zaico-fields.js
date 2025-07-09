const axios = require('axios');
require('dotenv').config();

const API_TOKEN = process.env.ZAICO_API_TOKEN;
const BASE_URL = 'https://web.zaico.co.jp/api/v1';

async function testZaicoFields() {
  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('=== Zaico APIフィールド確認 ===\n');

  try {
    const response = await axiosInstance.get('/inventories');
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('利用可能なフィールド一覧:\n');
      
      // 最初のアイテムのフィールドを表示
      const firstItem = response.data[0];
      Object.keys(firstItem).forEach(key => {
        const value = firstItem[key];
        const valueStr = value !== null && value !== undefined 
          ? (typeof value === 'object' ? JSON.stringify(value) : String(value))
          : 'null';
        console.log(`${key}: ${valueStr.substring(0, 100)}${valueStr.length > 100 ? '...' : ''}`);
      });
      
      console.log('\n=== 金額関連フィールドの詳細 ===');
      
      // 金額関連のフィールドを探す
      const priceFields = ['price', 'unit_price', 'cost', 'purchase_price', 'selling_price'];
      priceFields.forEach(field => {
        if (field in firstItem) {
          console.log(`${field}: ${firstItem[field]}`);
        }
      });
      
      // optional_attributesの中身を確認
      if (firstItem.optional_attributes) {
        console.log('\noptional_attributes の内容:');
        console.log(JSON.stringify(firstItem.optional_attributes, null, 2));
      }
      
      // etcフィールドの確認
      if (firstItem.etc) {
        console.log('\netc (備考) の内容:');
        console.log(firstItem.etc);
      }
      
      console.log('\n=== 複数アイテムの金額関連データサンプル ===');
      // 複数のアイテムから金額データを探す
      response.data.slice(0, 10).forEach((item, index) => {
        console.log(`\nアイテム ${index + 1}: ${item.title}`);
        console.log(`  数量: ${item.quantity}`);
        console.log(`  備考: ${item.etc || '（なし）'}`);
        
        // optional_attributesから価格情報を探す
        if (item.optional_attributes) {
          Object.entries(item.optional_attributes).forEach(([key, value]) => {
            if (key.includes('価') || key.includes('金') || key.includes('円')) {
              console.log(`  ${key}: ${value}`);
            }
          });
        }
      });
    }
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

testZaicoFields().catch(console.error);
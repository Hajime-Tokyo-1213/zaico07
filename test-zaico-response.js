const axios = require('axios');
require('dotenv').config();

const API_TOKEN = process.env.ZAICO_API_TOKEN;
const BASE_URL = 'https://web.zaico.co.jp/api/v1';

async function testZaicoResponse() {
  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('=== Zaico API レスポンス構造調査 ===\n');

  // 1. /inventories エンドポイント
  console.log('1. /inventories エンドポイント');
  try {
    const response = await axiosInstance.get('/inventories');
    console.log('レスポンスのデータ型:', typeof response.data);
    console.log('レスポンスは配列？:', Array.isArray(response.data));
    console.log('レスポンスのキー数:', Object.keys(response.data).length);
    
    // inventoriesプロパティが存在するか確認
    console.log('response.data.inventories 存在？:', 'inventories' in response.data);
    
    // 配列っぽいオブジェクトの可能性をチェック
    if (!Array.isArray(response.data) && typeof response.data === 'object') {
      const keys = Object.keys(response.data);
      const isNumericKeys = keys.every(key => !isNaN(parseInt(key)));
      console.log('数値キーのオブジェクト？:', isNumericKeys);
      
      if (isNumericKeys) {
        console.log('\n最初の3つのアイテムを表示:');
        for (let i = 0; i < Math.min(3, keys.length); i++) {
          const item = response.data[i];
          console.log(`\nアイテム ${i}:`);
          console.log(JSON.stringify(item, null, 2));
        }
      }
    }
  } catch (error) {
    console.log('エラー:', error.message);
  }

  // 2. /items エンドポイント
  console.log('\n\n2. /items エンドポイント');
  try {
    const response = await axiosInstance.get('/items');
    console.log('レスポンスのデータ型:', typeof response.data);
    console.log('レスポンスは配列？:', Array.isArray(response.data));
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('配列の長さ:', response.data.length);
      console.log('\n最初のアイテム:');
      console.log(JSON.stringify(response.data[0], null, 2));
    } else if (typeof response.data === 'object') {
      const keys = Object.keys(response.data);
      console.log('オブジェクトのキー:', keys.slice(0, 5).join(', '), '...');
    }
  } catch (error) {
    console.log('エラー:', error.message);
  }

  // 3. /products エンドポイント
  console.log('\n\n3. /products エンドポイント');
  try {
    const response = await axiosInstance.get('/products');
    console.log('レスポンスのデータ型:', typeof response.data);
    console.log('レスポンスは配列？:', Array.isArray(response.data));
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('配列の長さ:', response.data.length);
      console.log('\n最初のアイテム:');
      console.log(JSON.stringify(response.data[0], null, 2));
    } else if (typeof response.data === 'object') {
      const keys = Object.keys(response.data);
      console.log('オブジェクトのキー:', keys.slice(0, 5).join(', '), '...');
    }
  } catch (error) {
    console.log('エラー:', error.message);
  }
}

testZaicoResponse().catch(console.error);
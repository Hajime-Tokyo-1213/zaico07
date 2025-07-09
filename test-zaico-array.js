const axios = require('axios');
require('dotenv').config();

const API_TOKEN = process.env.ZAICO_API_TOKEN;
const BASE_URL = 'https://web.zaico.co.jp/api/v1';

async function testZaicoArray() {
  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('=== Zaico API 配列レスポンス調査 ===\n');

  try {
    const response = await axiosInstance.get('/inventories');
    
    // response.dataが配列の場合
    if (Array.isArray(response.data)) {
      console.log('✓ response.dataは配列です');
      console.log('配列の長さ:', response.data.length);
      
      if (response.data.length > 0) {
        console.log('\n最初の3つのアイテム:');
        response.data.slice(0, 3).forEach((item, index) => {
          console.log(`\n--- アイテム ${index + 1} ---`);
          console.log('ID:', item.id);
          console.log('タイトル:', item.title);
          console.log('コード:', item.code);
          console.log('数量:', item.quantity);
          console.log('単位:', item.unit);
          console.log('カテゴリ:', item.category);
          console.log('場所:', item.place);
          console.log('更新日時:', item.updated_at);
          console.log('全フィールド:', Object.keys(item).join(', '));
        });
      } else {
        console.log('配列は空です');
      }
    } else {
      console.log('✗ response.dataは配列ではありません');
      console.log('実際の型:', typeof response.data);
      console.log('データ:', JSON.stringify(response.data).substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.log('エラー:', error.message);
    if (error.response) {
      console.log('ステータス:', error.response.status);
      console.log('データ:', error.response.data);
    }
  }
}

testZaicoArray().catch(console.error);
const axios = require('axios');
require('dotenv').config();

const API_TOKEN = process.env.ZAICO_API_TOKEN;
const BASE_URL = 'https://web.zaico.co.jp/api/v1';

console.log('=== Zaico API接続テスト ===');
console.log(`APIトークン: ${API_TOKEN ? API_TOKEN.substring(0, 10) + '...' : '未設定'}`);
console.log(`ベースURL: ${BASE_URL}`);
console.log('');

async function testZaicoAPI() {
  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  // 1. 基本的な接続テスト
  console.log('1. 在庫一覧取得テスト');
  try {
    const response = await axiosInstance.get('/inventories');
    console.log('✓ 接続成功');
    console.log(`  ステータスコード: ${response.status}`);
    console.log(`  レスポンスキー: ${Object.keys(response.data).join(', ')}`);
    console.log(`  在庫数: ${response.data.inventories ? response.data.inventories.length : 0}`);
    
    if (response.data.inventories && response.data.inventories.length > 0) {
      console.log('  最初の在庫アイテム:');
      const firstItem = response.data.inventories[0];
      console.log(`    - ID: ${firstItem.id}`);
      console.log(`    - タイトル: ${firstItem.title}`);
      console.log(`    - カテゴリ: ${firstItem.category || '未設定'}`);
    }
    
    // ページネーション情報
    if (response.headers.link) {
      console.log(`  ページネーション: あり`);
      console.log(`  Link ヘッダー: ${response.headers.link}`);
    }
  } catch (error) {
    console.log('✗ 接続失敗');
    console.log(`  エラーメッセージ: ${error.message}`);
    if (error.response) {
      console.log(`  ステータスコード: ${error.response.status}`);
      console.log(`  エラー詳細: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }

  console.log('\n2. APIトークン検証');
  // トークンなしでリクエスト
  try {
    const response = await axios.get(`${BASE_URL}/inventories`);
    console.log('✗ 認証なしでアクセス可能（セキュリティ問題の可能性）');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✓ 認証が必要（正常）');
    } else {
      console.log('✗ 予期しないエラー:', error.message);
    }
  }

  console.log('\n3. その他のエンドポイントテスト');
  const endpoints = ['/items', '/products', '/stock'];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axiosInstance.get(endpoint);
      console.log(`✓ ${endpoint}: 成功 (${response.status})`);
    } catch (error) {
      if (error.response) {
        console.log(`✗ ${endpoint}: ${error.response.status} ${error.response.statusText}`);
      } else {
        console.log(`✗ ${endpoint}: ${error.message}`);
      }
    }
  }
}

// デバッグ用: 実際のHTTPリクエストを確認
axios.interceptors.request.use(request => {
  console.log('\n=== HTTPリクエスト詳細 ===');
  console.log('URL:', request.url);
  console.log('Method:', request.method);
  console.log('Headers:', request.headers);
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('\n=== HTTPレスポンス詳細 ===');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    return response;
  },
  error => {
    if (error.response) {
      console.log('\n=== HTTPエラーレスポンス詳細 ===');
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
      console.log('Data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

testZaicoAPI().catch(console.error);
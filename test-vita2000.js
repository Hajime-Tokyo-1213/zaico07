const axios = require('axios');
require('dotenv').config();

const API_TOKEN = process.env.ZAICO_API_TOKEN;
const BASE_URL = 'https://web.zaico.co.jp/api/v1';

async function testVita2000Category() {
  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('=== Vita2000カテゴリーの在庫確認 ===\n');

  try {
    // 全ページのデータを取得
    let allInventories = [];
    let nextUrl = '/inventories';
    let pageCount = 0;

    while (nextUrl) {
      pageCount++;
      console.log(`ページ ${pageCount} を取得中...`);
      
      const response = await axiosInstance.get(nextUrl);
      
      if (Array.isArray(response.data)) {
        allInventories = [...allInventories, ...response.data];
      }

      // 次のページのURLを取得
      const linkHeader = response.headers.link;
      nextUrl = getNextPageUrl(linkHeader, BASE_URL);
    }

    console.log(`\n総在庫アイテム数: ${allInventories.length}`);

    // Vita2000カテゴリーのアイテムをフィルタリング
    const vita2000Items = allInventories.filter(item => 
      item.category === 'Vita2000' || item.category === 'vita2000'
    );

    console.log(`\nVita2000カテゴリーのアイテム数: ${vita2000Items.length}`);

    if (vita2000Items.length > 0) {
      // 在庫数でソート（降順）
      vita2000Items.sort((a, b) => b.quantity - a.quantity);

      console.log('\n=== Vita2000カテゴリーの在庫一覧 ===');
      console.log('（在庫数の多い順）\n');

      vita2000Items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
        console.log(`   コード: ${item.code}`);
        console.log(`   在庫数: ${item.quantity} ${item.unit || '個'}`);
        console.log(`   場所: ${item.place || '未設定'}`);
        console.log(`   更新日: ${new Date(item.updated_at).toLocaleDateString('ja-JP')}`);
        console.log('');
      });

      // 統計情報
      const totalQuantity = vita2000Items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const itemsWithStock = vita2000Items.filter(item => item.quantity > 0).length;
      const itemsNoStock = vita2000Items.filter(item => item.quantity === 0).length;

      console.log('=== 統計情報 ===');
      console.log(`総在庫数: ${totalQuantity}`);
      console.log(`在庫ありアイテム: ${itemsWithStock}件`);
      console.log(`在庫なしアイテム: ${itemsNoStock}件`);

      // 場所別集計
      const byLocation = {};
      vita2000Items.forEach(item => {
        const location = item.place || '未設定';
        if (!byLocation[location]) {
          byLocation[location] = { count: 0, quantity: 0 };
        }
        byLocation[location].count++;
        byLocation[location].quantity += item.quantity || 0;
      });

      console.log('\n=== 場所別集計 ===');
      Object.entries(byLocation).forEach(([location, data]) => {
        console.log(`${location}: ${data.count}件 (在庫数: ${data.quantity})`);
      });
    }

    // カテゴリー一覧も表示
    const categories = {};
    allInventories.forEach(item => {
      const category = item.category || '未分類';
      categories[category] = (categories[category] || 0) + 1;
    });

    console.log('\n=== 全カテゴリー一覧 ===');
    const sortedCategories = Object.entries(categories)
      .sort((a, b) => b[1] - a[1]);
    
    sortedCategories.slice(0, 10).forEach(([category, count]) => {
      console.log(`${category}: ${count}件`);
    });
    if (sortedCategories.length > 10) {
      console.log(`... 他 ${sortedCategories.length - 10} カテゴリー`);
    }

  } catch (error) {
    console.error('エラー:', error.message);
    if (error.response) {
      console.error('ステータス:', error.response.status);
      console.error('詳細:', error.response.data);
    }
  }
}

function getNextPageUrl(linkHeader, baseURL) {
  if (!linkHeader) return null;

  const links = linkHeader.split(',');
  for (const link of links) {
    const [url, rel] = link.split(';');
    if (rel && rel.includes('rel="next"')) {
      const match = url.match(/<(.+)>/);
      if (match) {
        return match[1].replace(baseURL, '');
      }
    }
  }
  return null;
}

testVita2000Category().catch(console.error);
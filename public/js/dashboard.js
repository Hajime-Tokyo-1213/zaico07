document.addEventListener('DOMContentLoaded', function() {
    const loading = document.getElementById('loading');
    const refreshBtn = document.getElementById('refreshBtn');
    
    // アコーディオン機能
    document.querySelectorAll('.accordion-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetContent = document.getElementById(targetId);
            
            this.classList.toggle('active');
            targetContent.classList.toggle('show');
        });
    });
    
    // データ取得
    async function fetchDashboardData() {
        showLoading();
        try {
            const response = await fetch('/api/dashboard-data');
            const result = await response.json();
            
            if (result.success) {
                updateDashboard(result.data);
            } else {
                showError('データの取得に失敗しました');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('サーバーとの通信に失敗しました');
        } finally {
            hideLoading();
        }
    }
    
    // ダッシュボード更新
    function updateDashboard(data) {
        // 統計情報更新
        document.getElementById('domesticCount').textContent = data.domestic.length;
        document.getElementById('directCount').textContent = data.direct.length;
        document.getElementById('zaicoCount').textContent = data.zaico ? data.zaico.length : 0;
        
        // 国内取引の合計金額を表示
        if (data.domesticTotalAmount !== undefined) {
            document.getElementById('domesticTotalAmount').textContent = 
                `(合計: ¥${data.domesticTotalAmount.toLocaleString()})`;
        }
        
        // 国内取引テーブル更新
        updateDomesticTable(data.domestic);
        
        // 直接取引テーブル更新
        updateDirectTable(data.direct);
        
        // Zaicoテーブル更新（カテゴリごと）
        if (data.zaicoByCategory) {
            updateZaicoTableByCategory(data.zaicoByCategory);
        } else if (data.zaico) {
            updateZaicoTable(data.zaico);
        }
    }
    
    // 国内取引テーブル更新
    function updateDomesticTable(transactions) {
        const tbody = document.querySelector('#domesticTable tbody');
        tbody.innerHTML = '';
        
        transactions.forEach(item => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${escapeHtml(item.managementNumber)}</td>
                <td>${escapeHtml(item.supplier)}</td>
                <td>${escapeHtml(item.productName)}</td>
                <td class="text-right">¥${item.purchasePrice.toLocaleString()}</td>
                <td>${escapeHtml(item.trackingNumber)}</td>
                <td>${escapeHtml(item.sheetName)}</td>
                <td class="status-pending">未完了</td>
            `;
        });
    }
    
    // 直接取引テーブル更新
    function updateDirectTable(transactions) {
        const tbody = document.querySelector('#directTable tbody');
        tbody.innerHTML = '';
        
        transactions.forEach(item => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${escapeHtml(item.invoiceNumber)}</td>
                <td>${escapeHtml(item.partner)}</td>
                <td>${escapeHtml(item.productName)}</td>
                <td>${item.quantity}</td>
                <td>${item.shippedQuantity}</td>
                <td>${item.remainingQuantity}</td>
            `;
        });
    }
    
    // Zaicoテーブル更新
    function updateZaicoTable(inventories) {
        const tbody = document.querySelector('#zaicoTable tbody');
        tbody.innerHTML = '';
        
        inventories.forEach(item => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${escapeHtml(item.code)}</td>
                <td>${escapeHtml(item.title)}</td>
                <td>${item.quantity}</td>
                <td>${escapeHtml(item.unit)}</td>
                <td>${escapeHtml(item.category)}</td>
                <td>${escapeHtml(item.place)}</td>
            `;
        });
    }
    
    // カテゴリごとにZaicoテーブル更新
    function updateZaicoTableByCategory(categorizedInventories) {
        const container = document.getElementById('zaicoCategories');
        container.innerHTML = '';
        
        // カテゴリをソート
        const sortedCategories = Object.keys(categorizedInventories).sort();
        
        sortedCategories.forEach((category, index) => {
            const categoryData = categorizedInventories[category];
            const items = categoryData.items || [];
            const totalAmount = categoryData.totalAmount || 0;
            
            // カテゴリセクションを作成
            const categorySection = document.createElement('div');
            categorySection.className = 'category-section';
            
            // カテゴリヘッダー（アコーディオン）を作成
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-accordion-header';
            categoryHeader.innerHTML = `
                <button class="category-accordion-btn" data-category="${index}">
                    <span class="category-title">
                        ${escapeHtml(category)} 
                        <span class="category-stats">(${items.length}件 / 合計: ¥${totalAmount.toLocaleString()})</span>
                    </span>
                    <span class="arrow">▼</span>
                </button>
            `;
            
            // カテゴリコンテンツを作成
            const categoryContent = document.createElement('div');
            categoryContent.className = 'category-accordion-content';
            categoryContent.id = `category-content-${index}`;
            
            // テーブルを作成
            const table = document.createElement('table');
            table.className = 'zaico-category-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>商品名</th>
                        <th>数量</th>
                        <th>単位</th>
                        <th>単価</th>
                        <th>合計金額</th>
                        <th>備考</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${escapeHtml(item.title)}</td>
                            <td class="text-right">${item.quantity}</td>
                            <td>${escapeHtml(item.unit)}</td>
                            <td class="text-right">¥${item.unitPrice.toLocaleString()}</td>
                            <td class="text-right">¥${item.totalPrice.toLocaleString()}</td>
                            <td class="etc-cell">${escapeHtml(item.etc)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            
            categoryContent.appendChild(table);
            categorySection.appendChild(categoryHeader);
            categorySection.appendChild(categoryContent);
            container.appendChild(categorySection);
            
            // アコーディオンイベントを追加
            categoryHeader.querySelector('.category-accordion-btn').addEventListener('click', function() {
                this.classList.toggle('active');
                categoryContent.classList.toggle('show');
            });
        });
    }
    
    // データ更新
    async function refreshData() {
        showLoading();
        try {
            const response = await fetch('/api/refresh', { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                await fetchDashboardData();
            } else {
                showError('キャッシュのクリアに失敗しました');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('サーバーとの通信に失敗しました');
        } finally {
            hideLoading();
        }
    }
    
    // HTMLエスケープ
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
    
    // ローディング表示
    function showLoading() {
        loading.classList.add('show');
    }
    
    function hideLoading() {
        loading.classList.remove('show');
    }
    
    // エラー表示
    function showError(message) {
        alert(message);
    }
    
    // イベントリスナー
    refreshBtn.addEventListener('click', refreshData);
    
    // 初期データ取得
    fetchDashboardData();
});
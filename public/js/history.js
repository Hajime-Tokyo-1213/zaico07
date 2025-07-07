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
    async function fetchHistoryData() {
        showLoading();
        try {
            const response = await fetch('/api/history-data');
            const result = await response.json();
            
            if (result.success) {
                updateHistory(result.data);
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
    
    // 履歴更新
    function updateHistory(data) {
        // 統計情報更新
        document.getElementById('completedDomesticCount').textContent = data.domestic.length;
        document.getElementById('completedDirectCount').textContent = data.direct.length;
        
        // 完了済み国内取引テーブル更新
        updateCompletedDomesticTable(data.domestic);
        
        // 完了済み直接取引テーブル更新
        updateCompletedDirectTable(data.direct);
    }
    
    // 完了済み国内取引テーブル更新
    function updateCompletedDomesticTable(transactions) {
        const tbody = document.querySelector('#completedDomesticTable tbody');
        tbody.innerHTML = '';
        
        transactions.forEach(item => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${escapeHtml(item.managementNumber)}</td>
                <td>${escapeHtml(item.supplier)}</td>
                <td>${escapeHtml(item.productName)}</td>
                <td>${escapeHtml(item.sheetName)}</td>
                <td>${escapeHtml(item.shipDate) || 'チェック済み'}</td>
                <td class="status-completed">完了</td>
            `;
        });
    }
    
    // 完了済み直接取引テーブル更新
    function updateCompletedDirectTable(transactions) {
        const tbody = document.querySelector('#completedDirectTable tbody');
        tbody.innerHTML = '';
        
        transactions.forEach(item => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${escapeHtml(item.invoiceNumber)}</td>
                <td>${escapeHtml(item.partner)}</td>
                <td>${escapeHtml(item.productName)}</td>
                <td>${item.quantity}</td>
                <td>${item.shippedQuantity}</td>
                <td class="status-completed">完了</td>
            `;
        });
    }
    
    // データ更新
    async function refreshData() {
        showLoading();
        try {
            const response = await fetch('/api/refresh', { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                await fetchHistoryData();
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
    fetchHistoryData();
});
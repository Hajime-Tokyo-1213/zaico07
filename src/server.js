const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const dashboardRoutes = require('./routes/dashboard');
const historyRoutes = require('./routes/history');
const refreshRoutes = require('./routes/refresh');

app.use('/api/dashboard-data', dashboardRoutes);
app.use('/api/history-data', historyRoutes);
app.use('/api/refresh', refreshRoutes);

app.get('/api/debug-env', (req, res) => {
  res.json({
    zaicoApiToken: process.env.ZAICO_API_TOKEN ? `設定済み (最初の5文字: ${process.env.ZAICO_API_TOKEN.substring(0, 5)}...)` : '未設定',
    googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL || '未設定',
    googlePrivateKey: process.env.GOOGLE_PRIVATE_KEY ? '設定済み' : '未設定',
    googlePrivateKeyIsValid: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.startsWith('-----BEGIN PRIVATE KEY-----') : false,
    vercelEnv: process.env.VERCEL_ENV || 'ローカル環境'
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/history', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/history.html'));
});

// Vercelのサーバーレス関数としてエクスポート
module.exports = app;

// ローカル開発環境でのみサーバーを起動
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
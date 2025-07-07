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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/history', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/history.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
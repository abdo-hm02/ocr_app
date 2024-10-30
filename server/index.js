// server/index.js
const express = require('express');
const cors = require('cors');
const idCardRouter = require('./routes/idcard');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', idCardRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
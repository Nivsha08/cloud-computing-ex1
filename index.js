const dotenv = require('dotenv');
const serverless = require('serverless-http');
const express = require('express');

const parkingRoutes = require('parking');

dotenv.config();

const app = express();
app.use(express.json());

app.get('/health', (_, res) => {
  res.status(200).send('OK');
});

app.use(parkingRoutes);

module.exports.handler = serverless(app);

const dotenv = require('dotenv');
const aws = require('aws-sdk');

dotenv.config();

const {
  AWS_CREDS_ACCESS_KEY = '',
  AWS_CREDS_SECRET_ACCESS_KEY = '',
  AWS_LAMBDA_FUNCTION_REGION = ''
} = process.env ?? {};

const db = new aws.DynamoDB.DocumentClient({
  apiVersion: 'latest',
  convertEmptyValues: true,
  region: AWS_LAMBDA_FUNCTION_REGION,
  credentials: {
    accessKeyId: AWS_CREDS_ACCESS_KEY,
    secretAccessKey: AWS_CREDS_SECRET_ACCESS_KEY
  }
});

module.exports = { db };

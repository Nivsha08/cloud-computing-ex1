import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as shell from 'shelljs';
import * as chalk from 'chalk';

import { Lambda } from 'aws-sdk';

dotenv.config();

const SOURCE_DIR_PATH = '.';
const DEPLOYABLE_OUTPUT_PATH = 'deployable.zip';

const {
  AWS_CREDS_ACCESS_KEY = '',
  AWS_CREDS_SECRET_ACCESS_KEY = '',
  AWS_LAMBDA_FUNCTION_NAME = '',
  AWS_LAMBDA_FUNCTION_REGION = ''
} = process.env ?? {};

const log = (message: string) => {
  console.log(chalk.white.bold(`=== ${message} ===`));
};

const logSuccess = (message: string) => {
  console.log(chalk.greenBright.bold(`=== ${message} ===`));
};

const build = () => {
  log('Building...');
  shell.exec('rm -rf ./node_modules && rm package-lock.json && npm install', { silent: true });
  log('Build completed successfully.');
};

const compressCode = () => {
  log('Compressing...');
  shell.exec(`zip -rq ${DEPLOYABLE_OUTPUT_PATH} ${SOURCE_DIR_PATH}`);
  log('Deployable .zip file created successfully.');
};

const deployLambda = async () => {
  log('Deploying...');
  try {
    const lambda = new Lambda({
      apiVersion: 'latest',
      region: AWS_LAMBDA_FUNCTION_REGION,
      credentials: {
        accessKeyId: AWS_CREDS_ACCESS_KEY,
        secretAccessKey: AWS_CREDS_SECRET_ACCESS_KEY
      }
    });

    await lambda
      .updateFunctionCode({
        FunctionName: AWS_LAMBDA_FUNCTION_NAME,
        ZipFile: fs.readFileSync(DEPLOYABLE_OUTPUT_PATH),
        Publish: true
      })
      .promise();
    logSuccess(`Lambda function '${AWS_LAMBDA_FUNCTION_NAME}' deployed successfully.`);
  } catch (err) {
    console.error('Deployment error:', err);
  }
};

const cleanup = () => {
  shell.exec(`rm ${DEPLOYABLE_OUTPUT_PATH}`);
};

const main = async () => {
  console.clear();

  try {
    build();
    await compressCode();
    await deployLambda();
  } catch (err) {
    log(`Deployment failed.\n${err}`);
  } finally {
    cleanup();
    log('Finished.');
  }
};

main();

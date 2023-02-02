import http from 'http';

import config from './config/config.js';
import log from './log.js';
import constants from './config/constants.js';

const options = {
  host: 'localhost',
  port: config.httpPort,
  timeout: 2000,
  method: 'GET',
  path: '/api/health',
};

const request = http.request(options, (result) => {
  log.info(`Performed health check, result ${result.statusCode}`);
  if (result.statusCode === constants.HTTP_STATUS_OK) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err) => {
  log.error(`An error occurred while performing health check, error: ${err}`);
  process.exit(1);
});

request.end();

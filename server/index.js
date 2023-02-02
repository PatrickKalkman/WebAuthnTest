/*
 * Primary file for the WebAuthn test
 */

// Dependencies
import process from 'process';
import dotenv from 'dotenv';
dotenv.config();

import log from './lib/log.js';
import server from './lib/server.js';
import config from './lib/config/config.js';

const app = {};

app.init = async function init() {
  log.info('Started WebAuthn server, waiting for requests');
  server.start();
  await app.handleBackgroundTasks();
};

app.handleBackgroundTasks = async () => {
  app.intervalTimer = setTimeout(async () => {
    log.info('Running background tasks');
    app.handleBackgroundTasks();
  }, config.workflow.pollingInterval * 1000);
};

app.shutdown = function shutdown() {
  server.stop();
  process.exit();
};

process.on('SIGINT', () => {
  log.info('Got SIGINT, gracefully shutting down');
  app.shutdown();
});

process.on('SIGTERM', () => {
  log.info('Got SIGTERM, gracefully shutting down');
  app.shutdown();
});

app.init();

export default app;

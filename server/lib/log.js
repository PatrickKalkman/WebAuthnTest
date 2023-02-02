/*
 * Logging wrapper
 */
import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
  },
});

const log = {};

log.info = function info(message) {
  logger.info(message);
};

log.error = function error(message) {
  logger.error(message);
};

log.debug = function debug(message) {
  logger.debug(message);
};

export default log;

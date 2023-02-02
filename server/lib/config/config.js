/*
 * Create and export configuration variables used by the API
 *
 */

// Container for all environments
const environments = {};

environments.production = {
  httpPort: process.env.HTTP_PORT || 8080,
  httpAddress: process.env.HOST || 'localhost',
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
  database: {
    url: process.env.STORAGE_HOST || 'mongodb://localhost:27017',
    name: 'webauthn',
    connectRetry: 5, // seconds
  },
  workflow: {
    pollingInterval: 10, // Seconds
  },
};

// Determine which environment was passed as a command-line argument
const currentEnvironment = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environment defined above,
// if not default to production
const environmentToExport = typeof environments[currentEnvironment] === 'object' ? environments[currentEnvironment] : environments.production;

// export the module
export default environmentToExport;

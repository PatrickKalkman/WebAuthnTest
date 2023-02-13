import fs from 'fs';
import tokenVerification from '../authentication/tokenVerification.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const customerController = {};

customerController.get = function (req, reply) {
  tokenVerification.extractAndVerifyJwtToken(req, (err, isValidToken) => {
    if (!err && isValidToken) {
      const data = fs.readFileSync(__dirname + '/../../db/customerData.json');
      reply.code(200).send(data);
    } else {
      reply.unauthorized(err);
    }
  });
};

export default customerController;
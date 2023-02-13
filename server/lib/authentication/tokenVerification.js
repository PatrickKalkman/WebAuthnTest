import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import log from '../log.js';

const tokenVerification = {};

tokenVerification.extractAndVerifyJwtToken = function (request, cb) {
  if (typeof request.headers.authorization === 'undefined') {
    cb(new Error('No token provided'), false);
    return;
  }

  const auth = request.headers.authorization;
  const tokens = auth.split(' ');
  if (tokens.length < 2) {
    cb(new Error('No token provided'), false);
    return;
  }

  try {
    const bearerToken = tokens[1];
    jwt.verify(bearerToken, config.jwt.secret, (err) => {
      if (!err) {
        const decoded = jwt.decode(bearerToken);
        cb(null, true, decoded.email);
        return;
      } else {
        cb(err, false, null);
        return;
      }
    });
  } catch (err) {
    log.error(err);
    cb(err, false, null);
  }
};

export default tokenVerification;
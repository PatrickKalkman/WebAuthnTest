import base64url from './base64url-arraybuffer.js';

const utils = {};

utils.encodeCredentialsRequest = (credReq) => {
  credReq.challenge = base64url.decode(credReq.challenge);
  credReq.user.id = base64url.decode(credReq.user.id);
  return credReq;
};

utils.encodeCredentialInfoRequest = (pubKeyCred) => {
  if (pubKeyCred instanceof Array) {
    let arr = [];
    for (let i of pubKeyCred) arr.push(utils.encodeCredentialInfoRequest(i));

    return arr;
  }

  if (pubKeyCred instanceof ArrayBuffer) {
    return base64url.encode(pubKeyCred);
  }

  if (pubKeyCred instanceof Object) {
    let obj = {};

    for (let key in pubKeyCred) {
      obj[key] = utils.encodeCredentialInfoRequest(pubKeyCred[key]);
    }

    return obj;
  }

  return pubKeyCred;
};

export default utils;

import crypto from "crypto";
import base64url from "base64url";
import cbor from "cbor";
import { Certificate } from "@fidm/x509";
import iso_3166_1 from "iso-3166-1";

const utils = {};

/**
 * U2F Presence constant
 */
const U2F_USER_PRESENTED = 0x01;

/**
 * Takes signature, data and PEM public key and tries to verify signature
 * @param  {Buffer} signature
 * @param  {Buffer} data
 * @param  {String} publicKey - PEM encoded public key
 * @return {Boolean}
 */
utils.verifySignature = (signature, data, publicKey) => {
  return crypto
    .createVerify("SHA256")
    .update(data)
    .verify(publicKey, signature);
};

/**
 * Returns base64url encoded buffer of the given length
 * @param  {Number} len - length of the buffer
 * @return {String}     - base64url random buffer
 */
utils.randomBase64URLBuffer = (len) => {
  len = len || 32;

  let buff = crypto.randomBytes(len);

  return base64url(buff);
};

/**
 * Generates makeCredentials request
 * @param  {String} username       - username
 * @param  {String} displayName    - user's personal display name
 * @param  {String} id             - user's base64url encoded id
 * @return {MakePublicKeyCredentialOptions} - server encoded make credentials request
 */
utils.generateServerMakeCredRequest = (username, displayName, id) => {
  return {
    challenge: utils.randomBase64URLBuffer(32),

    rp: {
      name: "WebAuth Test",
      id: "localhost",
    },

    user: {
      id: id,
      name: username,
      displayName: displayName,
    },

    attestation: "direct",
    authenticatorSelection: {
      residentKey: "preferred",
      requireResidentKey: false,
      userVerification: "preferred",
    },
    extensions: {
      credProps: true,
    },
    pubKeyCredParams: [
      {
        type: "public-key",
        alg: -7, // "ES256" as registered in the IANA COSE Algorithms registry
      },
      {
        type: "public-key",
        alg: -257, // Value registered by this specification for "RS256"
      },
    ],
  };
};

/**
 * Generates getAssertion request
 * @param  {Array} authenticators              - list of registered authenticators
 * @return {PublicKeyCredentialRequestOptions} - server encoded get assertion request
 */
utils.generateServerGetAssertion = (authenticators) => {
  let allowCredentials = [];
  for (let authr of authenticators) {
    allowCredentials.push({
      type: "public-key",
      id: authr.credID,
      transports: ["usb", "nfc", "ble", "internal"],
    });
  }
  return {
    challenge: utils.randomBase64URLBuffer(32),
    allowCredentials: allowCredentials,
    userVerification: "preferred",
    rpId: "localhost",
    timeout: 60000,
  };
};

/**
 * Returns SHA-256 digest of the given data.
 * @param  {Buffer} data - data to hash
 * @return {Buffer}      - the hash
 */
utils.hash = (data) => {
  return crypto.createHash("SHA256").update(data).digest();
};

/**
 * Takes COSE encoded public key and converts it to RAW PKCS ECDHA key
 * @param  {Buffer} COSEPublicKey - COSE encoded public key
 * @return {Buffer}               - RAW PKCS encoded public key
 */
utils.COSEECDHAtoPKCS = (COSEPublicKey) => {
  /* 
       +------+-------+-------+---------+----------------------------------+
       | name | key   | label | type    | description                      |
       |      | type  |       |         |                                  |
       +------+-------+-------+---------+----------------------------------+
       | crv  | 2     | -1    | int /   | EC Curve identifier - Taken from |
       |      |       |       | tstr    | the COSE Curves registry         |
       |      |       |       |         |                                  |
       | x    | 2     | -2    | bstr    | X Coordinate                     |
       |      |       |       |         |                                  |
       | y    | 2     | -3    | bstr /  | Y Coordinate                     |
       |      |       |       | bool    |                                  |
       |      |       |       |         |                                  |
       | d    | 2     | -4    | bstr    | Private key                      |
       +------+-------+-------+---------+----------------------------------+
    */

  let coseStruct = cbor.decodeAllSync(COSEPublicKey)[0];
  let tag = Buffer.from([0x04]);
  let x = coseStruct.get(-2);
  let y = coseStruct.get(-3);

  return Buffer.concat([tag, x, y]);
};

/**
 * Convert binary certificate or public key to an OpenSSL-compatible PEM text format.
 * @param  {Buffer} buffer - Cert or PubKey buffer
 * @return {String}             - PEM
 */
utils.ASN1toPEM = (pkBuffer) => {
  if (!Buffer.isBuffer(pkBuffer))
    throw new Error("ASN1toPEM: pkBuffer must be Buffer.");

  let type;
  if (pkBuffer.length == 65 && pkBuffer[0] == 0x04) {
    /*
            If needed, we encode rawpublic key to ASN structure, adding metadata:
            SEQUENCE {
              SEQUENCE {
                 OBJECTIDENTIFIER 1.2.840.10045.2.1 (ecPublicKey)
                 OBJECTIDENTIFIER 1.2.840.10045.3.1.7 (P-256)
              }
              BITSTRING <raw public key>
            }
            Luckily, to do that, we just need to prefix it with constant 26 bytes (metadata is constant).
        */

    pkBuffer = Buffer.concat([
      new Buffer.from(
        "3059301306072a8648ce3d020106082a8648ce3d030107034200",
        "hex"
      ),
      pkBuffer,
    ]);

    type = "PUBLIC KEY";
  } else {
    type = "CERTIFICATE";
  }

  let b64cert = pkBuffer.toString("base64");

  let PEMKey = "";
  for (let i = 0; i < Math.ceil(b64cert.length / 64); i++) {
    let start = 64 * i;

    PEMKey += b64cert.substr(start, 64) + "\n";
  }

  PEMKey = `-----BEGIN ${type}-----\n` + PEMKey + `-----END ${type}-----\n`;

  return PEMKey;
};

/**
 * Parses authenticatorData buffer.
 * @param  {Buffer} buffer - authenticatorData buffer
 * @return {Object}        - parsed authenticatorData struct
 */
utils.parseMakeCredAuthData = (buffer) => {
  let rpIdHash = buffer.slice(0, 32);
  buffer = buffer.slice(32);
  let flagsBuf = buffer.slice(0, 1);
  buffer = buffer.slice(1);
  let flags = flagsBuf[0];
  let counterBuf = buffer.slice(0, 4);
  buffer = buffer.slice(4);
  let counter = counterBuf.readUInt32BE(0);
  let aaguid = buffer.slice(0, 16);
  buffer = buffer.slice(16);
  let credIDLenBuf = buffer.slice(0, 2);
  buffer = buffer.slice(2);
  let credIDLen = credIDLenBuf.readUInt16BE(0);
  let credID = buffer.slice(0, credIDLen);
  buffer = buffer.slice(credIDLen);
  let COSEPublicKey = buffer;

  return {
    rpIdHash,
    flagsBuf,
    flags,
    counter,
    counterBuf,
    aaguid,
    credID,
    COSEPublicKey,
  };
};

utils.verifyAuthenticatorAttestationResponse = (responseInput) => {
  let attestationBuffer = base64url.toBuffer(responseInput.attestationObject);
  let ctapMakeCredResp = cbor.decodeAllSync(attestationBuffer)[0];

  let response = { verified: false };
  if (ctapMakeCredResp.fmt === "fido-u2f") {
    let authrDataStruct = utils.parseMakeCredAuthData(
      ctapMakeCredResp.authData
    );

    if (!(authrDataStruct.flags & U2F_USER_PRESENTED))
      throw new Error("User was NOT presented durring authentication!");

    let clientDataHash = hash(base64url.toBuffer(responseInput.clientDataJSON));
    let reservedByte = Buffer.from([0x00]);
    let publicKey = utils.COSEECDHAtoPKCS(authrDataStruct.COSEPublicKey);
    let signatureBase = Buffer.concat([
      reservedByte,
      authrDataStruct.rpIdHash,
      clientDataHash,
      authrDataStruct.credID,
      publicKey,
    ]);

    let PEMCertificate = utils.ASN1toPEM(ctapMakeCredResp.attStmt.x5c[0]);
    let signature = ctapMakeCredResp.attStmt.sig;

    response.verified = utils.verifySignature(
      signature,
      signatureBase,
      PEMCertificate
    );

    if (response.verified) {
      response.authrInfo = {
        fmt: "fido-u2f",
        publicKey: base64url.encode(publicKey),
        counter: authrDataStruct.counter,
        credID: base64url.encode(authrDataStruct.credID),
      };
    }
  } else if (
    ctapMakeCredResp.fmt === "packed" &&
    ctapMakeCredResp.attStmt.hasOwnProperty("x5c")
  ) {
    let authrDataStruct = utils.parseMakeCredAuthData(
      ctapMakeCredResp.authData
    );

    if (!(authrDataStruct.flags & U2F_USER_PRESENTED))
      throw new Error("User was NOT presented durring authentication!");

    let clientDataHash = utils.hash(
      base64url.toBuffer(responseInput.clientDataJSON)
    );
    let publicKey = utils.COSEECDHAtoPKCS(authrDataStruct.COSEPublicKey);
    let signatureBase = Buffer.concat([
      ctapMakeCredResp.authData,
      clientDataHash,
    ]);

    let PEMCertificate = utils.ASN1toPEM(ctapMakeCredResp.attStmt.x5c[0]);
    let signature = ctapMakeCredResp.attStmt.sig;

    let pem = Certificate.fromPEM(PEMCertificate);

    // Getting requirements from https://www.w3.org/TR/webauthn/#packed-attestation
    let aaguid_ext = pem.getExtension("1.3.6.1.4.1.45724.1.1.4");

    response.verified = // Verify that sig is a valid signature over the concatenation of authenticatorData
      // and clientDataHash using the attestation public key in attestnCert with the algorithm specified in alg.
      utils.verifySignature(signature, signatureBase, PEMCertificate) &&
      // version must be 3 (which is indicated by an ASN.1 INTEGER with value 2)
      pem.version == 3 &&
      // ISO 3166 valid country
      typeof iso_3166_1.whereAlpha2(pem.subject.countryName) !== "undefined" &&
      // Legal name of the Authenticator vendor (UTF8String)
      pem.subject.organizationName &&
      // Literal string “Authenticator Attestation” (UTF8String)
      pem.subject.organizationalUnitName === "Authenticator Attestation" &&
      // A UTF8String of the vendor’s choosing
      pem.subject.commonName &&
      // The Basic Constraints extension MUST have the CA component set to false
      !pem.extensions.isCA &&
      // If attestnCert contains an extension with OID 1.3.6.1.4.1.45724.1.1.4 (id-fido-gen-ce-aaguid)
      // verify that the value of this extension matches the aaguid in authenticatorData.
      // The extension MUST NOT be marked as critical.
      (aaguid_ext != null
        ? authrDataStruct.hasOwnProperty("aaguid")
          ? !aaguid_ext.critical &&
            aaguid_ext.value.slice(2).equals(authrDataStruct.aaguid)
          : false
        : true);

    if (response.verified) {
      response.authrInfo = {
        fmt: "fido-u2f",
        publicKey: base64url.encode(publicKey),
        counter: authrDataStruct.counter,
        credID: base64url.encode(authrDataStruct.credID),
      };
    }
  } else if (ctapMakeCredResp.fmt === "packed") {
    const clientDataHash = utils.hash(
      base64url.toBuffer(responseInput.clientDataJSON)
    );
    const signatureBase = Buffer.concat([
      ctapMakeCredResp.authData,
      clientDataHash,
    ]);

    let authrDataStruct = utils.parseMakeCredAuthData(
      ctapMakeCredResp.authData
    );

    let publicKey = utils.COSEECDHAtoPKCS(authrDataStruct.COSEPublicKey);

    const PEMCertificate = utils.ASN1toPEM(publicKey);
    const {
      attStmt: { sig: signature, alg },
    } = ctapMakeCredResp;

    response.authrInfo = {
      fmt: "fido-u2f",
      publicKey: base64url.encode(publicKey),
      counter: authrDataStruct.counter,
      credID: base64url.encode(authrDataStruct.credID),
    };

    response.verified = // Verify that sig is a valid signature over the concatenation of authenticatorData
      // and clientDataHash using the attestation public key in attestnCert with the algorithm specified in alg.
      utils.verifySignature(signature, signatureBase, PEMCertificate) &&
      alg === -7;
  } else if (ctapMakeCredResp.fmt === "none") {
    response.verified =
      this.config.attestation ==
      Dictionaries.AttestationConveyancePreference.NONE;
  } else {
    throw new Error("Unsupported attestation format! " + ctapMakeCredResp.fmt);
  }

  return response;
};

/**
 * Takes an array of registered authenticators and find one specified by credID
 * @param  {String} credID        - base64url encoded credential
 * @param  {Array} authenticators - list of authenticators
 * @return {Object}               - found authenticator
 */
let findAuthr = (credID, authenticators) => {
  for (let authr of authenticators) {
    if (authr.credID === credID) return authr;
  }

  throw new Error(`Unknown authenticator with credID ${credID}!`);
};

/**
 * Parses AuthenticatorData from GetAssertion response
 * @param  {Buffer} buffer - Auth data buffer
 * @return {Object}        - parsed authenticatorData struct
 */
utils.parseGetAssertAuthData = (buffer) => {
  let rpIdHash = buffer.slice(0, 32);
  buffer = buffer.slice(32);
  let flagsBuf = buffer.slice(0, 1);
  buffer = buffer.slice(1);
  let flags = flagsBuf[0];
  let counterBuf = buffer.slice(0, 4);
  buffer = buffer.slice(4);
  let counter = counterBuf.readUInt32BE(0);

  return { rpIdHash, flagsBuf, flags, counter, counterBuf };
};

utils.verifyAuthenticatorAssertionResponse = (
  id,
  responseInput,
  authenticators
) => {
  let authr = findAuthr(id, authenticators);
  let authenticatorData = base64url.toBuffer(responseInput.authenticatorData);

  let response = { verified: false };
  if (authr.fmt === "fido-u2f") {
    let authrDataStruct = utils.parseGetAssertAuthData(authenticatorData);

    if (!(authrDataStruct.flags & U2F_USER_PRESENTED))
      throw new Error("User was NOT presented durring authentication!");

    let clientDataHash = utils.hash(
      base64url.toBuffer(responseInput.clientDataJSON)
    );
    let signatureBase = Buffer.concat([
      authrDataStruct.rpIdHash,
      authrDataStruct.flagsBuf,
      authrDataStruct.counterBuf,
      clientDataHash,
    ]);

    let publicKey = utils.ASN1toPEM(base64url.toBuffer(authr.publicKey));
    let signature = base64url.toBuffer(responseInput.signature);

    response.verified = utils.verifySignature(
      signature,
      signatureBase,
      publicKey
    );

    if (response.verified) {
      if (response.counter <= authr.counter)
        throw new Error("Authr counter did not increase!");

      authr.counter = authrDataStruct.counter;
    }
  }

  return response;
};

export default utils;

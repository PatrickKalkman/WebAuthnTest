// External Dependancies
import base64url from "base64url";
import constants from "../config/constants.js";
import database from "../database/database.js";
import log from "../log.js";
import utils from "../utils/utils.js";

const registrationController = {};

registrationController.startRegistration = async (_req, reply) => {
  const { username, name } = _req.body;
  log.info(
    "Registration request received for username: " +
      username +
      " and name: " +
      name
  );
  if (database[username] && database[username].registered) {
    reply.badRequest({
      status: "error",
      message: `Username ${username} already exists`,
    });
    return;
  }

  const user = {
    registered: false,
    name,
    id: utils.randomBase64URLBuffer(),
    authenticators: [],
  };

  database[username] = user;

  _req.session.username = username;

  const makeCredChallenge = utils.generateServerMakeCredRequest(
    username,
    name,
    user.id
  );

  makeCredChallenge.status = "ok";

  _req.session.challenge = makeCredChallenge.challenge;
  _req.session.username = username;

  reply.send(makeCredChallenge);
};

registrationController.finishRegistration = async (_req, reply) => {
  const { id, rawId, response, type } = _req.body;

  let result;

  if (type !== "public-key") {
    reply.badRequest({
      status: "error",
      message: "Registration failed! type is not public-key",
    });
    return;
  }

  const clientData = JSON.parse(base64url.decode(response.clientDataJSON));

  if (clientData.challenge !== _req.session.challenge) {
    reply.badRequest({
      status: "error",
      message: "Registration failed! Challenges do not match",
    });
    return;
  }

  if (clientData.origin !== "http://localhost:8080") {
    reply.badRequest({
      status: "error",
      message: "Registration failed! Origins do not match",
    });
    return;
  }

  if (response.attestationObject !== undefined) {
    log.info(
      "Handling create credential request, storing information in database for: " +
        _req.session.username
    );

    // This is a create credential request
    result = utils.verifyAuthenticatorAttestationResponse(response);
    console.dir(result);

    if (result.verified) {
      console.dir(result.authrInfo);
      database[_req.session.username].authenticators.push(result.authrInfo);
      database[_req.session.username].registered = true;
    }
  } else if (response.authenticatorData !== undefined) {
    // This is a get assertion request
  } else {
    reply.badRequest({
      status: "error",
      message: "Cannot determine the type of response",
    });
    return;
  }

  if (result.verified) {
    _req.session.loggedIn = true;
    reply.send({
      status: "ok",
      message: "Registration successfull",
    });
    return;
  } else {
    reply.badRequest({
      status: "error",
      message: "Cannot authenticate signature",
    });
    return;
  }
};

export default registrationController;

import base64url from "base64url";
import database from "../database/database.js";
import log from "../log.js";
import utils from "../utils/utils.js";

const userController = {};

userController.startRegistration = async (_req, reply) => {
  const { username, name } = _req.body;
  log.info(
    "Registration request received for username: " +
      username +
      " and name: " +
      name
  );

  const userFromDb = await database.getUser(username);
  log.info("User from db: " + userFromDb);
  if (userFromDb && userFromDb.registered) {
    reply.badRequest(`Username ${userFromDb.username} already exists`);
    return;
  }

  const id = utils.randomBase64URLBuffer();
  await database.addUser(username, name, false, null, null, id);

  _req.session.username = username;

  const makeCredChallenge = utils.generateServerMakeCredRequest(
    username,
    name,
    id
  );

  makeCredChallenge.status = "ok";

  _req.session.challenge = makeCredChallenge.challenge;
  _req.session.username = username;

  reply.send(makeCredChallenge);
};

userController.finishRegistration = async (_req, reply) => {
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

  if (clientData.origin !== "http://localhost:8081") {
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

    if (result.verified) {
      await database.updateUser(_req.session.username, true, result.authrInfo.fmt, result.authrInfo.publicKey, result.authrInfo.credID);
    }
  } else {
    reply.badRequest("Cannot determine the type of response");
    return;
  }

  if (result.verified) {
    _req.session.loggedIn = true;
    reply.send("Registration successfull");
    return;
  } else {
    reply.badRequest("Cannot authenticate signature");
    return;
  }
};

export default userController;

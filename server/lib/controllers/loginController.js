import base64url from "base64url";
import database from "../database/database.js";
import utils from "../utils/utils.js";

const loginController = {};

loginController.login = async (_req, reply) => {
  const { username } = _req.body;

  const user = await database.getUser(username)
  if (!user || !user.registered) {
    reply.badRequest(`User ${username} does not exist or not registered`);
    return;
  }

  const authenticator = { fmt: user.fmt, publicKey: user.publicKey, credID: user.credID };
  const getAssertion = utils.generateServerGetAssertion(
    [authenticator]
  );
  getAssertion.status = "ok";

  _req.session.challenge = getAssertion.challenge;
  _req.session.username = username;

  reply.send(getAssertion);
};

loginController.loginVerify = async (_req, reply) => {
  const { id, response, type } = _req.body;

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

  if (response.authenticatorData !== undefined) {

    const user = await database.getUserByCredId(id)
    if (!user || !user.registered) {
      reply.badRequest(`User ${username} does not exist or not registered`);
      return;
    }

    // This is a verification request
    result = utils.verifyAuthenticatorAssertionResponse(
      id,
      response,
      [{ fmt: user.fmt, publicKey: user.publicKey, credID: user.credID }],
    );
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

loginController.status = async (_req, reply) => {
  const username = _req.session.username;
  const challenge = _req.session.challenge;
  const user = await database.getUser(username);
  const registered = user?.registered;
  reply.send({ username, challenge, registered });
};

loginController.logout = async (_req, reply) => {
  _req.session = null;
  reply.ok("User logged out");
};

export default loginController;

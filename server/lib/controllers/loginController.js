// External Dependancies
import base64url from "base64url";
import constants from "../config/constants.js";
import database from "../database/database.js";
import log from "../log.js";
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

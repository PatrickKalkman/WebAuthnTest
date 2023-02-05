// External Dependancies
import base64url from "base64url";
import constants from "../config/constants.js";
import database from "../database/database.js";
import log from "../log.js";
import utils from "../utils/utils.js";

const loginController = {};

loginController.login = async (_req, reply) => {
  const { username } = _req.body;

  if (!database[username] || !database[username].registered) {
    reply.badRequest({
      status: "failed",
      message: `User ${username} does not exist or not registered`,
    });

    return;
  }

  const getAssertion = utils.generateServerGetAssertion(
    database[username].authenticators
  );
  getAssertion.status = "ok";

  _req.session.challenge = getAssertion.challenge;
  _req.session.username = username;

  reply.send(getAssertion);
};

loginController.status = async (_req, reply) => {
  const username = _req.session.username;
  const challenge = _req.session.challenge;
  const registered = database[_req.session.username]?.registered;
  reply.send({ username, challenge, registered });
};

loginController.logout = async (_req, reply) => {
  database[_req.session.username] = null;
  _req.session = null;
  reply.ok({ status: "ok", message: "User logged out" });
};

export default loginController;

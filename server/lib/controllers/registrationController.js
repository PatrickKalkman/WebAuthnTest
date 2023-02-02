// External Dependancies
import constants from "../config/constants.js";
import log from "../log.js";

const registrationController = {};

registrationController.options = async (_req, reply) => {
  reply.code(200);
};

export default registrationController;

import registrationController from "../controllers/userController.js";

const StartRegistrationBodySchema = {
  body: {
    type: "object",
    properties: {
      username: { type: "string", minLength: 4 },
      name: { type: "string", minLength: 4 },
    },
    required: ["username", "name"],
  },
};

const FinishRegistrationBodySchema = {
  body: {
    type: "object",
    properties: {
      id: { type: "string" },
      rawId: { type: "string" },
      response: { type: "object" },
      type: { type: "string" },
    },
    required: ["id", "rawId", "response", "type"],
  },
};

export default async function (fastify) {
  fastify.post(
    "/api/user/register",
    { schema: StartRegistrationBodySchema },
    registrationController.startRegistration
  );
  fastify.put(
    "/api/user/register",
    { schema: FinishRegistrationBodySchema },
    registrationController.finishRegistration
  );
}

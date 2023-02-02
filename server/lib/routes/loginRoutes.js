import loginController from "../controllers/loginController.js";

const LoginBodySchema = {
  body: {
    type: "object",
    properties: {
      username: { type: "string", minLength: 4 },
    },
    required: ["username"],
  },
};

export default async function (fastify) {
  fastify.post(
    "/api/login",
    { schema: LoginBodySchema },
    loginController.login
  );
}

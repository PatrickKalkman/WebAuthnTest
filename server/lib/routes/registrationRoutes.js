import registrationController from "../controllers/registrationController.js";

export default async function (fastify) {
  fastify.get("/api/registration/options", registrationController.options);
}

import customerController from "../controllers/customerController.js";

export default async function (fastify) {
  fastify.get('/api/customers', customerController.get);
};

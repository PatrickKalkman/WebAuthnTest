import healthController from '../controllers/healthController.js';

export default async function (fastify) {
  fastify.get('/api/health', healthController.getHealth);
}

/* Health service
 * Define the REST endpoint for /health
 * This service responds to health request to validate if the workflow engine is functioning correct
 */
const healthController = {};

healthController.getHealth = (req, reply) => {
  reply.send({
    dateTime: new Date(),
    user: req.user,
  });
};

export default healthController;

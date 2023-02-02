import mongoose from "mongoose";
import pino from "pino";
import Fastify from "fastify";
import sensible from "@fastify/sensible";
import cors from "@fastify/cors";
import fastifyPrintRoutes from "fastify-print-routes";

import config from "./config/config.js";
import log from "./log.js";

import registerHealthRoutes from "./routes/healthRoutes.js";
import registerRegistrationRoutes from "./routes/registrationRoutes.js";

const transport = pino.transport({
  target: "pino-pretty",
  options: { colorize: true },
});

const logger = pino(transport);

const fastify = Fastify({
  logger,
});

fastify.register(fastifyPrintRoutes);
fastify.register(sensible);

fastify.register(cors, {
  origin: "*",
  methods: ["POST", "PUT", "GET", "DELETE"],
});

const server = {};

fastify.register((instance, opts, next) => {
  registerHealthRoutes(instance);
  registerRegistrationRoutes(instance);
  next();
});

server.start = async function start() {
  // server.db = await mongoose.connect(config.database.url);

  fastify.listen({ port: config.httpPort, host: config.httpAddress }, (err) => {
    if (!err) {
      fastify.log.info(
        `The http server is running in ${
          config.envName
        } mode and listening on port ${fastify.server.address().port}`
      );
    } else {
      log.error(
        `An error occurred while trying to start the http server. Err: ${err}`
      );
    }
  });
};

server.stop = async function stop() {
  // await mongoose.disconnect();
  fastify.close((err) => {
    if (err) {
      log.error(
        `An error occurred while trying to close the http server. Err: ${err}`
      );
    }
  });
};

export default server;

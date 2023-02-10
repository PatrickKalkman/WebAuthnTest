import mongoose from "mongoose";
import pino from "pino";
import path from "path";
import Fastify from "fastify";
import sensible from "@fastify/sensible";
import cors from "@fastify/cors";
import fastifyPrintRoutes from "fastify-print-routes";
import fastifyStatic from "@fastify/static";
import fastifySession from "@fastify/session";
import fastifyCookie from "@fastify/cookie";
import { fileURLToPath } from "url";

import config from "./config/config.js";
import log from "./log.js";

import registerHealthRoutes from "./routes/healthRoutes.js";
import registerUserRoutes from "./routes/userRoutes.js";
import registerLoginRoutes from "./routes/loginRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transport = pino.transport({
  target: "pino-pretty",
  options: { colorize: true },
});

const logger = pino(transport);

const fastify = Fastify({
  logger,
});

fastify.register(fastifyStatic, {
  root: path.join(__dirname, "../public"),
  prefix: "/public/",
  default: "/",
});

fastify.register(fastifyPrintRoutes);
fastify.register(sensible);
fastify.register(fastifyCookie);
fastify.register(fastifySession, {
  secret: "myQA58pFBxhJw8UxxbPAXadxY6zZAFvEpVThLhW9",
  cookieName: "sessionId",
  cookie: { secure: false },
  expires: 1800000,
});

fastify.register(cors, {
  origin: "*",
  methods: ["POST", "PUT", "GET", "DELETE"],
});

const server = {};

fastify.register((instance, opts, next) => {
  registerHealthRoutes(instance);
  registerUserRoutes(instance);
  registerLoginRoutes(instance);
  next();
});

server.start = async function start() {
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
  fastify.close((err) => {
    if (err) {
      log.error(
        `An error occurred while trying to close the http server. Err: ${err}`
      );
    }
  });
};

export default server;

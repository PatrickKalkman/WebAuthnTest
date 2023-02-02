"use strict";

/*
 * Workflow
 */

// Dependencies

import log from "./log.js";
import constants from "./config/constants.js";
import database from "./database/database.js";

const liveStreamEngine = {};

liveStreamEngine.showInfo = async () => {
  const pendingLiveStreams = await database.getLiveStreams(
    constants.LIVESTREAM_STATUS.PENDING
  );
  const startedLiveStream = await database.getLiveStreams(
    constants.LIVESTREAM_STATUS.STARTED
  );

  if (
    pendingLiveStreams &&
    startedLiveStream &&
    (pendingLiveStreams.length > 0 || startedLiveStream.length > 0)
  ) {
    log.info(
      `There are ${pendingLiveStreams.length} pending live streams and ${startedLiveStream.length} running live streams`
    );
  } else {
    log.info("There are no live streams");
  }
};

liveStreamEngine.processLiveStreams = async () => {
  try {
    await liveStreamEngine.handlePendingLiveStreams();
  } catch (err) {
    log.error(`An error occurred while processing live streams. Error: ${err}`);
  }
};

liveStreamEngine.handlePendingLiveStreams = async () => {
  const pendingLiveStreams = await database.getLiveStreams(
    constants.LIVESTREAM_STATUS.PENDING
  );
  if (pendingLiveStreams.length === 0) return;

  for (const liveStream of pendingLiveStreams) {
    const url = `https://${liveStream.subDomain}.streamingbuzz.com`;
    log.info(`Validating live stream: ${liveStream.name}`);
    try {
      const res = await fetch(url);
      if (res.status === 200) {
        liveStream.status = constants.LIVESTREAM_STATUS.STARTED;
        liveStream.save();
      }
    } catch (err) {
      log.error(
        `An error occurred while validating the live stream: ${liveStream.name}. Error: ${err}`
      );
    }
  }
};

export default liveStreamEngine;

/*
 * Module that define constants used in the app.
 *
 */

export default Object.freeze({
  HTTP_STATUS_OK: 200,
  HTTP_STATUS_CREATED: 201,
  HTTP_BAD_REQUEST: 400,
  HTTP_STATUS_UNAUTHORIZED: 403,
  HTTP_STATUS_NOT_FOUND: 404,
  HTTP_INTERNAL_SERVER_ERROR: 500,

  HTTP_METHOD_GET: 'get',
  HTTP_METHOD_POST: 'post',
  HTTP_METHOD_PUT: 'put',
  HTTP_METHOD_DELETE: 'delete',

  HLS: 'hls',

  RESPONSE_TYPES: {
    JSON: 'json',
    STREAM: 'stream',
    HTML: 'html',
  },

  LOG_LEVELS: {
    ERROR: 4,
    WARNING: 3,
    INFORMATION: 2,
    DEBUG: 1,
  },

});

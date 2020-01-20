
/** @typedef {Object} Handlers
 * @prop {import("./httpErrorsHandler")} errorsHandler Our custom http errors handler
 * The availavle http handlers.
 */
module.exports = {
  errorsHandler: require('./httpErrorsHandler')
}

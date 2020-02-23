
/**
 * A RestServer configuration instance
 * @class
 * @property {number} port The port of the rest server.
 * @property {String|Function} logFormat The log format used by morgan on the server.
 * @property {import('./backend/rpc').RpcConfig} rpc The config dedicated to the rpc.
 */
class Config {
  /**
     * @constructor
     * @param {number} port The port of the rest server.
     * @param {import('./backend/rpc').RpcConfig} rpc The config dedicated to the rpc.
     */
  constructor (port, rpc) {
    this.port = port || 8000

  }

  /**
     * Load the config from the environment
     * @static
     * @returns {Config}
     */
  static getConfigFromEnvironment () {
    return new Config(
      process.env.LAVA_PORT,
      process.env.LAVA_LOGFORMAT
    )
  }

  /**
     * Load a config from an object
     * @param {object} object The any object.
     * @returns {Config}
     * @static
     *
     */
  static getConfigFromAnyObject (object) {
    return new Config(object.port, object.logFormat)
  }

  /**
     * Load a config from a json file
     * @param {String} file The json config file
     * @returns {Config}
     * @static
     */
  static getConfigFromFile (file) {
    Config.getConfigFromAnyObject(require(file))
  }
}
module.exports = Config

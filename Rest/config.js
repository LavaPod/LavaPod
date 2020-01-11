const RpcConfig = require('./backend/rpc').RpcConfig
/**
 * A RestServer configuration instance
 * @class
 * @property {number} port The port of the rest server.
 * @property {boolean} extended Does this rest server implements the extended api protocol.
 * @property {String|Function} logFormat The log format used by morgan on the server.
 * @property {import('./backend/rpc').RpcConfig} rpc The config dedicated to the rpc.
 */
class Config {
    /**
     * @constructor
     * @param {number} port The port of the rest server.
     * @param {boolean} extended Does this rest server implements the extended api protocol.
     * @param {String|Function} logFormat The log format used by morgan on the server.
     * @param {import('./backend/rpc').RpcConfig} rpc The config dedicated to the rpc.
     */
    constructor(port,extended,logFormat,rpc) {
        this.port = port || 8000
        this.extended = extended || true
        this.logFormat = logFormat || 'dev'
        this.rpc = rpc || new RpcConfig()
    }
    /**
     * Load the config from the environment
     * @static
     * @returns {Config}
     */
    static getConfigFromEnvironment() {
        return new Config(
            process.env.LAVA_PORT,
            process.env.LAVA_EXTENDED,
            process.env.LAVA_LOGFORMAT,
            RpcConfig.getConfigFromEnvironment()
        )
    }
    /**
     * Load a config from an object
     * @param {object} object The any object.
     * @returns {Config}
     * @static
     * 
     */
    static getConfigFromAnyObject(object) {
        return new Config(object.port,object.extended,object.logFormat,RpcConfig.getConfigFromAnyObject(object.rpc))
    }
    /**
     * Load a config from a json file
     * @param {String} file The json config file
     * @returns {Config}
     * @static
     */
    static getConfigFromFile(file) {
        getConfigFromAnyObject(require(file))
    }
}
module.exports = Config
const express = require('express')
const Config = require('./config')
const RpcClient = require('./backend/rpc')
/**
 * @typedef {Object} NodeInfo
 * @property {String} hostname
 * @property {number} corecount
 */

 /**
 * Represents an http server instance
 * @class
 * @property {import('express')} server The http server ( express )
 * @property {import('express').Router} router A router globally available.
 * @property {import('./config')} config The server configuration
 * @property {import('./backend/rpc')} 
 * @property {number} errorsCount The count of errors.
 * @property {NodeInfo} nodeInfo The node's informations
 */
class RestServer {
    /**
     * Constructs the server from the configuration
     * @param {import('./config')} config The configuration applied to the server.
     * @constructor
     * @constructs RestServer
     */
    constructor(config) {

        this.errorsCount = 0
        let os = require('os')
        let load = os.loadavg()
        this.nodeInfo = {
            hostname: os.hostname(),
            corecount: os.cpus().length,
            processor: os.cpus()[0].model,
            loadAvg: {
                1: load[0],
                5: load[1],
                15: load[2]
            }
        }
        

        // Store the server's configuration
        this.config = config

        // First we construct the http server        
        this.server = express()
            .use(require('morgan')(this.config.logFormat))
        
        this.server
            .set('trust proxy')
        
        // Add the the error handlers
        this.registerHandling()
        // Add all the api handlers
        this.registerHandlers()
        // Load rpc excange implementation
        this.loadRpcClient()
        this.server
            .listen(this.config.port)
        console.info(`Server now listening to ::${this.config.port}`)
    }
    /**
     * Load all the specified modules into the router.
     * @returns {void}
     * @private
     */
    registerHandlers() {
        // Load all the different api's routers.
        this.server
            .use(new (require('./apis/lava'))(this))
            .use(new (require('./apis/status'))(this))
        if(this.config.extended) {
            console.warn(`The server have the extended api enabled. This api is currently unstable and souldn't be available in production.`)
            this.server
                .use(new (require('./apis/extended'))(this))
        }
        console.info('All tha api are now loaded.')
    }
    /**
     * Add all the error handling to the http server.
     * @returns {void}
     * @private
     */
    registerHandling() {
        
    }
    /**
     * Initialize the rpc client.
     */
    loadRpcClient() {
        this.rpc = new RpcClient(this.config.rpc)
    }
}
module.exports = RestServer
new RestServer(Config.getConfigFromAnyObject({
    port: 8000,
    extended: false,
    rpc: {
        host: 'localhost'
    }
}))
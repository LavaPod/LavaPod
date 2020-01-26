const express = require('express')
const { STATUS_CODES } = require('http')
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
 * @property {NodeInfo} nodeInfo The node's informations
 */
class RestServer {
  /**
     * Constructs the server from the configuration
     * @param {import('./config')} config The configuration applied to the server.
     * @constructor
     * @constructs RestServer
     */
  constructor (config) {
    const os = require('os')

    this.nodeInfo = () => {
      const load = os.loadavg()
      return {
        hostname: os.hostname(),
        corecount: os.cpus().length,
        processor: os.cpus()[0].model,
        loadAvg: {
          1: load[0] || undefined,
          5: load[1] || undefined,
          15: load[2] || undefined
        },
        version: process.env.VERSION || 'Unnoficial / Developement version'
      }
    }

    // Store the server's configuration
    this.config = config

    // First we construct the http server
    this.server = express()
      .use(this.customElements.bind(this))
      .use(require('morgan')(this.config.logFormat))
      .use(express.raw({ verify: this.rawBody, type: () => true }))

    this.server
      .set('trust proxy')

    // Add all the api handlers
    this.registerHandlers()
    // Add the the error handlers
    this.registerHandling()
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
  registerHandlers () {
    // Load all the different api's routers.
    this.server
      .use(new (require('./apis/lava'))(this))
      .use(new (require('./apis/status'))(this))
    if (this.config.extended) {
      console.warn('The server have the extended api enabled. This api is currently unstable and souldn\'t be available in production.')
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
  registerHandling () {
    this.server
      .use((_, res) => {
        res.status(404).json({
          error: { status: 404, message: STATUS_CODES[404] }
        })
      })
      .use((err, _, res, __) => {
        this.errorsCount++
        res.status(err.status || 500).json({
          error: { status: err.status || 500, message: err.displayMessage ? err.message : STATUS_CODES[err.status || 500] }
        })
      })
  }

  /**
     * Initialize the rpc client.
     */
  loadRpcClient () {
    this.rpc = new RpcClient(this.config.rpc)
  }

  rawBody (req, res, buf, encoding) {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8')
    }
  }

  /**
     *
     * @param {import('express').response} res
     */
  customElements (_, res, next) {
    res
      .header('X-Provider', 'UniX Technology Corporation / Matthieu © 2019')
      .header('X-Node', this.nodeInfo().hostname)
      .header('X-Runtime', 'NodeJs LavaPod Rest')
    next()
  }
}
module.exports = RestServer

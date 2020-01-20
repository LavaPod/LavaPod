const { createServer } = require('http')
const { Server } = require('ws')
const { Handler } = require('./handler/handler.js')
const os = require('os')
/**
 * @typedef {Object} NodeInfo
 * @property {String} hostname
 * @property {number} corecount
 */

/**
 * Represents an http server instance
 * @class
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
  constructor (config) {
    // Store the server's configuration
    this.config = config
    /**
         * Used for the status endpoint.
         */
    this.nodeInfo = () => {
      const load = os.loadavg()
      return {
        hostname: os.hostname(),
        coreCount: os.cpus().length,
        processor: os.cpus()[0].model,
        loadAvg: {
          1: load[0] || undefined,
          5: load[1] || undefined,
          15: load[2] || undefined
        },
        version: process.env.VERSION || 'Developpement version / Unnoficial'
      }
    }
    // We create the websocket server
    this.wss = new Server({
      noServer: true
    })
    this.wss.on('connection', Handler.handle.bind(this))

    // First we construct the http server
    this.http = createServer(this.listener.bind(this))

    // We create the upgrade event, this triggers a connection event in the websocket server.
    this.http.on('upgrade', (request, socket, head) => {
      this.wss.handleUpgrade(request, socket, head, (ws) => {
        this.wss.emit('connection', ws, request, this.http)
      })
    })

    this.http.listen(this.config.port)
    console.info(`Server now listening to ::${this.config.port}`)
  }

  /**
     * Handle all the requests, and the 404 errors.
     * This handles the kubernetes healthchecks.
     * @param {ClientRequest} req
     * @param {include('http').ServerResponse} res
     */
  listener (req, res) {
    res.setHeader('X-Provider', 'UniX Technology Corporation / Matthieu © 2019')
    res.setHeader('X-Provider', this.nodeInfo().hostname)
    res.setHeader('X-Runtime', 'NodeJs LavaPod WebSocket')
    switch (req.url) {
      // No robots are allowed in the api.
      case '/robots.txt':
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end('User-Agent: *\r\nDisallow: /')
        break
        // This is used by the client smh
      case '/status':
        res.end(JSON.stringify({
          nodeInfo: this.nodeInfo()
        }))
        break
        // Used as a kubernetes liveness & readiness probe.
      case '/_healz':
        res.end('OK')
        break
        // Default 404
      default:
        res.end(JSON.stringify({
          error: {
            status: 404,
            message: 'Not Found. This accepts WebSockets connections.'
          }
        }))
        break
    }
  }
}
module.exports = RestServer

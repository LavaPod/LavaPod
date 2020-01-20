const amqp = require('amqplib/callback_api')

/**
 * @class
 * @property {String} host The host of the RabbitMQ Server
 */
class RpcConfig {
  /**
     * @constructor
     * @constructs RpcConfig
     * @property {String} host the RabbitMQ Server.
     */
  constructor (host) {
    this.host = host || 'localhost'
  }

  /**
     * @static
     * @returns {RpcConfig}
     * @param {Object} object The object to use
     */
  static getConfigFromAnyObject (object) {
    return new RpcConfig(object.host)
  }

  /**
     * @static
     * @returns {RpcConfig}
     *
     */
  static getConfigFromEnvironment () {
    return new RpcConfig(
      process.env.LAVA_RPC_HOST
    )
  }
}
/**
 * @typedef {Object} WaitedRequest
 * @property {number} timeout The timout id
 * @property {Function} callback The callback to be called
 */

/**
 * A class used to made requests to any lavalink instance able to handle requests.
 * @class
 * @member {Map<String,WaitedRequest>} waited The current requests.
 */
class RPC {
  /**
     * @constructs RPC
     * @constructor
     * @param {RpcConfig} config The configuration of the rpc server
     */
  constructor (config) {
    this.waited = new Map()
    console.log('Connecting to RabbitMq')
    amqp.connect(`amqp://${config.host}`, (erro0, connection) => {
      if (erro0) {
        console.error('Can\'t connect to RabbitMq', erro0)
        process.exit(1)
      }
      console.info('Connected to the RabbitMq server.')
      connection.createChannel((error1, channel) => {
        if (error1) {
          console.error('Can\'t create the RabbitMq channel', error1)
          process.exit(1)
        }
        console.info('Connected to the channel.')
        this.channel = channel

        channel.assertQueue('', {
          exclusive: true
        }, (error2, queue) => {
          if (error2) {
            console.error('Can\'t create the rpc callback queue', error1)
            process.exit(1)
          }
          console.info('Created the custom queue')
          this.queue = queue
          // Registering the listner.
          this.channel.consume(this.queue.queue, (msg) => {
            if (this.waited.has(msg.properties.correlationId)) {
              const wait = this.waited.get(msg.properties.correlationId)
              clearTimeout(wait.timeout)
              wait.callback(null, msg.content)
            }
          }, {
            noAck: true
          })
        })
      })
    })
  }

  /**
     * Calls a rpc method.
     * @param {String} callName The rpc call name.
     * @param {Object} payload The payload to send to the rpc queue.
     * @param {Function} callback The callback to call once the request is finished.
     */
  rpcCall (callName, payload, callback) {
    const correlationId = RPC.generateUuid()
    this.channel.sendToQueue('rpc_lavapodler', Buffer.from(JSON.stringify({
      call: callName,
      ...payload
    })), {
      correlationId: correlationId,
      replyTo: this.queue.queue
    })

    const timeout = setTimeout(() => callback(new Error('RPC timeout'), null), 5000)

    this.waited.set(correlationId, {
      timeout: timeout,
      callback
    })
  }

  /**
     * Generate a random id.
     * @static
     */
  static generateUuid () {
    return Math.random().toString() +
               Math.random().toString() +
               Math.random().toString()
  }
}
module.exports = RPC
module.exports.RpcConfig = RpcConfig

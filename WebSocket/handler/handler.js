const validate = require('./validator')

class Handler {

  /**
     *
     * @param {WebSocket} ws
     * @param {Request} request
     */
    static async handle (ws, request) {
      console.log('[WS] Connection accepted. Validating the request.')
      if (request.headers['user-id'] && request.headers['num-shards']) {
        ws.userId = request.headers['user-id']
        ws.shardCount = request.headers['num-shards']
        ws.players = []
        ws.addEventListener('close', () => {
          console.log(`[WS:${ws.userId}] Valid client disconnected`)
        })
        ws.addEventListener('error', () => {
          ws.onerror(null)
        })
        ws.addEventListener('message', (m) => {
          if (m.type !== 'message') return
          let payload
          try {
            payload = JSON.parse(m.data)
          } catch (e) { return }
          Handler.handlePayloadInternal.bind(this)(payload, ws)
        })
        return console.log(`[WS:${ws.userId}] Client request validation ✅`)
      }
      ws.close(1010, 'Please, provide shard & client informations.')
      return console.log('[WS] Client request validation')
    }

    static async handlePayloadInternal (payload, ws) {
      console.log(payload)
      switch (payload.op) {
        case 'voiceUpdate':
          let r = await this.nats.allocateLavaPodler({ guild: payload.guildId, user: ws.userId, endpoint: payload.event.endpoint, session: payload.sessionId, token: payload.event.token })
          ws.players[`${payload.guildId}`] = r.rpcQueue
          break
        case 'play':
          console.log(payload)
          await this.nats._sendToPlayer({
            op: 'play',
            guild: payload.guildId,
            track: payload.track
          }, ws.players[payload.guildId])
      }

      console.log('[WS] Not implemented but call ' + payload.op + ' to player ')
    }

    static getShard (numShards, guildId) {
      return (guildId >> 22) % numShards
    }
}

module.exports.Handler = Handler

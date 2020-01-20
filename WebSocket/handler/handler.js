const validate = require('./validator')
const fetch = require('node-fetch')
class Handler {
    static basicRequestValidation = {
      op: { type: 'string', reg: /(voiceUpdate|play|volume|destroy|stop|pause|seek|equalizer)/ }
    }

    static byOpCodeValidation = {
      voiceUpdate: {
        op: { reg: /(voiceUpdate)/ },
        guildId: { type: 'string' },
        sessionId: { type: 'string' },
        event: { type: 'object' }
      },
      play: {
        op: { reg: /(play)/ },
        guildId: { type: 'string' },
        track: { type: 'string' }
        /* Optional fields can't be mapped in the validator */
      },
      stop: {
        op: { reg: /(stop)/ },
        guildId: { type: 'string' }
      },
      pause: {
        op: { reg: /(pause)/ },
        guildId: { type: 'string' },
        pause: { type: 'bool' }
      },
      seek: {
        op: { reg: /(seek)/ },
        guildId: { type: 'string' },
        position: { type: 'number' }
      },
      volume: {
        op: { reg: /(volume)/ },
        guildId: { type: 'string' },
        volume: { type: 'number' }
      },
      equalizer: {
        op: { reg: /(volume)/ },
        guildId: { type: 'string' }
        /* Arrays are not supported by my validator */
      }
    }

    /**
     *
     * @param {WebSocket} ws
     * @param {Request} request
     */
    static handle (ws, request) {
      console.log('[WS] Connection accepted. Validating the request.')
      if (request.headers['user-id'] && request.headers['num-shards']) {
        ws.userId = request.headers['user-id']
        ws.shardCount = request.headers['num-shards']
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
      const validation = validate(payload, Handler.basicRequestValidation)
      if (validation.length > 0) {
        console.log(validation)
        return
      }
      if (Handler.byOpCodeValidation[payload.op]) {
        const opValidation = validate(payload, Handler.byOpCodeValidation[payload.op])
        if (opValidation.length > 0) {
          console.log(opValidation)
          return
        }
      }
      /* eslint no-unused-vars: "warn" */
      const shardId = Handler.getShard(ws.shardCount, payload.guildId)
      const lavapodlerId = await Handler.fetchPlayer(`${payload.userId}:${payload.guildId}`, payload.op === 'voiceUpdate')
      console.log('[WS] Not implemented but call ' + payload.op + ' to player ' + lavapodlerId)
    }

    static getShard (numShards, guildId) {
      return (guildId >> 22) % numShards
    }

    static fetchPlayer (key, create = false) {
      return fetch(`http://${'localhost:2000'}/players/${key}?create=${create}`, {
        method: 'GET'
      }).then((x) => x.json()).then((j) => j.playerId)
    }
}

module.exports.Handler = Handler

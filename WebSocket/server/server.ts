import { Server as WsServer } from 'ws'
import { createServer, IncomingMessage, ServerResponse, Server as HttpServer } from 'http'
import { Socket } from 'net'
import { Logger } from '../common/utils/Logger'
import { connect, Client } from 'nats'
import Redis from 'ioredis'
import StateManager from '../common/state/StateManager'
import { Flake } from '../common/utils/Flake'
import { ExternalOpCode } from '../common/net/external/ExternalOpCodes'
import { InternalPayload } from '../common/net/internal/InternalPayload'
import { InternalOpCodes } from '../common/net/internal/InternalOpCodes'
import { ConnectionState } from '../common/state/ConnectionState'
import { ExternalPayload } from '../common/net/external/ExternalPayload'
import { ConfigureResumingPayload } from '../common/net/external/ConfigureResumingPayload'
import { BaseGuildPayload } from '../common/net/external/guildPayloads/BaseGuildPayload'
import { PlayerState } from '../common/state/PlayerState'
import { VoiceUpdatePayload } from '../common/net/external/guildPayloads/VoiceUpdatePayload'
import { PlayPayload } from '../common/net/external/guildPayloads/PlayPayload'
import { SeekPayload } from '../common/net/external/guildPayloads/SeekPayload'
import { StopPayload } from '../common/net/external/guildPayloads/StopPayload'
import { VolumePayload } from '../common/net/external/guildPayloads/VolumePayload'
import { PausePayload } from '../common/net/external/guildPayloads/PausePayload'

export default class WebSocketServer {
    private websocket: WsServer
    private http: HttpServer
    private logger: Logger
    private redis: Redis.Redis
    private nats: Client
    private inbox: string
    private flake: Flake
    private state: StateManager
    
    public constructor() {
        // Initialize the offline utilities
        this.flake = new Flake
        this.logger = new Logger

        // Connect the data store & transporters
        this.nats = connect(process.env.NATS || 'nats://localhost:4222')
        this.redis = new Redis(parseInt(process.env.REDIS_PORT || '32769'), process.env.REDIS_HOST || 'localhost', { db: 5 })

        // Initialize the data management & event recieving
        this.state = new StateManager(this.redis)
        this.inbox = this.nats.createInbox()
        
        // Start the server
        this.websocket = new WsServer({
            noServer: true
        })

        this.http = createServer((req: IncomingMessage, res: ServerResponse) => {
            // Add some default headers to the response :D
            res.setHeader('X-Provider', 'UniX Technology Corporation / Matthieu © 2019')
            res.setHeader('X-Version', process.env.VERSION || 'unofficial version!')
            res.setHeader('X-Runtime', 'NodeJs LavaPod WebSocket')

            switch (req.url) {
                // Disallow the robots on all the url(s)
                case '/robots.txt':
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
                    res.end('User-Agent: *\r\nDisallow: /')
                    break
                // Kubernetes healthcheck.
                case '/_healz':
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
                    res.end('OK')
                    break
                // Default 400 Error.
                default:
                    res.end(JSON.stringify({
                        error: {
                        status: 400,
                        message: 'Invalid request. This service only accepts websocket upgrades.'
                        }
                    }))
                    break
            }
        })

        // Websocket connection validation.
        this.http.on('upgrade', async (request: IncomingMessage, socket: Socket, headers: Buffer, response: Response ) => {

            // This is required for a lavalink websocker connection.
            if(request.headers['user-id'] && request.headers['num-shards']) {
                // If a resume is requested.
                if(request.headers['resume-key']) {
                    // We try to get the key from the store.
                    const resume = await this.state.ConnectionRemoveTimeout(`${socket.remoteAddress}${<string>request.headers['resume-key']}`)
                    if(resume) {
                        let state = await this.state.ConnectionGet(resume)
                        this.websocket.handleUpgrade(request, socket, headers, (websocket) => this.websocket.emit('connection', websocket, request, state))
                    }
                } else this.websocket.handleUpgrade(request, socket, headers, (websocket) => this.websocket.emit('connection', websocket, request, null))
            }
        })

        // Register the handler.
        this.websocket.on('connection', this.handleConnection.bind(this))
    }

    /**
     * Handles the messages from teh lavapodler(s).
     * @param inbox 
     * @param _ 
     */
    private async handleInbox(inbox: string, _: any) {
        let payload: InternalPayload
        try {
            payload = <InternalPayload>JSON.parse(inbox)
        } catch (_) { return }

        // Search the targetted player ( by id ).
        const player = await this.state.PlayerGet(payload.t)

        let send: any

        if(payload.o === InternalOpCodes.JUST_SEND) {
            send = payload.d
        } else if (payload.o === InternalOpCodes.PLAYER_UPDATE) {
            send = {
                op: 'playerUpdate',
                guildId: player.guild,
                state: {
                    time: payload.d.time,
                    position: payload.d.position
                }
            }
        } else if (payload.o === InternalOpCodes.PLAYER_EVENT) {
            send = {
                op: 'event',
                ...payload.d
            }
        }

        this.websocket.clients.forEach(async client => {
            if(client['trackingId'] === player.connection) {
                client.send(JSON.stringify(send))
                await this.state.PlayerSet(payload.t, player)
            }
        })
    }

    private async handleConnection(socket: WebSocket, request: IncomingMessage, state: ConnectionState) {
        let trackingId
        if (!state) {
            trackingId = this.flake.gen()
            state = {
                peer: request.socket.remoteAddress,
                trackingId: trackingId,
                players: [],
                userId: <string>request.headers['user-id'],
                numShards: <string>request.headers['num-shards']
            }
            await this.state.ConnectionSet(trackingId, state)
        } else trackingId = state.trackingId

        // Put a variable in the websocket object to recognize the client in the inbox function.
        Object.assign(this.websocket, { trackingId: state.trackingId })

        // when the client disconnects from the server.
        socket.addEventListener('close', async (_) => {
            const state = await this.state.ConnectionGet(trackingId)
            if(state && state.resumeToken)
                await this.state.ConnectionSetConnectionTimeout(trackingId, 5000, state.resumeToken)
        })

        // The message handler.
        socket.addEventListener('message', async (message) => {
            let json: ExternalPayload
            try {
                json = <ExternalPayload>JSON.parse(message.data)
            } catch (e) {}

            if(json.op === 'configureResuming') {
                let payload = <ConfigureResumingPayload>json
                json = undefined
                const newState = await this.state.ConnectionGet(trackingId)
                    .then(state => {
                        state.resumeToken = payload.key
                        return state
                    })
                await this.state.ConnectionSet(trackingId, newState)
                return
            }

            const payload = <BaseGuildPayload>json
            json = undefined
            // From now, all the possible events require the guildPlayer indentificator.
            const guildPlayer: PlayerState = await this.state.PlayerGet(`${state.trackingId}${payload.guildId}`)

            if (json.op === ExternalOpCode.VOICE_UPDATE) {
                const voiceUpdatePayload: VoiceUpdatePayload = <VoiceUpdatePayload>payload
                if(guildPlayer) {
                    this.nats
                        .publish(guildPlayer.lavapodlerIdentifier, JSON.stringify({
                            o: InternalOpCodes.VOICE_UPDATE,
                            guild: payload.guildId,
                            endpoint: voiceUpdatePayload.event.endpoint,
                            session: voiceUpdatePayload.sessionId,
                            token: voiceUpdatePayload.event.token
                        } as InternalPayload))
                } else {
                    this.nats
                        .request('attribution.lavapodler', JSON.stringify({
                            o: InternalOpCodes.VOICE_UPDATE,
                            guild: payload.guildId,
                            endpoint: voiceUpdatePayload.event.endpoint,
                            session: voiceUpdatePayload.sessionId,
                            token: voiceUpdatePayload.event.token,
                            user: state.userId,
                            inbox: this.inbox
                        } as InternalPayload), { timeout: 3000, max: 1 }, async (response) => {
                            await this.state.PlayerSet(`${state.trackingId}${payload.guildId}`, {
                                lavapodlerIdentifier: response,
                                guild: voiceUpdatePayload.guildId,
                                connection: state.trackingId,
                            } as PlayerState)
                        })
                }
            }
            
            // From now, we need to have a registered player!
            if(!guildPlayer) return

            // completely destroys the player ( in redis too )
            if (json.op === ExternalOpCode.DESTROY) {
                this.nats
                    .publish(guildPlayer.lavapodlerIdentifier, JSON.stringify({
                        o: InternalOpCodes.DESTROY,
                        guild: guildPlayer.guild
                    } as InternalPayload))
                this.state.PlayerDelete(`${state.trackingId}${payload.guildId}`)
            } else if (json.op === ExternalOpCode.PLAY) {
                const playPayload: PlayPayload = <PlayPayload>json
                json = undefined
                this.nats
                    .publish(guildPlayer.lavapodlerIdentifier, JSON.stringify({
                        o: InternalOpCodes.PLAY,
                        guild: guildPlayer.guild,
                        track: playPayload.track,
                        noReplace: playPayload.noReplace,
                        endTime: playPayload.endTime,
                        startTime: playPayload.startTime
                    } as InternalPayload))
            } else if (json.op === ExternalOpCode.SEEK) {
                const seekPayload: SeekPayload = <SeekPayload>json
                json = undefined
                this.nats
                    .publish(guildPlayer.lavapodlerIdentifier, JSON.stringify({
                        o: InternalOpCodes.SEEK,
                        guild: guildPlayer.guild,
                        position: seekPayload.position
                    } as InternalPayload))
            } else if (json.op === ExternalOpCode.STOP) {
                const stopPayload: StopPayload = <StopPayload>json
                json = undefined
                this.nats
                    .publish(guildPlayer.lavapodlerIdentifier, JSON.stringify({
                        o: InternalOpCodes.STOP,
                        guild: guildPlayer.guild
                    } as InternalPayload))
            } else if (json.op === ExternalOpCode.VOLUME) {
                const volumePayload: VolumePayload = <VolumePayload>json
                json = undefined
                this.nats
                    .publish(guildPlayer.lavapodlerIdentifier, JSON.stringify({
                        o: InternalOpCodes.VOLUME,
                        guild: guildPlayer.guild,
                        volume: volumePayload.volume
                    } as InternalPayload))
            } else if(json.op === ExternalOpCode.PAUSE) {
                const pausePayload: PausePayload = <PausePayload>json
                json = undefined
                this.nats
                    .publish(guildPlayer.lavapodlerIdentifier, JSON.stringify({
                        o: InternalOpCodes.PAUSE,
                        guild: guildPlayer.guild,
                        pause: pausePayload.pause
                    } as InternalPayload))
            }
        })
    }
    public start(port = 8081) {
        this.http.listen(port)
        this.nats.subscribe(this.inbox, this.handleInbox.bind(this))
        this.logger.log('Listening to :'+port)
    }
}
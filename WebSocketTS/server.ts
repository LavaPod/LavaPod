import { Server } from 'ws'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'
import { Logger } from './logger'
import { connect, Client } from 'nats'
import Redis from 'ioredis'

export default class WebSocketServer {
    private websocket: Server
    private http: import("http").Server
    private logger: Logger
    private redis: Redis.Redis
    private nats: Client
    private inbox: string
    
    public constructor() {

        this.logger = new Logger()

        this.nats = connect(`nats://${process.env.NATS || 'localhost'}`)
        this.redis = new Redis({
            sentinels: [ { host: 'rfs-lavapod.lavapod', port: 26379 } ]
        })

        this.inbox = this.nats.createInbox()

        this.websocket = new Server({
            noServer: true
        })

        this.http = createServer((req: IncomingMessage, res: ServerResponse ) => {
            res.setHeader('X-Provider', 'UniX Technology Corporation / Matthieu © 2019')
            res.setHeader('X-Runtime', 'NodeJs LavaPod WebSocket')

            switch (req.url) {
                case '/robots.txt':
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
                    res.end('User-Agent: *\r\nDisallow: /')
                    break
                case '/_healz':
                    res.end('OK')
                    break
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

        this.http.on('upgrade', (request: IncomingMessage, socket: Socket, headers: Buffer ) => {
            if(request.headers['user-id'] && request.headers['num-shards']) {
                this.websocket.handleUpgrade(request, socket, headers, (websocket) => this.websocket.emit('connection', websocket, request, this.http))
            }
        })

        this.websocket.on('connection', this.handleConnection.bind(this))
    }

    handleInbox(inbox: string, handleInbox: any) {
        
        let json
        try {
            json = JSON.parse(inbox)
        } catch (e) {}

        console.log(json)

        if((json.op === 'event' || json.op === 'playerUpdate') && json.user) {
            
            if(this.websocket)
            this.websocket.clients.forEach(x => {
                
                if(x['user'] === json.user) {
                    console.log('sent!')
                    x.send(JSON.stringify(json))
                }
            })

        }

    }

    handleConnection(socket: WebSocket, request: IncomingMessage, server: import('http').Server) {

        if(request.headers['user-id'] && request.headers['num-shards']) {

            Object.assign(socket, {
                user: request.headers['user-id']
            })

            socket.addEventListener('message', async (message) => {
                let json
                try {
                    json = JSON.parse(message.data)
                } catch (e) {}
                
                
                if(json.op === 'voiceUpdate') {
                    // In case of a voiceUpdate, we need to check if the connection is currently playing something.

                    if(json.guildId && json.sessionId && json.event && json.event.token && json.event.guildid && json.event.endpoint) {
                        // Valid request.

                        // Retieve the data from redis.
                        let response = await this.redis.get(`${json.guildId}|${request.headers['user-id']}`)
                        
                        if(response) {
                            // Send to this player.
                            this.nats.publish(response, JSON.stringify({
                                op: 'voiceUpdate',
                                guild: json.guildId,
                                endpoint: json.event.endpoint,
                                session: json.sessionId,
                                token: json.event.token
                            }))

                        } else {
                            this.nats.request('attribution.lavapodler', JSON.stringify({ 
                                op: 'connect',
                                guild: json.guildId,
                                user: request.headers['user-id'],
                                inbox: this.inbox,
                                endpoint: json.event.endpoint,
                                session: json.sessionId,
                                token: json.event.token
                             }), { timeout: 3000, max: 1 }, async (response) => {
                                await this.redis.set(`${json.guildId}|${request.headers['user-id']}`, JSON.parse(response).host)
                            })
                        }
                    }
                } else if (json.op === 'play') {

                    if(json.guildId && json.track) {

                        let response = await this.redis.get(`${json.guildId}|${request.headers['user-id']}`)

                        if(response) {
                            this.nats.publish(response, JSON.stringify({
                                op: 'play',
                                guild: json.guildId,
                                track: json.track,
                                noReplace: json.noReplace,
                                endTime: json.endTime,
                                startTime: json.startTime
                            }))
                        }

                    }

                } else if (json.op === 'stop') {

                    if(json.guildId) {

                        let response = await this.redis.get(`${json.guildId}|${request.headers['user-id']}`)

                        if(response) {

                            this.nats.publish(response, JSON.stringify({
                                op: 'stop',
                                guild: json.guildId
                            }))

                        }
                    }

                } else if (json.op === 'volume') {

                    if(json.volume && json.guildId) {

                        let response = await this.redis.get(`${json.guildId}|${request.headers['user-id']}`)

                        if(response) {

                            this.nats.publish(response, JSON.stringify({
                                op: 'volume',
                                guild: json.guildId,
                                volume: json.volume
                            }))

                        }

                    }

                } else if (json.op === 'pause') {

                    if(json.guildId && json.pause != null) {

                        let response = await this.redis.get(`${json.guildId}|${request.headers['user-id']}`)

                        if(response) {

                            this.nats.publish(response, JSON.stringify({
                                op: 'pause',
                                guild: json.guildId,
                                pause: json.pause
                            }))

                        }

                    }

                } else if (json.op === 'seek') {

                    if(json.guildId && json.position) {

                        let response = await this.redis.get(`${json.guildId}|${request.headers['user-id']}`)

                        if(response) {

                            this.nats.publish(response, JSON.stringify({
                                op: 'seek',
                                guild: json.guildId,
                                position: json.position
                            }))

                        }
                        
                    }

                } else if (json.op === 'destroy') {



                }


            })

        } else {
            socket.close()
        }
    }
    start() {
        this.http.listen(8000)
        this.logger.log('Server now listening to ::8000')
        this.nats.subscribe(this.inbox,this.handleInbox.bind(this))
    }
} 
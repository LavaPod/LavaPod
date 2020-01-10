const ws = require('ws')
const http = require('http');
module.exports = class WebSocketServer {
    constructor(config) {
        console.log(`Starting WSS server...`)
        this.wss = new ws.Server({
            noServer: true
        })
        this.http = http.createServer()

        this.http.on('upgrade',this.upgrade.bind(this))

        this.wss.once('listening',() => {
            console.log(`Now listening on ::${config.port}`)
        })
        this.wss.on('connection',this.handleConnection.bind(this))
        this.http.listen(config.port)
    }
    handleConnection(connection) {
        console.log(`[ WSS ] New connection openned. With shard count [${connection.shardCount}]`)
        
        connection.on('close',this.close.bind({server:this,socket:connection}))
        connection.on('open', this.open.bind({server:this,socket:connection}))
        connection.on('message',this.message.bind({server:this,socket:connection}))
    }
    upgrade(request, socket, head) {
        this.wss.handleUpgrade(request, socket, head, function done(ws) {
            ws.shardCount = request.headers['num-shards']
            ws.userId = request.headers['user-id']
            this.wss.emit('connection', ws, request);
        }.bind(this));
    }
    close() {
        console.log('Connection closed')
    }
    open(ws) {
        console.log(`Connection openned`)
    }
    message(message) {
        console.log(`Message recevied ${message} from `)
    }
}
const amqp = require('amqplib/callback_api');

class RPClient {
    constructor(config) {
        amqp.connect(`amqp://${config}`,(erro0,connection) => {
            if(erro0) throw erro0

            connection.createChannel((error1,channel) => {
                if(error1) throw error1
                
                this.channel = channel

                channel.assertQueue('',{
                    exclusive: true
                }, (error2,queue) => {
                    if(error2) throw error2

                    this.queue = queue

                    this.channel.consume(this.queue.queue,(msg) => {
                        if(this.waited.has(msg.properties.correlationId)) {
                            let wait = this.waited.get(msg.properties.correlationId);
                            clearTimeout(wait.timeout)
                            wait.callback(null,msg.content)
                        }
                    }, {
                        noAck: true
                    })
                })
            })
        })
        this.waited = new Map()
    }

    rpcCall(callName,payload,callback) {
        let correlationId = this.generateUuid()
        this.channel.sendToQueue('rpc_queue_lavapodler', Buffer.from(JSON.stringify({
            call: callName,
            ...payload
        })),{
            correlationId: correlationId,
            replyTo: this.queue.queue
        })

        let timeout = setTimeout(() => callback(new Error('RPC timeout'),null),5000)

        this.waited.set(correlationId,{
            timeout: timeout,
            callback
        })
    }

    loadTracks(identifier) {
        return new Promise((accept,reject) => {
            this.rpcCall('loadTracks',{
                identifier: identifier
            },(err,buffer) => {
                if(err) return reject(err)
                accept(buffer.toString())
            })
        })
    }
    decodeTrack(trackDescriptor) {
        return new Promise((accept,reject) => {
            this.rpcCall('decodeTrack',{
                descriptor: trackDescriptor.toString()
            },(err,buffer) => {
                if(err) return reject(err)
                accept(buffer.toString())
            })
        })
    }
    decodeTracks(trackDescriptor) {
        return new Promise((accept,reject) => {
            this.rpcCall('decodeTracks',{
                descriptor: trackDescriptor
            },(err,buffer) => {
                if(err) return reject(err)
                accept(buffer.toString())
            })
        })
    }

    generateUuid() {
        return Math.random().toString() +
               Math.random().toString() +
               Math.random().toString();
    }
}
module.exports = RPClient
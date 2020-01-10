const amqp = require('amqplib/callback_api');
module.exports = class Connection {

    constructor() {
        amqp.connect('amqp://localhost', (error, connection) => {
            if(error) {
                throw error
            }
            connection.createChannel((error2,channel) => {
                if(error2) {
                    throw error2
                }
                this.channel = channel;
            })
        })
    }
    _postData(data) {
        this.channel.sendToQueue('lavachestrator',Buffer.from(JSON.stringify(data)))
    }
    play(data) {
        this._postData(data)
    }
    voiceUpdate(data) {
        this._postData(data)
    }
    stop(data) {
        this._postData(data)
    }
    pause(data) {
        this._postData(data)
    }
    seek(data) {
        this._postData(data)
    }
    volume(data) {
        this._postData(data)
    }
    equalizer(data) {
        this._postData(data)
    }
    detroy(data) {
        this._postData(data)
    }
    configureResuming(data) {
        this._postData(data)
    }
}
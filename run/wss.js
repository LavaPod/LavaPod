const WebSocketserver = require('../WebSocket/index')
// This create a developement WebSocketserver
module.exports = () => {
    return new WebSocketserver({
        port: 8000
    })
}
module.exports()
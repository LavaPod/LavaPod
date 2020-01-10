const RestServer = require('../Rest/index')
// This create a developement WebSocketserver
module.exports = () => {
    return new RestServer({
        port: 7885,
        rpc: 'localhost'
    })
}
module.exports()
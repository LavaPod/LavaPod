const Config = require('./config')
const WebSocket = require('./index')
const { RpcConfig } = require('./backend/rpc')
let run = 'dev'
let config
if (process.argv[2]) {
  run = process.argv[2].replace('--', '')
}
console.log(run)
switch (run) {
  case 'dev':
    config = new Config(8000, new RpcConfig('localhost'), true)
    break
  case 'docker':
    config = Config.getConfigFromEnvironment()
    break
  default:
    break
}
WebSocket(config)

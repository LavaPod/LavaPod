const Config = require('./config')
const WebSocket = require('./index')
let run = 'dev'
let config
if (process.argv[2]) {
  run = process.argv[2].replace('--', '')
}
console.log(run)
switch (run) {
  case 'dev':
    config = new Config(8000, true)
    break
  case 'docker':
    config = Config.getConfigFromEnvironment()
    break
  default:
    break
}
new WebSocket(config)

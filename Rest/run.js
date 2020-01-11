const Config = require('./config')
const RestServer = require('./index')
const { RpcConfig } = require('./backend/rpc')
let run = 'dev'
let config
if(process.argv[2]) {
    run = process.argv[2].replace('--','')
}
console.log(run)
switch (run) {
    case 'dev':
        config = new Config(8000,true,'dev',new RpcConfig('localhost'))
    case 'docker':
        config = Config.getConfigFromEnvironment()
    default:
        break
}
new RestServer(config)
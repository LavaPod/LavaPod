const runOrchestrator = 'DevelopementRunners/orchestrator'
const runRest = 'DevelopementRunners/rest'
const runWs = 'DevelopementRunners/wss'

// Used to create child processes.
const { spawn } = require('child_process')
let processes = []

module.exports = () => { 

    const options = {
        stdio: ['pipe', 'pipe', process.stderr]
    }

    console.log(`[0/3] Starting processes... [===]`)
    // Run the orchestrator
    processes = [ ...processes, [ spawn(`node`,[runOrchestrator], options), runOrchestrator ] ]
    console.log(`[Spawner] Spawned new node process ( ${runOrchestrator} )`)
    console.log(`[1/3] Starting processes... [=>=]`)
    // Run the rest server
    processes = [ ...processes, [ spawn(`node`,[runRest], options), runRest ] ]
    console.log(`[Spawner] Spawned new node process ( ${runRest} )`)
    console.log(`[2/3] Starting processes... [==>]`)
    // Run the websocket server
    processes = [ ...processes, [ spawn(`node`,[runWs], options), runWs ] ]
    console.log(`[Spawner] Spawned new node process ( ${runWs} )`)
    console.log(`[3/3] Starting processes... [===]`)

    processes.forEach((proc) => {
        proc[0].stdout.on('data',(data) => {
            console.log(`[${proc[1]}] ${data}`)
        })
    })

    console.log(`[Spawner] Succesfully configured everyhing`)
}
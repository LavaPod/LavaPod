const nats = require('nats')

const natsClient = nats.connect('nats://localhost')

const inboxSubject = natsClient.createInbox()

natsClient.subscribe(inboxSubject, (data) => {
  const json = JSON.parse(data)
  console.log(json)
})

natsClient.request('attribution.lavapodler', JSON.stringify({
  op: 'connect',
  guildId: '532201922690678784',
  user: '532592918054174721',
  webSocket: inboxSubject,
  endpoint: 'southafrica167.discord.media:80',
  session: '69011638edc16b702c59cf9b19702717',
  token: '197c0df34fda2fc7'
}), (data) => {
console.log('Lavapodler attribued!')
})

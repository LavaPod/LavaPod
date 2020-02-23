const nats = require('nats')

module.exports = class Nats {
  constructor () {
    this.client = nats.connect('nats://localhost')
    this.inboxSubject = this.client.createInbox()
    this.client.subscribe(this.inboxSubject, (data) => {
      console.log('Recevied inbox!', data)
    })
  }

  allocateLavaPodler({ guild, user, endpoint, session, token }) {
    return new Promise((res, rej) => {
      this.client.request('attribution.lavapodler', JSON.stringify({
        op: 'connect',
        user,
        guildId: guild,
        endpoint,
        session,
        token,
        webSocket: this.inboxSubject
      }), { max: 1, timeout: 1000 }, (data) => {
        if(data instanceof nats.NatsError) {
          rej(new Error('Can\'t allocate a player.'))
        }
        res(JSON.parse(data))
      })
    })
  }

  _sendToPlayer(data, to) {
    this.client.publish(to, JSON.stringify(data), () => {

    })
  }
}
const IoRedis = require('ioredis')

module.exports = class Redis {
    constructor() {
        this.redis = new IoRedis()
    }

    isPlayerForGuildRegistered({ guild, user }) {
        return this.redis.get(`${guild}${user}`)
    }
}
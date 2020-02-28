import { Redis } from "ioredis";
import MessagePack from 'msgpack-lite'
import { PlayerState } from "./PlayerState";
import { ConnectionState } from "./ConnectionState";
export default class StateManager {


    private redis: Redis;
    public constructor(redis: Redis) {
        this.redis = redis
    }
    public async ConnectionSetAndGet(player: string, newState: ConnectionState): Promise<ConnectionState> {
        await this.redis.set(`${player}-connectionState`, MessagePack.encode(newState))
        return newState
    }
    public async ConnectionSet(player: string, newState: ConnectionState): Promise<void> {
        await this.redis.set(`${player}-connectionState`, MessagePack.encode(newState))
    }
    public async ConnectionGet(player: string): Promise<ConnectionState> {
        let state = await this.redis.getBuffer(`${player}-connectionState`)
        if(state !== null)
            return <ConnectionState>MessagePack.decode(state)
        return null
    }
    public async ConnectionSetConnectionTimeout(player: string, time: number, key: string) {
        if(this.ConnectionHas(player)) {
            this.redis.expire(`${player}-connectionState`, time / 1000)
            this.redis.set(`${key}-resume`, player, 'EX', time / 1000)
        }
    }

    public async ConnectionRemoveTimeout(key: string): Promise<string> {
        let resume = await this.redis.get(`${key}-resume`)
        if(!resume) return null
        let session = await this.ConnectionGet(resume)
        if(!session) return null
        await this.redis.del(`${key}-resume`)
        await this.redis.persist(`${resume}-connectionState`)
        return resume
    }

    public async ConnectionHas(player: string): Promise<boolean> {
        return (await this.redis.keys(`${player}-connectionState`)).length > 0
    }

    public async PlayerGet(target: string): Promise<PlayerState> {
        let state = await this.redis.getBuffer(`${target}-player`)
        return <PlayerState>MessagePack.decode(state)
    }
    public async PlayerSet(target: string, newState: PlayerState): Promise<void> {
        await this.redis.set(`${target}-player`, MessagePack.encode(newState))
    }
    public async PlayerDelete(target: string): Promise<void> {
        await this.redis.del(target)
    }


}
/**
 * Matthieu P. © UniX Corp 2020.
 * This files describes the available opcodes for the LavaPod Websocket server.
 * All the events ares described here <https://github.com/Frederikam/Lavalink/blob/master/IMPLEMENTATION.md>
 */

export enum ExternalOpCode {
    VOICE_UPDATE = 'voiceUpdate',
    PLAY = 'play',
    STOP = 'stop',
    SEEK = 'seek',
    VOLUME = 'volume',
    DESTROY = 'destroy',
    PAUSE = 'pause',
    CONFIGURE_RESUMING = 'configureResuming',
    EVENT_DISPATCH = 'event'
}
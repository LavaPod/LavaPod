/**
 * Matthieu P. © UniX Corp 2020.
 * This files describes the available opcodes for the internal LavaPod api.
 * This is just useful when you use these opcode everywhere.
 */

export enum InternalOpCodes {

    VOICE_UPDATE = 0x1,
    PLAY = 0x2,
    STOP = 0x3,
    PAUSE = 0x4,
    SEEK = 0x5,
    VOLUME = 0x6,
    DESTROY = 0x7,


    PLAYER_UPDATE = 0x8,
    PLAYER_EVENT = 0x9,
    JUST_SEND = 0x10
}
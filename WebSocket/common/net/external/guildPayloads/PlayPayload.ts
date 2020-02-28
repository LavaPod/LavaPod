/**
 * Matthieu P. © UniX Corp 2020.
 * This file describe the payload for the play ws command.
 */

import { BaseGuildPayload } from "./BaseGuildPayload";

export class PlayPayload extends BaseGuildPayload {
    public track: string
    public startTime?: number
    public endTime?: number
    public noReplace?: boolean
}
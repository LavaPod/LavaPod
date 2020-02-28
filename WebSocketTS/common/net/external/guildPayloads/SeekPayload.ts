/**
 * Matthieu P. © UniX Corp 2020.
 * This file describe the payload for the seek ws command.
 */

import { BaseGuildPayload } from "./BaseGuildPayload";

export class SeekPayload extends BaseGuildPayload {
    public position: number
}
/**
 * Matthieu P. © UniX Corp 2020.
 * This file describe the payload for the pause ws command.
 */

import { BaseGuildPayload } from "./BaseGuildPayload";

export class PausePayload extends BaseGuildPayload {
    public pause: boolean
}
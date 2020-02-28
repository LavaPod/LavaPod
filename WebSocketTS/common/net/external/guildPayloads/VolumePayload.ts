/**
 * Matthieu P. © UniX Corp 2020.
 * This file describe the payload for the volume ws command
 */

import { BaseGuildPayload } from "./BaseGuildPayload";

export class VolumePayload extends BaseGuildPayload {
    public volume: number
}
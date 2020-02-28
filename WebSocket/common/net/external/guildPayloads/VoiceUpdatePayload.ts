/**
 * Matthieu P. © UniX Corp 2020.
 * This file describe the payload for the voiceUpdate ws command.
 */

import { BaseGuildPayload } from "./BaseGuildPayload";

export class VoiceUpdatePayload extends BaseGuildPayload {
    public sessionId: string
    public event: { endpoint: string, token: string }
}
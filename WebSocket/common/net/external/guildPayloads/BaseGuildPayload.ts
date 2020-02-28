/**
 * Matthieu P. © UniX Corp 2020.
 * This file describe the base paylaod for all the guilds payloads.
 */

import { ExternalPayload } from "../ExternalPayload";

 export class BaseGuildPayload extends ExternalPayload {
     public guildId: string
 }
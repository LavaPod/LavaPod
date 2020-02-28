/**
 * Matthieu P. © UniX Corp 2020.
 * This file describe the basic payload on the LavaPod internal infrastructure.
 */
import { InternalOpCodes } from "./InternalOpCodes"

export class InternalPayload {
    public o: InternalOpCodes
    public d?: any
    public t?: string
}
const { Router } = require("express");

/**
 * This api router responsible of the whole lavalink api implementation.
 * @property {import('../index')} server The api server.
 * @extends {import('express').Router} 
 * @class
 */
class LavaApi extends Router {
    /**
     * Constructs the LavaApi from a RestServer
     * @param {import('../index')} server The api server.
     * @constructor
     * @constructs LavaApi
     */
    constructor(server) {
        super()
        this.server = server
        
        this
            .get(['/decodetrack'],LavaApi.decodeTrack.bind(this))
            .get(['/loadtracks'],LavaApi.loadTracks.bind(this))
            .get(['/decodetracks'],LavaApi.decodeTracks.bind(this))

        console.log('Lava API succesfully loaded.')
    }
    /**
     * Handle the decodeTracks request.
     * @private
     * @param {import('express').request} request
     * @param {import('express').response} response
     * @this {LavaApi}
     */
    static decodeTracks(request,response,next) {
        // Handle this with the rpc callers.
        response.json({
            code: 500,
            message: 'Not implemented'
        })
    }
    /**
     * Handle the loadTracks request.
     * @private
     * @param {import('express').request} request
     * @param {import('express').response} response
     * @this {LavaApi}
     */
    static loadTracks(request,response,next) {
        // Handle this with the rpc callers.
        next()
    }
    /**
     * Handle the decodeTrack request.
     * @private
     * @param {import('express').request} request
     * @param {import('express').response} response
     * @this {LavaApi}
     */
    static decodeTrack(request,response,next) {
        // Handle this with the rpc callers.
        next()
    }
}
module.exports = LavaApi
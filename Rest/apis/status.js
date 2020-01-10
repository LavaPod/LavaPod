const { Router } = require("express");

/**
 * This api router responsible of the status system.
 * @property {import('../index')} server The api server.
 * @extends {import('express').Router} 
 * @class
 */
class StatusApi extends Router {
    /**
     * Constructs the StatusApi from a RestServer
     * @param {import('../index')} server The api server.
     * @constructor
     * @constructs StatusApi
     */
    constructor(server) {
        super()
        this.server = server

        this.
            get(['/status'],StatusApi.getStatus.bind(this))

        console.log('Status API succesfully loaded.')
    }
    /**
     * Handle the status request.
     * @private
     * @param {import('express').request} request
     * @param {import('express').response} response
     * @this {StatusApi}
     */
    static getStatus(request,response) {
        
        response.json({
            errorsCount: this.server.errorsCount,
            nodeInfo: this.server.nodeInfo
        })
    }
}
module.exports = StatusApi
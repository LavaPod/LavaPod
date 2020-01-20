const { Router } = require('express')

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
  constructor (server) {
    super()
    this.server = server

    this
      .get(['/decodetrack'], LavaApi.decodeTrack.bind(this))
      .get(['/loadtracks'], LavaApi.loadTracks.bind(this))
      .get(['/decodetracks'], LavaApi.decodeTracks.bind(this))
    console.log('Lava API succesfully loaded.')
  }

  /**
     * Handle the decodeTracks request.
     * @private
     * @param {import('express').request} request
     * @param {import('express').response} response
     * @this {LavaApi}
     */
  static decodeTracks (request, response, next) {
    let json
    try {
      json = JSON.parse(request.rawBody)
    } catch (e) {
      e.status = 400
      e.message = 'Invalid json input.'
      e.displayMessage = true
      return next(e)
    }
    this.server.rpc.rpcCall('decodeTracks', {
      descriptor: json
    }, (error, payload) => {
      if (error) {
        error.status = 500
        return next(error)
      }
      response.contentType('json')
      response.send(payload.toString())
    })
  }

  /**
     * Handle the loadTracks request.
     * @private
     * @param {import('express').request} request
     * @param {import('express').response} response
     * @this {LavaApi}
     */
  static loadTracks (request, response, next) {
    if (!request.query.identifier) {
      return next({
        message: 'Missing identifier query',
        status: 400,
        displayMessage: true
      })
    }
    this.server.rpc.rpcCall('loadTracks', {
      identifier: request.query.identifier
    }, (err, payload) => {
      if (err) {
        err.status = 500
        return next(err)
      }
      response.contentType('json')
      response.send(payload.toString())
    })
  }

  /**
     * Handle the decodeTrack request.
     * @private
     * @param {import('express').request} request
     * @param {import('express').response} response
     * @this {LavaApi}
     */
  static decodeTrack (request, response, next) {
    console.log(request.rawBody)
    this.server.rpc.rpcCall('decodeTrack', {
      descriptor: request.rawBody
    }, (err, payload) => {
      if (err) {
        err.status = 500
        err.displayMessage = true
        return next(err)
      }
      response.contentType('json')
      response.send(payload.toString())
    })
  }
}
module.exports = LavaApi

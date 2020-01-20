const { Router } = require('express')

/**
 * Tha api router responsible of the whole custom api.
 * @property {import('../index')} server The api server.
 * @extends {import('express').Router}
 * @class
 */
class ExtendApi extends Router {
  /**
     * Constructs the LavaApi from a RestServer
     * @param {import('../index')} server The api server.
     * @constructor
     * @constructs ExtendApi
     */
  constructor (server) {
    super()
    this.server = server

    console.log('Extended API succesfully loaded.')
  }
}
module.exports = ExtendApi

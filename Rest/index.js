const express = require('express')

module.exports = class RestServer {
    
    constructor(config) {

        this.rpc = new (require('./rpcClient'))(config.rpc)
        this.http = express()
        
        var rawBodySaver = function (req, res, buf, encoding) {
            if (buf && buf.length) {
              req.rawBody = buf.toString(encoding || 'utf8');
            }
        }
        this.http
            .use(express.raw({ verify: rawBodySaver, type: () => true }))
        this.http.set('trust proxy')
        this.http.get(['/decodetrack'], this.decodetrack.bind(this))
        this.http.get(['/loadtracks'], this.loadTracks.bind(this))
            
        this.http.get(['/decodetracks'],this.decodeTracks.bind(this))
        this.http.use((_,res,__) => {
            
			res.status(404).json({
				error: { status: 404, message: require('http').STATUS_CODES[404] },
            });

        })
        this.http.use((err, _, res, __) => {
            console.log(err)
            
			res.status(err.status || 500).json({
				error: { status: err.status || 500, message: err.message || require('http').STATUS_CODES[err.status || 500] },
			});
        });
        
        this.http.listen(config.port)
        console.log(`Started the api server on ::${config.port}`)
    }

    decodeTracks(req,res,next) {
        let q = JSON.parse(req.rawBody)
        if(!q|| !q.length || q.length < 1) return next({status:400,message: 'To decode the tracks, you need to have at least 1 track.'}) 
        this.rpc.decodeTracks(q).then((e) => {
            res.contentType('json').send(e)
        })
        .catch((error) => {
            next(error)
        })
    }
    loadTracks(req,res,next) {
        console.log(req.query)
        this.rpc.loadTracks(req.query.identifier).then((e) => {
            res.contentType('json').send(e)
        })
        .catch((error) => {
            next(error)
        })
    }
    decodetrack(req,res,next) {
        // Need to be implemented
    }

}
import express, { Router } from 'express'
import morgan from 'morgan'


export default class RestServer {
    express: express.Express
    constructor() {
        
        this.express = express()

        this.express
            .use((req, res, next) => {
                res
                .header('X-Provider', 'UniX Technology Corporation / Matthieu © 2019')
                .header('X-Runtime', 'NodeJs LavaPod Rest')
              next()
            })
            .use(morgan)
            .use(express.raw({ type: () => true, verify: (req,res,buf, encoding) => (buf && buf.length) ? Object.assign(req, { raw: buf.toString(encoding || 'utf8') } ) : null }))
            .use()

        
    }
}
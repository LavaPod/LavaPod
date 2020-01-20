var express = require('express')

const expr = express()

expr.get(['/players/:id'], (req,res,next) => {
    res.json({
        playerId: 1
    })
})
expr.listen(2000)
var bodyParser = require('body-parser')
var express = require('express')
var fs = require('fs')

var server = express()
var settings = {}
var ttlTimeout
var instance
var instanceTokenCount = 0

server.use(bodyParser.json())
 
server.get('/config', function (req, res){
  res.status(200).json(settings)
})

server.post('/token', function (req, res) {
  if ((req.body.clientId === settings.clientId) && (req.body.secret === settings.secret)) {
    res.status(200).json({
      accessToken: settings.tokens[instanceTokenCount],
      tokenType: 'Bearer',
      expiresIn: settings.expiresIn
    })

    instanceTokenCount++
  } else {
    res.status(401).json()
  }
})

server.get('/headers', function (req, res) {
  res.status(200).json(req.headers)
})

module.exports = server

module.exports.reset = function () {
  instanceTokenCount = 0

  clearTimeout(ttlTimeout)

  ttlTimeout = setTimeout(function () {
    instanceTokenCount++

    settings.accessToken = settings.tokens[instanceTokenCount]
  }, settings.expiresIn * 1000)
}

module.exports.start = function (newSettings) {
  settings = newSettings

  instance = server.listen(settings.port)
}

module.exports.stop = function () {
  instance.close()
}

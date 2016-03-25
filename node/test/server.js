var bodyParser = require('body-parser');
var express = require('express');
var fs = require('fs');

var server = express();
var settings = {};
var ttlTimeout;

server.use(bodyParser.json());
 
server.get('/config', function (req, res){
  res.status(200).json(settings);
});

server.post('/token', function (req, res) {
  if ((req.body.clientId === settings.clientId) && (req.body.secret === settings.secret)) {
    res.status(200).json({
      accessToken: settings.accessToken,
      tokenType: 'Bearer',
      expiresIn: settings.expiresIn
    });
  } else {
    res.status(401).json();
  }
});

server.get('/headers', function (req, res) {
  res.status(200).json(req.headers);
});

module.exports = server;
module.exports.useSettings = function (newSettings) {
  settings = newSettings;

  clearTimeout(ttlTimeout);

  ttlTimeout = setTimeout(function () {
    settings.accessToken = settings.nextAccessToken;
  }, settings.expiresIn * 1000);
};

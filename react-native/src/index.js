'use strict';

var React = require('react-native');
var {
  AsyncStorage
} = React;

var Passport = function (options, requestAgent) {
  this.storageKey = options.storageKey || (options.issuer.uri + JSON.stringify(options.credentials));
  this.requestAgent = requestAgent;

  var uri = options.issuer.uri;

  if (options.issuer.hasOwnProperty('port')) {
    uri += ':' + options.issuer.port;
  }

  if (options.issuer.hasOwnProperty('endpoint')) {
    uri += options.issuer.endpoint;
  } else {
    uri += '/token';
  }

  this.uri = uri;
  this.credentials = options.credentials;
};

Passport.prototype.requestNewToken = async function () {
  return fetch(this.uri, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(this.credentials)
  })
  .then((response) => response.json())
  .then((parsedResponse) => {
    try {
      var payload = JSON.stringify({
        accessToken: parsedResponse.accessToken,
        expirationDate: Math.floor(Date.now() / 1000) + parsedResponse.expiresIn
      });

      AsyncStorage.setItem(this.storageKey, payload);
    } catch (e) {
      console.log('[dadi-passport] Error writing token to storage:');
      console.log(e);
    }

    return parsedResponse.accessToken;
  });
};

Passport.prototype.return = function (token) {
  var payload = token;

  if (this.requestAgent) {
    var requestAgent = this.requestAgent;

    payload = function () {
      var fetchOptions = arguments[1];

      if (fetchOptions) {
        if (fetchOptions.hasOwnProperty('headers')) {
          fetchOptions.headers['Authorization'] = 'Bearer ' + token;
        } else {
          fetchOptions.headers = {
            'Authorization': 'Bearer ' + token
          };
        }
      } else {
        fetchOptions = {
          headers: {
            'Authorization': 'Bearer ' + token
          },
          method: 'GET'
        };
      }

      arguments[1] = fetchOptions;

      return requestAgent.apply(this, arguments);
    };
  }

  return Promise.resolve(payload);
};

Passport.prototype.get = async function () {
  try {
    var storedToken = await AsyncStorage.getItem(this.storageKey);
    var currentDate = Math.floor(Date.now() / 1000);

    if (storedToken !== null) {
      var parsedContent = JSON.parse(storedToken);

      if (parsedContent.expirationDate > currentDate) {
        return this.return(parsedContent.accessToken);
      } else {
        return this.return(this.requestNewToken());
      }
    } else {
      return this.return(this.requestNewToken());
    }
  } catch (e) {
    return this.return(this.requestNewToken());
  }
};

module.exports = (async function (options, requestAgent) {
  var passport = new Passport(options, requestAgent);

  return passport.get();
});

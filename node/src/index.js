var request = require('request-promise');

module.exports = (function (data, requestAgent) {
  var Passport = function (data, requestAgent) {
    this.data = data;
    this.requestAgent = requestAgent;

    if (typeof data.wallet === 'function') {
      this.walletModule = data.wallet;
    } else if ((typeof data.wallet === 'string') && (data.wallet !== 'none')) {
      this.walletModule = require(__dirname + '/wallets/' + data.wallet);
    }
  };

  Passport.prototype.requestToken = function () {
    var uri = this.data.issuer.uri;

    if (this.data.issuer.port) {
      uri += ':' + this.data.issuer.port;
    }

    if (this.data.issuer.endpoint) {
      uri += this.data.issuer.endpoint;
    } else {
      uri += '/token';
    }

    return request({
      json: true,
      method: 'POST',
      uri: uri,
      body: this.data.credentials
    }).then((function (response) {
      if (this.wallet) {
        this.wallet.write(response);
      }

      return Promise.resolve(this.return(response.accessToken));
    }).bind(this)).catch((function (errorData) {
      return Promise.reject(this.createErrorObject(errorData));
    }).bind(this));
  };

  Passport.prototype.return = function (token) {
    if (typeof this.requestAgent === 'function') {
      return (function () {
        var requestOptions = {};

        if (typeof arguments[0] === 'string') {
          // The first pararameter is a URL string
          requestOptions.uri = arguments[0];
          requestOptions.url = arguments[0];
          requestOptions.headers = {
            'Authorization': 'Bearer ' + token
          }
        } else {
          requestOptions = arguments[0];

          // The first argument is an options object
          if ('headers' in requestOptions) {
            requestOptions.headers['Authorization'] = 'Bearer ' + token;
          } else {
            requestOptions.headers = {
              'Authorization': 'Bearer ' + token
            }
          }
        }

        arguments[0] = requestOptions;

        return this.requestAgent.apply(this, arguments);
      }).bind(this);
    } else {
      return token;
    }
  };

  Passport.prototype.get = function () {
    if (!this.walletModule) {
      return this.requestToken();
    }

    var Wallet = this.walletModule;
    this.wallet = new Wallet(this.data.walletOptions);

    try {
      var token = this.wallet.read();
      var currentDate = Math.floor(Date.now() / 1000);

      if (token.expirationDate > currentDate) {
        return Promise.resolve(this.return(token.accessToken));
      } else {
        return this.requestToken();
      }
    } catch (e) {
      return this.requestToken();
    }
  };

  Passport.prototype.createErrorObject = function (errorData) {
    var error = {};

    if (errorData.statusCode === 401) {
      error.status = 'Unauthorized';
      error.title = 'Credentials not found or invalid';
      error.detail = 'The authorization process failed for the clientId/secret pair provided';
      error.code = 401;
    } else {
      error.status = 'Not found';
      error.title = 'URL not found';
      error.detail = 'The request for URL \'' + errorData.options.uri + '\' returned a 404.';
      error.code = 404;
    }

    return error;
  };

  var passport = new Passport(data, requestAgent);

  return passport.get();
});

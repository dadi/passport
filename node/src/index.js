'use strict'

const http2 = require('http2')
const request = require('request-promise')

let instance

const Passport = function (data, requestAgent) {
  this.data = data
  this.requestAgent = requestAgent

  if (typeof data.wallet === 'function') {
    this.walletModule = data.wallet
  } else if ((typeof data.wallet === 'string') && (data.wallet !== 'none')) {
    this.walletModule = require(__dirname + '/wallets/' + data.wallet)
  }
}

Passport.prototype.fetchTokenHTTP1 = function () {
  let uri = this.data.issuer.uri

  if (this.data.issuer.port) {
    uri += ':' + this.data.issuer.port
  }

  if (this.data.issuer.endpoint) {
    uri += this.data.issuer.endpoint
  } else {
    uri += '/token'
  }

  return request({
    json: true,
    method: 'POST',
    uri: uri,
    body: this.data.credentials
  })
}

Passport.prototype.fetchTokenHTTP2 = function (uri) {
  const payload = JSON.stringify(this.data.credentials)
  const host = (this.data.issuer.uri.indexOf('https://') === 0) ? this.data.issuer.uri.substring(8) : this.data.issuer.uri

  const options = {
    host: host,
    port: this.data.issuer.port || 443,
    path: this.data.issuer.endpoint || '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    }
  }

  if (this.data.ca) {
    options.ca = this.data.ca
  }

  return new Promise((resolve, reject) => {
    let response = ''
    let req = http2.request(options, function (res) {
      res.on('data', function (chunk) {
        response += chunk.toString()
      })

      res.on('end', function () {
        try {
          const parsedResponse = JSON.parse(response)

          resolve(parsedResponse)
        } catch (err) {
          reject(err)
        }
      })
    })

    req.write(payload)
    req.end()
  })
}

Passport.prototype.requestToken = function () {
  const fetchMethod = this.data.http2 ? this.fetchTokenHTTP2.bind(this) : this.fetchTokenHTTP1.bind(this)

  return fetchMethod().then(response => {
    let queue = []

    if (this.wallet) {
      queue.push(this.wallet.write(response))
    }

    return Promise.all(queue).then(() => this.return(response.accessToken))
  }).catch(errorData => {
    return Promise.reject(this.createErrorObject(errorData))
  })
}

Passport.prototype.return = function (token) {
  if (typeof this.requestAgent === 'function') {
    return (function () {
      let requestOptions = {}

      if (typeof arguments[0] === 'string') {
        // The first pararameter is a URL string
        requestOptions.uri = arguments[0]
        requestOptions.url = arguments[0]
        requestOptions.headers = {
          'Authorization': 'Bearer ' + token
        }
      } else {
        requestOptions = arguments[0]

        // The first argument is an options object
        if ('headers' in requestOptions) {
          requestOptions.headers['Authorization'] = 'Bearer ' + token
        } else {
          requestOptions.headers = {
            'Authorization': 'Bearer ' + token
          }
        }
      }

      arguments[0] = requestOptions

      return this.requestAgent.apply(this, arguments)
    }).bind(this)
  } else {
    return token
  }
}

Passport.prototype.get = function (refresh) {
  if (!this.walletModule) {
    return this.requestToken()
  }

  const Wallet = this.walletModule
  this.wallet = new Wallet(this.data.walletOptions)

  if (refresh) {
    return this.requestToken()
  }

  const currentDate = Math.floor(Date.now() / 1000)

  return this.wallet.read().then(token => {
    if (!token) return this.requestToken()

    if (token.expirationDate > currentDate) {
      return this.return(token.accessToken)
    } else {
      return this.requestToken()
    }
  })
}

Passport.prototype.createErrorObject = function (errorData) {
  let error = {}

  if (errorData.statusCode === 401) {
    error.status = 'Unauthorized'
    error.title = 'Credentials not found or invalid'
    error.detail = 'The authorization process failed for the clientId/secret pair provided'
    error.code = 401
  } else {
    error.status = 'Not found'
    error.title = 'URL not found'
    error.detail = 'The request for URL \'' + errorData.options.uri + '\' returned a 404.'
    error.code = 404
  }

  return error
}

module.exports = ((data, requestAgent) => {
  const passport = new Passport(data, requestAgent)

  instance = passport

  return passport.get(data.forceTokenRefresh === true)
})

module.exports.refreshToken = () => {
  if (typeof instance === 'undefined') {
    throw 'Passport was not initialised'
  }

  return instance.get(true)
}

'use strict'

const fs = require('fs')
const should = require('should')
const sinon = require('sinon')

const Passport = require(__dirname + '/../src')
const server = require('./server')

// --------------------------------------------------------------
// Configuration
// --------------------------------------------------------------

const tokenWalletPath = __dirname + '/token.json'
const settings = {
  expiresIn: 5,
  clientId: 'johndoe',
  port: 3030,
  secret: 'f00b4r',
  tokens: [
    '1111-2222-3333',
    '2222-3333-4444'
  ]
}

// --------------------------------------------------------------
// Helpers
// --------------------------------------------------------------

function deleteWallet() {
  try {
    fs.unlinkSync(tokenWalletPath)
  } catch (e) {}
}

// --------------------------------------------------------------
// Tests
// --------------------------------------------------------------

describe('DADI Passport', function (done) {
  before(function (done) {
    server.start(settings)

    done()
  })

  beforeEach(function (done) {
    deleteWallet()

    server.reset()

    done()
  })

  after(function (done) {
    server.stop()

    done()
  })

  describe('Generating tokens', function (done) {
    it('should return a valid bearer token when using valid credentials', function (done) {
      Passport({
        issuer: {
          uri: 'http://localhost',
          port: settings.port,
          endpoint: '/token'
        },
        credentials: {
          clientId: settings.clientId,
          secret: settings.secret
        },
        wallet: 'file',
        walletOptions: {
          path: tokenWalletPath
        }
      }).then(function (bearerToken) {
        bearerToken.should.equal(settings.tokens[0])

        done()
      })
    })

    it('should return an error object when using invalid credentials', function (done) {
      Passport({
        issuer: {
          uri: 'http://localhost',
          port: settings.port,
          endpoint: '/token'
        },
        credentials: {
          clientId: 'wrongClient',
          secret: 'badSecret'
        },
        wallet: 'file',
        walletOptions: {
          path: tokenWalletPath
        }
      }).catch(function (err) {
        err.status.should.equal('Unauthorized')
        err.title.should.equal('Credentials not found or invalid')
        err.code.should.equal(401)

        done()
      })
    })

    it('should return an error object when requesting from an invalid issuer', function (done) {
      Passport({
        issuer: {
          uri: 'http://lolcathost',
          port: settings.port,
          endpoint: '/token'
        },
        credentials: {
          clientId: 'someClient',
          secret: 'someSecret'
        },
        wallet: 'file',
        walletOptions: {
          path: tokenWalletPath
        }
      }).catch(function (err) {
        err.status.should.equal('Not found')
        err.title.should.equal('URL not found')
        err.code.should.equal(404)

        done()
      })
    })

    it('should return the stored bearer token if it is still valid', function (done) {
      this.timeout(5000)

      const mockPayload = {
        accessToken: '9999-8888-7777-6666',
        expirationDate: Date.now() + 1
      }

      sinon.stub(fs, 'readFile').yields(null, JSON.stringify(mockPayload))

      setTimeout(function () {
        Passport({
          issuer: {
            uri: 'http://localhost',
            port: settings.port,
            endpoint: '/token'
          },
          credentials: {
            clientId: settings.clientId,
            secret: settings.secret
          },
          wallet: 'file',
          walletOptions: {
            path: tokenWalletPath
          }
        }).then(function (bearerToken) {
          bearerToken.should.equal(mockPayload.accessToken)

          fs.readFile.restore()

          done()
        })
      }, 2000)
    })

    it('should return a refreshed bearer token if the stored one has expired', function (done) {
      this.timeout(5000)

      const mockPayload = {
        accessToken: '9999-8888-7777-6666',
        expirationDate: Math.floor(Date.now() / 1000) - 1
      }

      sinon.stub(fs, 'readFile').yields(null, JSON.stringify(mockPayload))

      setTimeout(function () {
        Passport({
          issuer: {
            uri: 'http://localhost',
            port: settings.port,
            endpoint: '/token'
          },
          credentials: {
            clientId: settings.clientId,
            secret: settings.secret
          },
          wallet: 'file',
          walletOptions: {
            path: tokenWalletPath
          }
        }).then(function (bearerToken) {
          bearerToken.should.equal(settings.tokens[0])

          fs.readFile.restore()

          done()
        })
      }, 2000)
    })

    it('should return a refreshed bearer token if the `forceTokenRefresh` property is set', function (done) {
      this.timeout(9000)

      const mockPayload = {
        accessToken: '9999-8888-7777-6666',
        expirationDate: Date.now() + 1
      }

      sinon.stub(fs, 'readFile').yields(null, JSON.stringify(mockPayload))

      setTimeout(function () {
        Passport({
          forceTokenRefresh: true,
          issuer: {
            uri: 'http://localhost',
            port: settings.port,
            endpoint: '/token'
          },
          credentials: {
            clientId: settings.clientId,
            secret: settings.secret
          },
          wallet: 'file',
          walletOptions: {
            path: tokenWalletPath
          }
        }).then(function (bearerToken) {
          bearerToken.should.equal(settings.tokens[0])

          fs.readFile.restore()

          done()
        })
      }, 2000)
    })
  })

  describe('Token wallets', function (done) {
    it('should store a newly requested token in a wallet file', function (done) {
      const now = Math.floor(Date.now() / 1000)

      Passport({
        issuer: {
          uri: 'http://localhost',
          port: settings.port,
          endpoint: '/token'
        },
        credentials: {
          clientId: settings.clientId,
          secret: settings.secret
        },
        wallet: 'file',
        walletOptions: {
          path: tokenWalletPath
        }
      }).then(function (bearerToken) {
        setTimeout(function() {
          var walletContents = JSON.parse(fs.readFileSync(tokenWalletPath, 'utf8'))

          walletContents.accessToken.should.equal(bearerToken)
          walletContents.expirationDate.should.equal(now + settings.expiresIn)

          done()

        }, 1000)
      })
    })
  })

  describe('Request injection', function (done) {
    it('should inject valid authorisation headers in a request agent', function (done) {
      const request = require('request')

      Passport({
        issuer: {
          uri: 'http://localhost',
          port: settings.port,
          endpoint: '/token'
        },
        credentials: {
          clientId: settings.clientId,
          secret: settings.secret
        },
        wallet: 'file',
        walletOptions: {
          path: tokenWalletPath
        }
      }, request).then(function (request) {
        request('http://localhost:' + settings.port + '/headers', function (err, res, body) {
          const parsedBody = JSON.parse(body)

          parsedBody.authorization.should.equal('Bearer ' + settings.tokens[0])

          done()
        })
      })
    })
  })
})

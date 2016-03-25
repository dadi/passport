var fs = require('fs');
var should = require('should');

var Passport = require(__dirname + '/../src');
var server = require('./server');
var serverInstance;

// --------------------------------------------------------------
// Configuration
// --------------------------------------------------------------

var serverPort = 3030;
var tokenWalletPath = __dirname + '/token.json';

// --------------------------------------------------------------
// Helpers
// --------------------------------------------------------------

function startServer() {
  serverInstance = server.listen(serverPort);
}

function stopServer() {
  serverInstance.close();
}

function deleteWallet() {
  try {
    fs.unlinkSync(tokenWalletPath);
  } catch (e) {}
}

// --------------------------------------------------------------
// Tests
// --------------------------------------------------------------

describe('Generating tokens', function (done) {

  before(function (done) {
    startServer();

    deleteWallet();

    done();
  });

  afterEach(function (done) {
    deleteWallet();

    done();
  });

  after(function (done) {
    stopServer();

    done();
  });

  it('should return a valid bearer token when using valid credentials', function (done) {
    var settings = {
      accessToken: '1111-2222-3333',
      expiresIn: 5,
      clientId: 'johndoe',
      secret: 'f00b4r'
    };

    server.useSettings(settings);

    Passport({
      issuer: {
        uri: 'http://localhost',
        port: serverPort,
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
      bearerToken.should.equal(settings.accessToken);

      done();
    });
  });

  it('should return an error object when using invalid credentials', function (done) {
    var settings = {
      accessToken: '1111-2222-3333',
      expiresIn: 5,
      clientId: 'johndoe',
      secret: 'f00b4r'
    };

    server.useSettings(settings);

    Passport({
      issuer: {
        uri: 'http://localhost',
        port: serverPort,
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
      err.status.should.equal('Unauthorized');
      err.title.should.equal('Credentials not found or invalid');
      err.code.should.equal(401);

      done();
    });
  });

  it('should return an error object when requesting from an invalid issuer', function (done) {
    Passport({
      issuer: {
        uri: 'http://lolcathost',
        port: serverPort,
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
      err.status.should.equal('Not found');
      err.title.should.equal('URL not found');
      err.code.should.equal(404);

      done();
    });
  });

  it('should return the stored bearer token if it is still valid', function (done) {
    this.timeout(5000);

    var settings = {
      accessToken: '1111-2222-3333',
      expiresIn: 5,
      clientId: 'johndoe',
      secret: 'f00b4r'
    };

    server.useSettings(settings);

    setTimeout(function () {
      Passport({
        issuer: {
          uri: 'http://localhost',
          port: serverPort,
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
        bearerToken.should.equal(settings.accessToken);

        done();
      });
    }, 2000);
  });

  it('should return a refreshed bearer token if the stored one has expired', function (done) {
    this.timeout(9000);

    var settings = {
      accessToken: '1111-2222-3333',
      nextAccessToken: '2222-3333-4444',
      expiresIn: 5,
      clientId: 'johndoe',
      secret: 'f00b4r'
    };

    server.useSettings(settings);

    setTimeout(function () {
      Passport({
        issuer: {
          uri: 'http://localhost',
          port: serverPort,
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
        bearerToken.should.equal(settings.nextAccessToken);

        done();
      });
    }, 6000);
  });
});

describe('Token wallets', function (done) {

  before(function (done) {
    startServer();

    deleteWallet();

    done();
  });

  afterEach(function (done) {
    deleteWallet();

    done();
  });

  after(function (done) {
    stopServer();

    done();
  });

  it('should store a newly requested token in a wallet file', function (done) {
    var now = Math.floor(Date.now() / 1000);
    var settings = {
      accessToken: '1111-2222-3333',
      expiresIn: 5,
      clientId: 'johndoe',
      secret: 'f00b4r'
    };

    server.useSettings(settings);

    Passport({
      issuer: {
        uri: 'http://localhost',
        port: serverPort,
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
      var walletContents = JSON.parse(fs.readFileSync(tokenWalletPath, 'utf8'));

      walletContents.accessToken.should.equal(bearerToken);
      walletContents.expirationDate.should.equal(now + settings.expiresIn);

      done();
    });
  });
});

describe('Request injection', function (done) {

  before(function (done) {
    startServer();

    deleteWallet();

    done();
  });

  afterEach(function (done) {
    deleteWallet();

    done();
  });

  after(function (done) {
    stopServer();

    done();
  });

  it('should inject valid authorisation headers in a request agent', function (done) {
    var settings = {
      accessToken: '1111-2222-3333',
      expiresIn: 5,
      clientId: 'johndoe',
      secret: 'f00b4r'
    };

    server.useSettings(settings);

    var request = require('request');

    Passport({
      issuer: {
        uri: 'http://localhost',
        port: serverPort,
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
      request('http://localhost:' + serverPort + '/headers', function (err, res, body) {
        var parsedBody = JSON.parse(body);

        parsedBody.authorization.should.equal('Bearer ' + settings.accessToken);

        done();
      });
    });
  });
});

# DADI Passport

> A promise-based library for generating access tokens to authenticate with DADI platform components.

## Introduction

The various components of the API-first development stack DADI implement a form of 2-legged oAuth2, requiring a bearer token to authorise requests. This bearer token is obtained as a response sent to a specific endpoint with a client id/secret pair, along with a TTL defined by the provider.

This library can be used by third-party applications that wish to integrate with the DADI platform, as it abstracts the oAuth protocol by storing and requesting bearer tokens as needed, and returning always a promise with a valid bearer token.

## Token wallets

On every call, the library will determine whether a new bearer token is required or if there is one in storage that is still valid. To do this, it needs a method of persisting information about a token and its lifespan — a token wallet.

The library ships with a flat file token wallet, but it can be extended to use any type of storage, such as Redis or MongoDB. A wallet simply needs to implement the methods `read()` and `write()`, to access the last token saved and to store a new one, respectively.

If no token wallet is specified, a new bearer token will be requested on every call, which is highly discouraged and should only be used for development and testing purposes.

## Usage examples

*Single client/secret pair using a flat file wallet:*
```js
var passport = require('dadi-passport')({
	uri: 'http://my-api.dadi.tech',
	credentials: {
		clientId: 'johndoe',
		secret: 'f00b4r'		
	},
	wallet: require('./wallets/file'),
	walletOptions: {
		path: './token.txt'
	}
});

passport.then(function (bearerToken) {
    // Authorised request goes here...
});
```

*Multiple client/secret pairs and different wallets:*

```js
var passport = require('dadi-passport');

var componentOne = {
    uri: 'http://my-component1.dadi.tech',
    credentials: {
        clientId: 'johndoe',
        secret: 'f00b4r'
    },
    wallet: require('./wallets/mongodb'),
    walletOptions: {
        host: 'localhost',
        port: 27017,
        username: 'johndoe',
        password: 'f00b4r',
        database: 'tokens'
    }
};

var componentTwo = {
    uri: 'http://my-component2.dadi.tech',
    credentials: {
        clientId: 'janedoe',
        secret: 'f00b4z'
    },
    wallet: require('./wallets/file'),
    walletOptions: {
        path: './token'
    }
};

passport(componentOne).then(function (bearerToken) {
    // Request for component 1 goes here...
});

passport(componentTwo).then(function (bearerToken) {
    // Request for component 2 goes here...
});
```

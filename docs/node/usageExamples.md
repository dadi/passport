# DADI Passport

## Node.js

### Usage examples

Passport will return different things based on the arity of its require call. If there is only one argument, the return value will be a Promise containing a string with a bearer token.

*Single client/secret pair using a flat file wallet:*

```js
var passport = require('@dadi/passport')({
	issuer: {
        uri: 'http://my-api.dadi.tech',
        port: 80, // Optional. Defaults to 80
        endpoint: '/token' // Optional. Defaults to '/token'
    },
	credentials: {
		clientId: 'johndoe',
		secret: 'f00b4r'		
	},
	wallet: 'file',
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
var passport = require('@dadi/passport');

var componentOne = {
    issuer: {
        uri: 'http://my-component1.dadi.tech',
        port: 80,
        endpoint: '/token'
    },
    credentials: {
        clientId: 'johndoe',
        secret: 'f00b4r'
    },
    wallet: 'mongodb', // Illustrative purposes
    walletOptions: {
        host: 'localhost',
        port: 27017,
        username: 'johndoe',
        password: 'f00b4r',
        database: 'tokens'
    }
};

var componentTwo = {
    issuer: {
        uri: 'http://my-component2.dadi.tech',
        port: 80,
        endpoint: '/token'
    },
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

If a function is passed as a second argument, Passport will interpret it as a module capable of performing a request (such as [request](https://www.npmjs.com/package/request) or [request-promise](https://www.npmjs.com/package/request)) and will inject the bearer token in the authorisation header, returning a Promise containing the patched request agent.

*Using request injection option:*

```js
var request = require('request-promise');
var passport = require('@dadi/passport')({
    issuer: {
        uri: 'http://my-api.dadi.tech',
        port: 80,
        endpoint: '/token'
    },
    credentials: {
        clientId: 'johndoe',
        secret: 'f00b4r'
    },
    wallet: 'file',
    walletOptions: {
        path: './token.txt'
    }
}, request); // <--- passing the request module as 2nd argument

// The Promise now returns a request object with the authorisation headers injected,
// instead of the bearer token
passport.then(function (request) {
    request('http://my-api.dadi.tech/v1/some/endpoint').then(function (response) {
        // Do something
    });
});
```

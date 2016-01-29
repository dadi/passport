# DADI Passport

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

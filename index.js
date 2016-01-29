var request = require('request-promise');

module.exports = (function (data) {
	if (!data.wallet || (data.wallet === 'none')) {
		return requestNewToken();
	}

	var Wallet = data.wallet;
	var wallet = new Wallet(data.walletOptions);

	var requestNewToken = function () {
		return request({
			json: true,
			method: 'POST',
			uri: data.uri + '/token',
			body: data.credentials
		}).then(function (response) {
			wallet.write(response);

			return Promise.resolve(response.accessToken);
		});
	};

	try {
		var token = wallet.read();
		var currentDate = Math.floor(Date.now() / 1000);

		if (token.expirationDate > currentDate) {
			return Promise.resolve(token.accessToken);
		} else {
			return requestNewToken();
		}
	} catch (e) {
		return requestNewToken();
	}
});
<?php

namespace dadi;

class Passport {
	/**
	 * Validates the options array against required fields
	 * 
	 * @return Boolean True if validation passes
	 */
	private static function validateOptions($options) {
		if (!isset($options['issuer']['uri'])) {
			throw new \Exception('Issuer uri is missing');
		}

		if (!isset($options['credentials']['clientId'])) {
			throw new \Exception('Client ID is missing');
		}

		if (!isset($options['credentials']['secret'])) {
			throw new \Exception('Secret is missing');
		}

		return true;
	}

	/**
	 * Injects default options that are missing into the options
	 * array
	 * 
	 * @return Array Options array
	 */
	private static function injectDefaultOptions($options) {
		if (!isset($options['issuer']['port'])) {
			$options['issuer']['port'] = 80;
		}

		if (!isset($options['issuer']['endpoint'])) {
			$options['issuer']['endpoint'] = '/token';
		}

		return $options;		
	}

	/**
	 * Creates an instance of the wallet contained in the options
	 * array, passing to it the contents of `walletOptions`
	 * 
	 * @return Object Wallet instance
	 */
	private static function getWallet($options) {
		if (isset($options['wallet']) && class_exists($options['wallet'])) {
			return new $options['wallet']($options['walletOptions']);
		}
	}

	/**
	 * Creates a fresh instance of a request agent with the bearer
	 * token in the headers
	 * 
	 * (Currently only cURL is supported)
	 * 
	 * @return Object Request agent
	 */
	private static function getRequestAgent($agent, $bearer) {
		switch ($agent) {
			case 'curl':
				$ch = curl_init();

				curl_setopt($ch, CURLOPT_HTTPHEADER, array(
					'Authorization: Bearer ' . $bearer
				));

				return $ch;
		}
	}

	/**
	 * Requests a new bearer token from the issuer
	 * 
	 * @return String Bearer token
	 */
	private static function requestToken($issuer, $credentials, $wallet) {
		$uri = $issuer['uri'] . ':' . $issuer['port'] . $issuer['endpoint'];

		$request = curl_init(); 

		curl_setopt($request, CURLOPT_URL, $uri); 
		curl_setopt($request, CURLOPT_RETURNTRANSFER, 1); 

		$credentials = json_encode(array(
			'clientId' => $credentials['clientId'],
			'secret' => $credentials['secret']
		));

		curl_setopt($request, CURLOPT_CUSTOMREQUEST, 'POST');
		curl_setopt($request, CURLOPT_POSTFIELDS, $credentials);
		curl_setopt($request, CURLOPT_HTTPHEADER, array(                                                                          
		    'Content-Type: application/json',                                                                                
		    'Content-Length: ' . strlen($credentials))                                                                       
		);

		$response = json_decode(curl_exec($request));

		if ($wallet) {
			$wallet->write($response);	
		}

		curl_close($request);

		return $response->accessToken;
	}

	/**
	 * Returns a valid bearer token
	 * 
	 * @return String Bearer token
	 */
	public static function get($options, $requestAgent = null) {
		// Validating options object
		self::validateOptions($options);

		// Setting defaults
		$options = self::injectDefaultOptions($options);

		// Getting wallet
		$wallet = self::getWallet($options);

		$walletContents = $wallet ? $wallet->read() : null;

		if (($walletContents) && ($walletContents->expirationDate > time())) {
			return $walletContents->accessToken;
		}

		$bearerToken = self::requestToken($options['issuer'], $options['credentials'], $wallet);

		if ($requestAgent) {
			return self::getRequestAgent($requestAgent, $bearerToken);
		}

		return $bearerToken;
	}
}

?>

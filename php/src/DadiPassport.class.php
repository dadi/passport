<?php

class DadiPassport {
	function __construct($uri, $clientId, $secret, $wallet) {
		$this->uri = $uri;
		$this->clientId = $clientId;
		$this->secret = $secret;
		$this->wallet = $wallet;
	}

	/**
	 * Requests a new bearer token from the issuer
	 * 
	 * @return String Bearer token
	 */
	private function requestToken() {
		$request = curl_init(); 

		curl_setopt($request, CURLOPT_URL, $this->uri . '/token'); 
		curl_setopt($request, CURLOPT_RETURNTRANSFER, 1); 

		$credentials = json_encode(array(
			'clientId' => $this->clientId,
			'secret' => $this->secret
		));

		curl_setopt($request, CURLOPT_CUSTOMREQUEST, 'POST');
		curl_setopt($request, CURLOPT_POSTFIELDS, $credentials);
		curl_setopt($request, CURLOPT_HTTPHEADER, array(                                                                          
		    'Content-Type: application/json',                                                                                
		    'Content-Length: ' . strlen($credentials))                                                                       
		);

		$response = json_decode(curl_exec($request));

		$this->wallet->write($response);

		curl_close($request);

		return $response->accessToken;
	}

	/**
	 * Returns a valid bearer token
	 * 
	 * @return String Bearer token
	 */
	public function getToken() {
		$walletContents = $this->wallet->read();

		if (($walletContents) && ($walletContents->expirationDate > time())) {
			return $walletContents->accessToken;
		}

		return $this->requestToken();
	}
}

?>

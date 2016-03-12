<?php

require dirname(__FILE__) . '/../../vendor/autoload.php';
require_once dirname(__FILE__) . '/../src/DadiPassport.class.php';
require_once dirname(__FILE__) . '/../src/DadiPassportFileWallet.class.php';

class PassportTest extends PHPUnit_Framework_TestCase {
	private static $testServerHost = 'http://localhost';
	private static $testServerPort = 1349;
	private static $tokenFile = '/token.txt';

	private static function useConfig($config) {
		$request = curl_init();

		$payload = json_encode($config);

		curl_setopt($request, CURLOPT_URL, self::$testServerHost . ':' . self::$testServerPort . '/config'); 
		curl_setopt($request, CURLOPT_RETURNTRANSFER, 1); 
		curl_setopt($request, CURLOPT_CUSTOMREQUEST, 'POST');
		curl_setopt($request, CURLOPT_POSTFIELDS, $payload);
		curl_setopt($request, CURLOPT_HTTPHEADER, array(                                                                          
		    'Content-Type: application/json',                                                                                
		    'Content-Length: ' . strlen($payload))                                                                       
		);

		$res = curl_exec($request);

		curl_close($request);
	}

	public static function setUpBeforeClass() {
		// Removing token file
		@unlink(dirname(__FILE__) . self::$tokenFile);
	}

	public function testRequestTokenWithIncorrectCredentials() {
		// Test server config
		self::useConfig(array(
			'credentials' => array(
				'clientId' => 'johndoe',
				'secret' => 'f00b4r'
			),
			'token' => '11111111-1111-1111-1111-1111111111',
			'TTL' => 5	
		));

		$options = array(
			'issuer' => array(
				'uri' => self::$testServerHost,
				'port' => self::$testServerPort,
				'endpoint' => '/token'
			),
			'credentials' => array(
				'clientId' => 'janedoe',
				'secret' => 'wrongSecret'
			),
			'wallet' => '\dadi\PassportFileWallet',
			'walletOptions' => array(
				'path' => dirname(__FILE__) . self::$tokenFile
			)
		);

		try {
			$token = \dadi\Passport::get($options);	
		} catch (Exception $e) {
			$this->assertEquals($e->getMessage(), 'Credentials are incorrect');

			return;
		}

		$this->assertTrue(false);
	}

	public function testRequestTokenWithCorrectCredentials() {
		// Test server config
		self::useConfig(array(
			'credentials' => array(
				'clientId' => 'johndoe',
				'secret' => 'f00b4r'
			),
			'token' => '11111111-1111-1111-1111-1111111111',
			'TTL' => 5	
		));

		$options = array(
			'issuer' => array(
				'uri' => self::$testServerHost,
				'port' => self::$testServerPort,
				'endpoint' => '/token'
			),
			'credentials' => array(
				'clientId' => 'johndoe',
				'secret' => 'f00b4r'
			),
			'wallet' => '\dadi\PassportFileWallet',
			'walletOptions' => array(
				'path' => dirname(__FILE__) . self::$tokenFile
			)
		);

		$token = \dadi\Passport::get($options);

		$this->assertEquals($token, '11111111-1111-1111-1111-1111111111');
	}

	public function testTokenWasWrittenToWallet() {
		$walletContents = json_decode(file_get_contents(dirname(__FILE__) . self::$tokenFile));

		$this->assertEquals($walletContents->accessToken, '11111111-1111-1111-1111-1111111111');
	}

	public function testSubsequentRequestReturnsSameToken() {
		// Test server config
		self::useConfig(array(
			'credentials' => array(
				'clientId' => 'johndoe',
				'secret' => 'f00b4r'
			),
			'token' => '22222222-2222-2222-2222-2222222222',
			'TTL' => 5	
		));

		$options = array(
			'issuer' => array(
				'uri' => self::$testServerHost,
				'port' => self::$testServerPort,
				'endpoint' => '/token'
			),
			'credentials' => array(
				'clientId' => 'johndoe',
				'secret' => 'f00b4r'
			),
			'wallet' => '\dadi\PassportFileWallet',
			'walletOptions' => array(
				'path' => dirname(__FILE__) . self::$tokenFile
			)
		);

		$token = \dadi\Passport::get($options);

		$this->assertEquals($token, '11111111-1111-1111-1111-1111111111');
	}

	public function testDelayedRequestReturnsDifferentToken() {
		$options = array(
			'issuer' => array(
				'uri' => self::$testServerHost,
				'port' => self::$testServerPort,
				'endpoint' => '/token'
			),
			'credentials' => array(
				'clientId' => 'johndoe',
				'secret' => 'f00b4r'
			),
			'wallet' => '\dadi\PassportFileWallet',
			'walletOptions' => array(
				'path' => dirname(__FILE__) . self::$tokenFile
			)
		);

		// Wait for 6 seconds so the bearer token expires
		sleep(6);

		$token = \dadi\Passport::get($options);

		$this->assertNotEquals(serialize($token), '22222222-2222-2222-2222-2222222222');
	}

	public static function tearDownAfterClass() {
		// Removing token file
		@unlink(dirname(__FILE__) . self::$tokenFile);
	}
}

?>
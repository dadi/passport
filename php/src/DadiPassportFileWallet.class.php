<?php

class DadiPassportFileWallet {
	function __construct($path) {
		$this->path = $path;
	}

	/**
	 * Reads contents from wallet file
	 * 
	 * @return stdClass
	 */
	public function read() {
		$file = @file_get_contents($this->path);

		if (!$file) {
			return false;
		}

		$parsedFile = json_decode($file);

		if (!$parsedFile) {
			return false;
		}

		return $parsedFile;
	}

	/**
	 * Writes contents to wallet file
	 * 
	 * @param srdClass $data 
	 * @return Mixed — Result of `file_get_contents()`
	 */
	public function write($data) {
		$payload = array(
			'accessToken' => $data->accessToken,
			'expirationDate' => time() + $data->expiresIn
		);

		return file_put_contents($this->path, json_encode($payload));
	}
}

?>

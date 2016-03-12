<?php

require '../../../vendor/autoload.php';

define('CONFIG', 'config.json');

function getConfig() {
	return json_decode(file_get_contents(CONFIG), true);
}

$app = new \Slim\App();

$app->post('/config', function ($req, $res, $args) {
	$body = $req->getParsedBody();
	
	file_put_contents(CONFIG, json_encode($body));

	return $res->withStatus(200)->write('');
});

$app->post('/token', function ($req, $res, $args) {
	$config = getConfig();

	$body = $req->getParsedBody();
	$credentialsAreValid = (isset($body['clientId']) && isset($body['secret'])) && 
							(($body['clientId'] === $config['credentials']['clientId']) && ($body['secret'] === $config['credentials']['secret']));

	if ($credentialsAreValid) {
		$payload = array(
			'accessToken' => $config['token'],
			'tokenType' => 'Bearer',
			'expiresIn' => $config['TTL']			
		);

		return $res->withStatus(200)->withHeader('Content-Type', 'application/json')->write(json_encode($payload));
	}

	return $res->withStatus(401)->write('');
});

$app->get('/time', function ($req, $res, $args) {
	return $res->write(time());
});

$app->run();

?>
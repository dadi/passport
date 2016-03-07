<?php

require_once 'DadiPassport.class.php';
require_once 'DadiPassportFileWallet.class.php';

// Use the default wallet and define the path to the flat file
$wallet = new DadiPassportFileWallet('token.txt');

// Create a new passport instante passing the access credentials and the wallet instance
$passport = new DadiPassport('http://my-api.dadi.technology', 'johndoe', 'f00b4r', $wallet);

// Output the bearer token
echo($passport->getToken());

?>
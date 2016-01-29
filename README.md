# DADI Passport

![Build Status](http://img.shields.io/badge/Release-0.1_Beta-green.svg?style=flat-square)&nbsp;![Coverage](https://img.shields.io/badge/Coverage-0%-yellow.svg?style=flat-square)

## Overview

DADI Passport is a promise-based library for generating access tokens to authenticate with DADI platform components.

Various components within the DADI stack implement 2-legged oAuth2, requiring a bearer token to authorise requests. This bearer token is obtained as a response sent to a specific endpoint with a clientId/secret pair, along with a TTL defined by the provider.

This library can be used by third-party applications that wish to integrate with DADI, as it abstracts the oAuth protocol by storing and requesting bearer tokens as needed, and returning always a promise with a valid bearer token.

## Contents

* Overview (this document)
* [Requirements](https://github.com/dadi/passport/blob/docs/docs/requirements.md)
* [Token wallets](https://github.com/dadi/passport/blob/docs/docs/tokenWallets.md)
* [Usage examples](https://github.com/dadi/passport/blob/docs/docs/usageExamples.md)
* [Development](https://github.com/dadi/passport/blob/docs/docs/development.md)
* [License](https://github.com/dadi/passport/blob/docs/docs/license.md)
* [GPL](https://github.com/dadi/passport/blob/docs/docs/gpl.md)

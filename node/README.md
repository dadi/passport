# DADI Passport

[![npm (scoped)](https://img.shields.io/npm/v/@dadi/passport.svg?maxAge=10800&style=flat-square)](https://www.npmjs.com/package/@dadi/passport)&nbsp;[![coverage](https://img.shields.io/badge/coverage-62%25-yellow.svg?style=flat-square)](https://github.com/dadi/passport)&nbsp;[![build](http://ci.dadi.technology/dadi/passport/badge?branch=master&service=shield)](http://ci.dadi.technology/dadi/passport)

## Overview

DADI Passport is a library for generating access tokens to authenticate with DADI platform components.

Various components within the DADI stack implement 2-legged oAuth2, requiring a bearer token to authorise requests. This bearer token is obtained as a response sent to a specific endpoint with a clientId/secret pair, along with a TTL defined by the provider.

This library can be used by third-party applications that wish to integrate with DADI, as it abstracts the oAuth protocol by storing and requesting bearer tokens as needed, and returning always a promise with a valid bearer token.

## Node.js

The Node.js implementation returns a Promise, either resolving with a valid bearer token to access the issuer or failing with a [JSON API](http://jsonapi.org/format/#errors) compliant error object.

By using the request injection option, it is also possible to receive a request function with the authorisation headers injected, abstracting all the authentication logic and making a call to a DADI component extremely straightforward.

Please see the `docs` branch for [usage examples](https://github.com/dadi/passport/blob/docs/docs/node/usageExamples.md).

## Documentation

Documentation is maintained under the `docs` branch.

## Licence

DADI is a data centric development and delivery stack, built specifically in support of the principles of API first and COPE.

Copyright notice<br />
(C) 2016 DADI+ Limited <support@dadi.tech><br />
All rights reserved

This product is part of DADI.<br />
DADI is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as
published by the Free Software Foundation; either version 2 of
the License, or (at your option) any later version ("the GPL").
**If you wish to use DADI outside the scope of the GPL, please
contact us at info@dadi.co for details of alternative licence
arrangements.**

**This product may be distributed alongside other components
available under different licences (which may not be GPL). See
those components themselves, or the documentation accompanying
them, to determine what licences are applicable.**

DADI is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

The GNU General Public License (GPL) is available at
http://www.gnu.org/copyleft/gpl.html.<br />
A copy can be found in the file GPL distributed with
these files.

This copyright notice MUST APPEAR in all copies of the product!

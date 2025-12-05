# Twing
[![NPM version][npm-image]][npm-url] [![Build Status][build-image]][build-url] [![Coverage percentage][coveralls-image]][coveralls-url] [![Donate][donate-image]][donate-url]

First-class JavaScript Twig compiler

## Prerequisites

Twing needs at least **node.js 16.0.0** to run.

## Installation

The recommended way to install Twing is via npm:

```shell
npm install twing --save
```

## Documentation

See [the Twing website](https://twing.nightlycommit.com) for documentation.

## Basic API Usage

```typescript
import {createEnvironment, createArrayLoader} from "twing";

const loader = createArrayLoader({
    'index.twig': 'Everybody loves {{ name }}!'
});

const environment = createEnvironment(loader);

environment.render('index.twig', {name: 'Twing'}).then((output) => {
    // output contains "Everybody loves Twing!"
});
```

## Script tag

Use [cdnjs](https://cdnjs.com/libraries/twing) to include Twing in your HTML document.

Once loaded by the browser, Twing is available under the global `Twing` variable.

## Related packages

* [gulp-twing](https://www.npmjs.com/package/gulp-twing): Compile Twig templates with gulp. Build upon Twing.
* [twing-loader](https://www.npmjs.com/package/twing-loader): Webpack loader that compiles Twig templates using Twing.

## License

Copyright © 2018 [Eric MORAND](https://github.com/ericmorand). Released under the [2-Clause BSD License](https://github.com/ericmorand/twing/blob/master/LICENSE).

[npm-image]: https://badge.fury.io/js/twing.svg
[npm-url]: https://npmjs.org/package/twing
[build-image]: https://gitlab.com/nightlycommit/twing/badges/main/pipeline.svg
[build-url]: https://gitlab.com/nightlycommit/twing/-/pipelines
[coveralls-image]: https://coveralls.io/repos/gitlab/nightlycommit/twing/badge.svg
[coveralls-url]: https://coveralls.io/gitlab/nightlycommit/twing
[donate-image]: https://img.shields.io/badge/Donate-PayPal-green.svg
[donate-url]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=7YZU3L2JL2KJA

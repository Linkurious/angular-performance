#Angular-performance - alpha

[![Codacy Badge](https://www.codacy.com/project/badge/1ae19e8ddd704a7bab46537588224099)](https://www.codacy.com/app/nikel092_2742/angular-performance)
[![Inline docs](http://inch-ci.org/github/Linkurious/angular-performance.svg?branch=master)](http://inch-ci.org/github/Linkurious/angular-performance)

[![Screenshot](screenshot.png)](screenshot.png)

This is a chrome extension aimed at monitoring angular application performance.

## Build

### Requirements
* Node
* Npm
* Chrome > v41

### Commands

To build the extension you have to run a few commands

```shell
$ npm install
$ npm run build
```

## Install

* Clone the repo
* Go into the Chrome main menu -> more tools -> extension 
* Enable developer mode
* Build the extension
* Load unpacked extension
* select the `extension` folder

## Features

### Implemented
* Events Capture
* Digest time monitoring
* Digest rate monitoring
* Digest times distribution
* Watcher count monitoring

### Roadmap
* FPS renderding monitoring
* Scopes inspection (respective value and digesting time)
* Public methods async and sync timing

## License
See [LICENSE](LICENSE) file.

## Credits
Many thanks to the contributors on these open source projects on which is inspired this extension
* [ng-stats](https://github.com/kentcdodds/ng-stats)
* [Angular Inspector](https://github.com/kkirsche/angularjs-inspector)
* [ng-Inspector](https://github.com/rev087/ng-inspector)


# FortiClient PoC SAML Azure AD

This repository contains a puppeteer script that can do an Azure AD login without an actual browser + some shell scripts to run the pupeteer script.

## Dependencies
- NodeJS 
- openforticlient 

``` 
brew install node openfortivpn
```

## How to use
- Rename ```.env.example``` to ```.env```
- Set the ```.env``` config
- Run ```npm install```
- Run ```sudo node index.js```

## Inspired from
- [openfortivpn-azure-ad-login-helper](https://github.com/zizzencs/openfortivpn-azure-ad-login-helper)
- and a lot of pain caused by the official FortiClient macOS
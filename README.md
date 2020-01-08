# OpenID Connect with third party-initiated login

## Install

```bash
$ git clone git@github.com:oddlyfunctional/oidc-3rd-party-initiated-login.git
$ cd oidc-3rd-party-initiated-login
$ npm install
$ npm install -g foreman
$ brew cask install ngrok
```

## Run

```bash
$ npm run spec-compliant
```

This will spawn both the RP and the idP, as well as an instance of ngrok in order to allow them to communicate using https.

## Usage

After successfully starting the application, click on the link printed on the
console to initiate the authentication process (since ngrok generates a new
random subdomain on every run, it's not possible to know it beforehand). It
will look something like this: "Initiate authentication with [some-url]".

Here's an example of output:

```bash
$ npm run spec-compliant

> openid@1.0.0 spec-compliant /Users/you-user/oidc-3rd-party-initiated-login
> cd ./spec-compliant && nf start

[OKAY] Loaded ENV .env File as KEY=VALUE Format
8:26:18 PM rp.1    |  Example app listening on port 3001! Initiate authentication with https://df387119.ngrok.io/initiate?iss=https%3A%2F%2F8de42e8c.ngrok.io&target_link_uri=https%3A%2F%2Fdf387119.ngrok.io%2Ftarget
8:26:18 PM idp.1   |  WARNING: configuration cookies.keys is missing, this option is critical to detect and ignore tampered cookies
8:26:18 PM idp.1   |  WARNING: a quick start development-only in-memory adapter is used, you MUST change it in order to not lose all stateful provider data upon restart and to be able to share these between processes
8:26:18 PM idp.1   |  WARNING: a quick start development-only signing keys are used, you are expected to provide your own in configuration "jwks" property
8:26:18 PM idp.1   |  WARNING: a quick start development-only feature devInteractions is enabled, you are expected to disable these interactions and provide your own
8:26:18 PM idp.1   |  oidc-provider listening on port 3000, check https://8de42e8c.ngrok.io/.well-known/openid-configuration
```

Please ignore the warnings as this is a simplistic example.

In this example, the link to initiate the authentication is https://df387119.ngrok.io/initiate?iss=https%3A%2F%2F8de42e8c.ngrok.io&target_link_uri=https%3A%2F%2Fdf387119.ngrok.io%2Ftarget.

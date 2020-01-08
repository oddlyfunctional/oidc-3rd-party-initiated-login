const { Issuer } = require('openid-client');
const { getNgrokUrl } = require('../utils');
const { generators } = require('openid-client');
const express = require('express');
const morgan = require('morgan');
const session = require('cookie-session');
const bodyParser = require('body-parser');

async function setup() {
  const idpUrl = await getNgrokUrl('idp');

  const issuerConfigs = new Map();
  issuerConfigs.set(idpUrl, {
    issuer: idpUrl,
    authorization_endpoint: idpUrl + '/auth',
    jwks_uri: idpUrl + '/jwks',
  });

  const url = await getNgrokUrl('rp');
  const callbackPath = '/cb';
  const callbackUrl = url + callbackPath;

  const rpConfig = {
    client_id: process.env.RP_ID,
    redirect_uris: [callbackUrl],
    response_types: ['id_token'],
  };

  const app = express();
  app.use(morgan('dev'));

  app.use(session({
    name: 'session',
    keys: ['secret1', 'secret2'],
    cookie: {
      secure: true,
      httpOnly: true,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    }
  }));
  app.use(bodyParser.urlencoded({ extended: true }));

  const getClient = issuerUrl => {
    const issuerConfig = issuerConfigs.get(issuerUrl);
    if (!issuerConfig) {
      return;
    }

    const issuer = new Issuer(issuerConfig);
    return new issuer.Client(rpConfig);
  };

  const hash = generators.codeChallenge;

  const validateTargetLinkUri = uri => {
    try {
      return new URL(uri).origin === url;
    } catch {
      return false;
    }
  };

  const initiatePath = '/initiate';
  app.get(initiatePath, (req, res) => {
    const state = {
      iss: req.query.iss,
      target_link_uri: req.query.target_link_uri,
    };
    const client = getClient(state.iss);
    if (!client) {
      res.status(400).send('invalid issuer');
      return;
    }

    if (!validateTargetLinkUri(state.target_link_uri)) {
      res.status(400).send('invalid target_link_uri');
      return;
    }
    const serializedState = Buffer.from(JSON.stringify(state)).toString('base64');
    req.session.state = serializedState;

    const nonce = generators.nonce();
    req.session.nonce = nonce;

    const authorizationUrl = client.authorizationUrl({
      scope: 'openid email',
      response_mode: 'form_post',
      nonce: hash(nonce),
      state: serializedState,
      login_hint: req.query.login_hint,
    });

    res.redirect(302, authorizationUrl);
  })

  app.post(callbackPath, (req, res) => {
    const state = JSON.parse(Buffer.from(req.session.state, 'base64').toString());
    const client = getClient(state.iss);
    if (!client) {
      res.status(400).send('');
      return;
    }

    const params = client.callbackParams(req);
    const nonce = hash(req.session.nonce);
    client.callback(callbackUrl, params, { nonce, state: req.session.state })
      .then(function (tokenSet) {
        const { sub, email: { email } } = tokenSet.claims();
        req.session.user = { id: sub, email };

        req.session.nonce = null;
        req.session.state = null;
        if (state.target_link_uri) {
          res.redirect(302, state.target_link_uri);
          return;
        }

        res.send('Successfully authenticated without target_link_uri');
      });
  });

  function authenticate(req, res, next) {
    if (req.session.user) {
      next();
    } else {
      res.status(401).send("Unauthenticated.");
    }
  }

  app.get('/target', authenticate, (req, res) => {
    res.send(`<h1>Welcome</h1><pre>${JSON.stringify(req.session.user)}</pre>`);
  });

  const port = process.env.RP_PORT;
  app.listen(port, () => {
    const initiateUrlExample = new URL(url + initiatePath);
    initiateUrlExample.searchParams.set('iss', idpUrl);
    initiateUrlExample.searchParams.set('target_link_uri', url + '/target');
    console.log(`Example app listening on port ${port}! Initiate authentication with ${initiateUrlExample.toString()}`);
  })
}

setup();

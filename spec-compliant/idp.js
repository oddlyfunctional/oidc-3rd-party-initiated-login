const { Provider } = require('oidc-provider');
const { getNgrokUrl } = require('../utils');

const db = new Map();
db.set('1', { email: 'user1@email.com' });
db.set('2', { email: 'user2@email.com' });

async function findAccount(_ctx, id, _token) {
  const email = db.get(id);
  if (email) {
    return {
      accountId: id,
      async claims(_use, _scope, _claims, _rejected) {
        return {
          sub: id,
          email,
        };
      },
    };
  }
}

async function setup() {
  const rpUrl = await getNgrokUrl('rp');

  const configuration = {
    clients: [{
      client_id: process.env.RP_ID,
      client_secret: process.env.RP_SECRET,
      redirect_uris: [rpUrl + "/cb"],
      response_types: ['id_token'],
      grant_types: ['implicit'],
    }],
    findAccount,
    scopes: ['openid', 'email'],
    claims: {
      email: ['email'],
      openid: [ 'sub' ],
    },
  };

  const url = await getNgrokUrl('idp');
  const port = process.env.IDP_PORT;
  const oidc = new Provider(url, configuration);
  oidc.proxy = true;

  oidc.listen(port, () => {
    console.log(`oidc-provider listening on port ${port}, check ${url}/.well-known/openid-configuration`);
  });
}

setup();

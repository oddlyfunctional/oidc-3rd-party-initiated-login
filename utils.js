const fetch = require('node-fetch');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getTunnels(attempts = 0) {
  if (attempts > 30) {
    throw new Error("ngrok didn't start in time");
  }

  const response = await fetch('http://127.0.0.1:4040/api/tunnels');
  const json = await response.json();
  if (json.tunnels.length > 0) {
    return json.tunnels;
  } else {
    await delay(200);
    return getTunnels(attempts + 1);
  }
}

async function getNgrokUrl(service) {
  const tunnels = await getTunnels();
  return tunnels.find(t => t.name === service).public_url;
}

module.exports = {
  getNgrokUrl,
};

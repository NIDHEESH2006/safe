/**
 * Local/persistent-host entry point. Vercel's serverless deployment does not
 * use this file — see api/index.js at the repo root, which imports the same
 * app.js and lets Vercel's Node runtime invoke it per request instead of
 * calling listen().
 */
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`SafeTrace API listening on http://localhost:${PORT}`);
});

/**
 * Vercel serverless entry point. Wraps the same Express app used locally
 * (server/app.js) so every route is identical between dev and production —
 * Vercel's Node runtime invokes this module's export per request instead of
 * the app calling .listen() itself.
 */
module.exports = require('../server/app');

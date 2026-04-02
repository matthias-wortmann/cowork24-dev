const fs = require('fs');
const path = require('path');
const log = require('../log.js');

const ttl = 86400; // seconds, aligned with robots/sitemap caching

/**
 * Serves static llms.txt (llmstxt.org-style) for AI crawlers and tools.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
module.exports = (req, res) => {
  const filePath = path.join(__dirname, 'llms.txt');
  res.set({
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': `public, max-age=${ttl}`,
  });
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  stream.on('error', e => {
    log.error(e, 'llms-txt-read-failed');
    if (!res.headersSent) {
      res.status(500).send('llms.txt unavailable');
    }
  });
  stream.pipe(res);
};

#!/usr/bin/env node
const http = require('http');

const port = process.env.MOCK_SUPABASE_PORT || 9000;

const server = http.createServer((req, res) => {
  // simple routing to return empty arrays for orders and payments
  if (req.url && req.url.startsWith('/rest/v1/orders')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }
  if (req.url && req.url.startsWith('/rest/v1/payments')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }

  // default
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'not found' }));
});

server.listen(port, () => {
  console.log(`Mock Supabase listening on http://localhost:${port}`);
});
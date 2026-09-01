import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'dist')
const port = Number(process.env.PORT) || 4173

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function safeFile(pathname) {
  const decoded = decodeURIComponent(pathname.split('?')[0])
  const file = normalize(join(root, decoded))
  if (!file.startsWith(root)) return null
  return file
}

const server = createServer((req, res) => {
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
  let file = safeFile(pathname)

  if (!file) {
    res.writeHead(403)
    res.end()
    return
  }

  const isDir = existsSync(file) && statSync(file).isDirectory()
  if (pathname === '/' || isDir || !extname(file) || !existsSync(file)) {
    file = join(root, 'index.html')
  }

  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  res.writeHead(200, {
    'Content-Type': types[extname(file)] ?? 'application/octet-stream',
  })
  createReadStream(file).pipe(res)
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Sip listening on ${port}`)
})

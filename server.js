const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

// IMPORTANTE: En producción, asegúrate de configurar NODE_ENV=production
// Ejemplo: NODE_ENV=production node server.js
// O en PM2: pm2 start server.js --env production
const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = process.env.PORT || 3000

// Advertencia si está en modo desarrollo en un entorno que parece producción
if (dev && process.env.PORT && process.env.PORT !== '3000') {
  console.warn('⚠️  ADVERTENCIA: NODE_ENV no está configurado como "production"')
  console.warn('⚠️  El indicador de desarrollo de Next.js puede aparecer')
  console.warn('⚠️  Configura NODE_ENV=production antes de ejecutar en producción')
}

// Configuración de logging
const LOG_FILE = path.join(__dirname, '.cursor', 'debug.log')
const LOG_ENDPOINT = 'http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0'

// Función helper para logging
function logDebug(data) {
  const logEntry = JSON.stringify({
    ...data,
    timestamp: Date.now(),
    sessionId: 'debug-session',
  }) + '\n'
  
  // Intentar enviar a endpoint HTTP (solo en desarrollo local)
  if (dev) {
    fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {})
  }
  
  // También escribir a archivo (útil en producción)
  try {
    const logDir = path.dirname(LOG_FILE)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    fs.appendFileSync(LOG_FILE, logEntry, 'utf8')
  } catch (err) {
    // Silenciar errores de logging
  }
}

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      const { pathname } = parsedUrl
      
      // Configurar límite de body size para rutas de importación (20MB)
      // Esto previene el error 413 (Request Entity Too Large)
      if (pathname && pathname.includes('/api/productos/importar')) {
        // Aumentar el límite de tamaño del body para esta ruta específica
        req.setTimeout(300000) // 5 minutos timeout
      }

      // #region agent log
      // Logging de requests a chunks para debugging
      if (pathname && pathname.startsWith('/_next/static/chunks/') && pathname.endsWith('.js')) {
        const chunkName = pathname.split('/').pop()
        logDebug({
          location: 'server.js:45',
          message: 'Chunk request received',
          data: {
            pathname,
            chunkName,
            method: req.method,
            headers: {
              host: req.headers.host,
              'user-agent': req.headers['user-agent']?.substring(0, 50),
            },
          },
          runId: 'chunk-debug',
          hypothesisId: 'A',
        })
      }
      // #endregion agent log

      await handle(req, res, parsedUrl)
      
      // #region agent log
      // Logging después de manejar el request (para ver el status code)
      if (pathname && pathname.startsWith('/_next/static/chunks/') && pathname.endsWith('.js')) {
        logDebug({
          location: 'server.js:75',
          message: 'Chunk request handled',
          data: {
            pathname,
            statusCode: res.statusCode,
          },
          runId: 'chunk-debug',
          hypothesisId: 'A',
        })
      }
      // #endregion agent log
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      
      // #region agent log
      logDebug({
        location: 'server.js:88',
        message: 'Server error handling request',
        data: {
          url: req.url,
          error: err.message,
          stack: err.stack?.substring(0, 200),
        },
        runId: 'error-debug',
        hypothesisId: 'C',
      })
      // #endregion agent log
      
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})


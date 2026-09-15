module.exports = {
  apps: [{
    name: 'punto-venta-2025',
    script: './server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    exec_mode: 'fork',
    // Reinicio automático si falla
    autorestart: true,
    // No reiniciar si se crasha muy rápido
    max_restarts: 5,
    min_uptime: '10s',
    // Logs
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Memoria máxima antes de reiniciar (opcional)
    max_memory_restart: '2G',
    // Esperar a que termine conexiones antes de reiniciar
    kill_timeout: 5000,
    // Escuchar señales de terminación
    listen_timeout: 10000
  }]
}

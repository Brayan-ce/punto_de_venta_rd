/**
import mysql from 'mysql2/promise';
const db = mysql.createPool({
  host: 'localhost',      // Host local
  port: 3306,             // Puerto predeterminado de MySQL
  user: 'brayan',         // Tu usuario
  password: '123456',  // Reemplaza con tu contraseña real
  database: 'punto_venta_rd',   // Nombre de la base de datos
});

export default db;
*/
/**/
// lib/db.ts o lib/database.ts
import mysql from 'mysql2/promise';
import { AsyncLocalStorage } from 'async_hooks'
import { cookies } from 'next/headers'

// Zona horaria del negocio para la conexión MySQL (República Dominicana = UTC-4).
// Se aplica a cada conexión para que NOW(), CURDATE() y DATE(fecha) trabajen en hora local
// y coincidan con la fecha que ve el usuario.
const DB_TIMEZONE = process.env.DB_TIMEZONE || '-04:00';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 20,
  waitForConnections: true,
  queueLimit: 0,
  timezone: DB_TIMEZONE,
  dateStrings: false,
});

// Forzar la zona horaria en cada conexión nueva del pool
try {
  pool.pool.on('connection', (conn) => {
    conn.query(`SET time_zone = '${DB_TIMEZONE}'`, (err) => {
      if (err) console.error('No se pudo setear time_zone en MySQL:', err.message)
    })
  })
} catch (e) {
  console.error('No se pudo registrar el evento de conexión para time_zone:', e?.message)
}

// ============================================
// BLOQUEO DE ESCRITURAS EN MODO OFFLINE
// ============================================
// Cuando la empresa tiene la opción "modo offline" activa, NINGUN usuario de esa
// empresa puede crear, editar ni eliminar datos desde la web (solo lectura).
// Las funciones internas del flujo offline (activar/desactivar, subir base de
// datos, sincronizar) deben envolverse con conPermisoEscrituraOffline().

const contextoEscritura = new AsyncLocalStorage()

export function conPermisoEscrituraOffline(fn) {
  return contextoEscritura.run({ permitido: true }, () => fn())
}

const PATRON_ESCRITURA = /^\s*(insert|replace|update|delete|drop|alter|create|truncate|rename|load|set\s+foreign_key)\b/i

const _cacheModoOffline = new Map()

async function consultarModoOfflineActivo(empresaId) {
  const ahora = Date.now()
  const cache = _cacheModoOffline.get(empresaId)
  if (cache && ahora - cache.ts < 5000) {
    return cache.activo
  }
  try {
    const [rows] = await pool.query(
      `SELECT 1
       FROM settings modo
       INNER JOIN settings confirmado
         ON confirmado.empresa_id = modo.empresa_id
        AND confirmado.name = 'modo_offline_confirmado'
        AND confirmado.value = '1'
       WHERE modo.empresa_id = ?
         AND modo.name = 'modo_offline'
         AND modo.value = '1'
       LIMIT 1`,
      [empresaId]
    )
    const activo = rows.length > 0
    _cacheModoOffline.set(empresaId, { activo, ts: ahora })
    return activo
  } catch (e) {
    return false
  }
}

export async function invalidarCacheModoOffline(empresaId) {
  _cacheModoOffline.delete(empresaId)
}

async function verificarEscritura(sql) {
  if (!PATRON_ESCRITURA.test(sql)) return
  if (contextoEscritura.getStore()?.permitido) return

  let empresaId
  try {
    const cookieStore = await cookies()
    empresaId = cookieStore.get('empresaId')?.value
  } catch (e) {
    return
  }
  if (!empresaId) return

  const activo = await consultarModoOfflineActivo(empresaId)
  if (activo) {
    const err = new Error('La empresa está en modo offline. No se pueden modificar datos en línea.')
    err.code = 'MODO_OFFLINE'
    throw err
  }
}

function envolverConexion(conn) {
  return new Proxy(conn, {
    get(target, prop) {
      if (prop === 'execute' || prop === 'query') {
        return async (sql, params) => {
          await verificarEscritura(String(sql))
          return target[prop](sql, params)
        }
      }
      const valor = target[prop]
      return typeof valor === 'function' ? valor.bind(target) : valor
    },
  })
}

const db = new Proxy(pool, {
  get(target, prop) {
    if (prop === 'getConnection') {
      return async () => {
        const conn = await target.getConnection()
        return envolverConexion(conn)
      }
    }
    if (prop === 'execute' || prop === 'query') {
      return async (sql, params) => {
        await verificarEscritura(String(sql))
        return target[prop](sql, params)
      }
    }
    const valor = target[prop]
    return typeof valor === 'function' ? valor.bind(target) : valor
  },
})

export default db;
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

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 20,
  waitForConnections: true,
  queueLimit: 0,
});

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
      `SELECT value FROM settings
       WHERE empresa_id = ? AND name = 'modo_offline' AND value = '1'
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
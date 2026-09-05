"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { conPermisoEscrituraOffline } from '@/_DB/db'

async function obtenerSesion() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  const empresaId = cookieStore.get('empresaId')?.value
  const userTipo = cookieStore.get('userTipo')?.value
  return { userId, empresaId, userTipo }
}

async function obtenerTablasConEmpresa(connection) {
  const [rows] = await connection.execute(
    `SELECT c.TABLE_NAME, c.COLUMN_NAME
     FROM information_schema.COLUMNS c
     INNER JOIN information_schema.TABLES t
       ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME AND t.TABLE_TYPE = 'BASE TABLE'
     WHERE c.TABLE_SCHEMA = DATABASE() AND c.COLUMN_NAME = 'empresa_id'
     ORDER BY c.TABLE_NAME`
  )
  return rows.map((r) => ({ tabla: r.TABLE_NAME, columna: r.COLUMN_NAME }))
}

async function obtenerTablasHijas(connection, tablasConEmpresa) {
  const setPadres = new Set(tablasConEmpresa.map((t) => t.tabla))
  const [fks] = await connection.execute(
    `SELECT k.TABLE_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_NAME
     FROM information_schema.KEY_COLUMN_USAGE k
     INNER JOIN information_schema.TABLES ct
       ON ct.TABLE_SCHEMA = k.TABLE_SCHEMA AND ct.TABLE_NAME = k.TABLE_NAME AND ct.TABLE_TYPE = 'BASE TABLE'
     INNER JOIN information_schema.TABLES pt
       ON pt.TABLE_SCHEMA = k.REFERENCED_TABLE_SCHEMA AND pt.TABLE_NAME = k.REFERENCED_TABLE_NAME AND pt.TABLE_TYPE = 'BASE TABLE'
     WHERE k.TABLE_SCHEMA = DATABASE()
       AND k.REFERENCED_TABLE_NAME IS NOT NULL
     ORDER BY k.TABLE_NAME`
  )
  const hijas = []
  const vistas = new Set()
  for (const fk of fks) {
    // Solo se tratan como "hijas" las tablas SIN su propia columna empresa_id
    // (que se descargan directo con WHERE empresa_id = ?). Las tablas con
    // empresa_id ya se descargaron correctamente; si además tienen una FK
    // (por ejemplo clientes.cliente_padre_id -> clientes.id), volver a
    // descargarlas por JOIN sobrescribiría sus datos reales con un filtro
    // distinto y las dejaría vacías.
    if (
      setPadres.has(fk.REFERENCED_TABLE_NAME) &&
      !setPadres.has(fk.TABLE_NAME) &&
      !vistas.has(fk.TABLE_NAME)
    ) {
      hijas.push({ tabla: fk.TABLE_NAME, columna: fk.COLUMN_NAME, padre: fk.REFERENCED_TABLE_NAME })
      vistas.add(fk.TABLE_NAME)
    }
  }
  return hijas
}

function serializar(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v instanceof Date) out[k] = v.toISOString().slice(0, 19).replace('T', ' ')
    else if (v === null || v === undefined) out[k] = null
    else out[k] = typeof v === 'bigint' ? Number(v) : v
  }
  return out
}

export async function obtenerDatosOffline() {
  let connection
  try {
    const { userId, empresaId, userTipo } = await obtenerSesion()
    if (!userId || !empresaId || !userTipo) {
      return { success: false, mensaje: 'Sesion invalida' }
    }
    connection = await db.getConnection()
    return await descargarDatosEmpresa(connection, userId, empresaId)
  } catch (error) {
    console.error('Error al obtener datos offline:', error)
    if (connection) connection.release()
    return { success: false, mensaje: 'Error al descargar datos' }
  }
}

// Tablas de referencia globales (sin empresa_id) que la app móvil necesita
// para funcionar offline: catálogos compartidos entre todas las empresas.
const TABLAS_REFERENCIA_GLOBALES = [
  'tipos_documento',
  'tipos_comprobante',
  'monedas',
  'terminos_condiciones',
  'paises',
  'regiones',
  'sistema_reglas',
]

/**
 * Descarga todos los datos de la empresa para modo offline.
 * Usado por la server action (sesión web) y por el endpoint /api/offline/sync (app móvil).
 */
export async function descargarDatosEmpresa(connection, userId, empresaId, opciones = {}) {
  const { verificarOfflineHabilitado = true } = opciones
  try {
    const [usuario] = await connection.execute(
      `SELECT id, empresa_id, nombre, email, password, tipo, rol_id, system_mode, offline_habilitado
       FROM usuarios WHERE id = ? AND empresa_id = ? AND activo = TRUE`,
      [userId, empresaId]
    )

    if (usuario.length === 0) {
      connection.release()
      return { success: false, mensaje: 'Usuario no encontrado' }
    }

    if (verificarOfflineHabilitado && !usuario[0].offline_habilitado) {
      connection.release()
      return { success: false, mensaje: 'Modo offline no habilitado' }
    }

    const tablasConEmpresa = await obtenerTablasConEmpresa(connection)
    const tablasHijas = await obtenerTablasHijas(connection, tablasConEmpresa)
    const nombresConEmpresa = new Set(tablasConEmpresa.map((t) => t.tabla))

    const tablas = {}
    const erroresDescarga = []

    for (const t of tablasConEmpresa) {
      try {
        const [filas] = await connection.execute(
          `SELECT * FROM \`${t.tabla}\` WHERE \`${t.columna}\` = ?`,
          [empresaId]
        )
        tablas[t.tabla] = filas.map(serializar)
        if (['clientes', 'fin_planes', 'fin_contratos', 'fin_cuotas'].includes(t.tabla)) {
          console.log(`[descargarDatosEmpresa] tabla ${t.tabla}: ${filas.length} filas`)
        }
      } catch (e) {
        console.error(`Error descargando tabla ${t.tabla}:`, e.message)
        tablas[t.tabla] = []
        erroresDescarga.push(`${t.tabla}: ${e.message}`)
      }
    }

    for (const h of tablasHijas) {
      try {
        const [filas] = await connection.execute(
          `SELECT h.* FROM \`${h.tabla}\` h
           INNER JOIN \`${h.padre}\` p ON h.\`${h.columna}\` = p.\`id\`
           WHERE p.\`empresa_id\` = ?`,
          [empresaId]
        )
        tablas[h.tabla] = filas.map(serializar)
      } catch (e) {
        console.error(`Error descargando tabla hija ${h.tabla}:`, e.message)
        tablas[h.tabla] = []
        erroresDescarga.push(`${h.tabla}: ${e.message}`)
      }
    }

    // Tablas de referencia globales: descargar TODAS las filas (son catálogos
    // compartidos, no pertenecen a una sola empresa). Solo si no fueron
    // descargadas ya (por tener empresa_id o ser hijas).
    for (const nombre of TABLAS_REFERENCIA_GLOBALES) {
      if (nombresConEmpresa.has(nombre) || tablas[nombre] !== undefined) continue
      try {
        const [filas] = await connection.execute(`SELECT * FROM \`${nombre}\``)
        tablas[nombre] = filas.map(serializar)
      } catch (e) {
        console.error(`Error descargando tabla de referencia ${nombre}:`, e.message)
        erroresDescarga.push(`${nombre}: ${e.message}`)
      }
    }

    const [empresas] = await connection.execute(
      `SELECT * FROM empresas WHERE id = ?`,
      [empresaId]
    )

    connection.release()

    return {
      success: true,
      empresa_id: Number(empresaId),
      usuario: serializar(usuario[0]),
      empresa: empresas.length > 0 ? serializar(empresas[0]) : null,
      tablas,
      errores_descarga: erroresDescarga,
      productos: Array.isArray(tablas.productos) ? tablas.productos : [],
      clientes: Array.isArray(tablas.clientes) ? tablas.clientes : [],
      categorias: Array.isArray(tablas.categorias) ? tablas.categorias : [],
      unidades_medida: Array.isArray(tablas.unidades_medida) ? tablas.unidades_medida : [],
    }
  } catch (error) {
    console.error('Error al obtener datos offline:', error)
    if (connection) connection.release()
    return { success: false, mensaje: 'Error al descargar datos' }
  }
}

export async function subirBaseDatos(datos, contextoUsuario = null) {
  let connection
  try {
    // contextoUsuario permite llamar sin cookies (p.ej. desde el móvil), pasando
    // { userId, empresaId, userTipo } autenticados por correo/contraseña.
    const ctx = contextoUsuario || (await obtenerSesion())
    const { userId, empresaId, userTipo } = ctx
    if (!userId || !empresaId) {
      return { success: false, mensaje: 'Sesion invalida' }
    }
    if (userTipo !== 'admin') {
      return { success: false, mensaje: 'Sin permisos' }
    }
    if (!datos || typeof datos !== 'object' || !datos.tablas || typeof datos.tablas !== 'object') {
      return { success: false, mensaje: 'Archivo de base de datos invalido' }
    }
    if (Number(datos.empresa_id) !== Number(empresaId)) {
      return { success: false, mensaje: 'La base de datos no pertenece a esta empresa' }
    }

    connection = await db.getConnection()

    const resultado = await conPermisoEscrituraOffline(async () => {
      // Descubrir SOLO tablas base (nunca vistas), sus columnas reales y las generadas
      const [infoColumnas] = await connection.execute(
        `SELECT c.TABLE_NAME, c.COLUMN_NAME, c.EXTRA, c.IS_NULLABLE, c.COLUMN_DEFAULT, c.DATA_TYPE
         FROM information_schema.COLUMNS c
         INNER JOIN information_schema.TABLES t
           ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME AND t.TABLE_TYPE = 'BASE TABLE'
         WHERE c.TABLE_SCHEMA = DATABASE()
         ORDER BY c.TABLE_NAME`
      )
      const columnasPorTabla = {}
      const generadasPorTabla = {}
      // columnas NOT NULL (sin auto_increment ni generadas) con su default/tipo, para
      // reemplazar los null que llegan del móvil por el default real de la columna.
      const notNullPorTabla = {}
      for (const r of infoColumnas) {
        if (!columnasPorTabla[r.TABLE_NAME]) columnasPorTabla[r.TABLE_NAME] = new Set()
        columnasPorTabla[r.TABLE_NAME].add(r.COLUMN_NAME)
        if (String(r.EXTRA).toUpperCase().includes('GENERATED')) {
          if (!generadasPorTabla[r.TABLE_NAME]) generadasPorTabla[r.TABLE_NAME] = new Set()
          generadasPorTabla[r.TABLE_NAME].add(r.COLUMN_NAME)
        }
        const esAuto = String(r.EXTRA).toUpperCase().includes('AUTO_INCREMENT')
        const esGenerada = String(r.EXTRA).toUpperCase().includes('GENERATED')
        if (r.IS_NULLABLE === 'NO' && !esAuto && !esGenerada) {
          if (!notNullPorTabla[r.TABLE_NAME]) notNullPorTabla[r.TABLE_NAME] = {}
          notNullPorTabla[r.TABLE_NAME][r.COLUMN_NAME] = {
            def: r.COLUMN_DEFAULT,
            tipo: r.DATA_TYPE,
          }
        }
      }

      const FUNCION_DEFAULTS = new Set([
        'CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP()', 'NOW', 'NOW()',
        'CURRENT_DATE', 'CURRENT_DATE()', 'CURRENT_TIME', 'CURRENT_TIME()', 'NULL', 'uuid()',
      ])

      function valorPorDefault(def, tipo) {
        const t = String(tipo)
        if (/^(tinyint|smallint|mediumint|int|bigint|decimal|double|float|numeric|year)$/.test(t)) {
          const n = parseFloat(def)
          return isNaN(n) ? 0 : n
        }
        return String(def)
      }

      function valorPorTipo(tipo) {
        const t = String(tipo)
        if (/^(tinyint|smallint|mediumint|int|bigint|decimal|double|float|numeric|year)$/.test(t)) return 0
        if (/^(char|varchar|tinytext|text|mediumtext|longtext|enum|set)$/.test(t)) return ''
        if (/^(timestamp|datetime|date|time)$/.test(t)) return new Date().toISOString().slice(0, 19).replace('T', ' ')
        return ''
      }

      const erroresTablas = []
      const filasProcesadas = []

      // INSERT ... ON DUPLICATE KEY UPDATE por lotes. No borra nada: si la fila ya
      // existe la actualiza, si no la inserta. Nunca da "Duplicate entry".
      const TAMANO_LOTE = 400
      // Valores por defecto "manualmente" para columnas NOT NULL cuyo default en el
      // esquema puede no estar o sea una función (evita "cannot be null" al subir).
      const DEFAULTS_NOT_NULL = {
        productos: {
          es_rastreable: 0,
          tipo_activo: 'no_rastreable',
          requiere_serie: 0,
          permite_financiamiento: 0,
          stock: 0,
          stock_minimo: 5,
          stock_maximo: 100,
          cantidad_mayorista: 6,
          meses_garantia: 0,
          aplica_itbis: 1,
          activo: 1,
        },
        usuarios: {
          permite_impresion: 1,
          offline_habilitado: 0,
          activo: 1,
          system_mode: 'POS',
        },
      }
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0')
      try {
        for (const [nombre, filas] of Object.entries(datos.tablas)) {
          if (!Array.isArray(filas)) continue
          const columnasReales = columnasPorTabla[nombre]
          if (!columnasReales || columnasReales.size === 0) continue
          const generadas = generadasPorTabla[nombre] || new Set()
          const tieneEmpresa = columnasReales.has('empresa_id')
          const tieneId = columnasReales.has('id')

          // Tabla vacía: reconciliar borrando TODAS las filas de la empresa
          if (filas.length === 0) {
            if (tieneEmpresa && tieneId) {
              try {
                await connection.execute(`DELETE FROM \`${nombre}\` WHERE empresa_id = ?`, [empresaId])
              } catch (e) {
                try {
                  if (columnasReales.has('activo')) {
                    await connection.execute(`UPDATE \`${nombre}\` SET activo = 0 WHERE empresa_id = ?`, [empresaId])
                  } else {
                    erroresTablas.push(`${nombre} (borrados): ${e.message}`)
                  }
                } catch (e2) {
                  erroresTablas.push(`${nombre} (borrados): ${e2.message}`)
                }
              }
            }
            continue
          }

          const columnas = Object.keys(filas[0]).filter((c) => columnasReales.has(c) && !generadas.has(c))
          if (columnas.length === 0) continue

          const defaults = DEFAULTS_NOT_NULL[nombre] || {}
          const notNull = notNullPorTabla[nombre] || {}

          const citados = columnas.map((c) => '`' + c + '`').join(', ')
          const updates = columnas.map((c) => '`' + c + '` = VALUES(`' + c + '`)').join(', ')
          try {
            for (let i = 0; i < filas.length; i += TAMANO_LOTE) {
              const lote = filas.slice(i, i + TAMANO_LOTE)
              const marcadores = lote.map(() => `(${columnas.map(() => '?').join(', ')})`).join(', ')
              const stmt = `INSERT INTO \`${nombre}\` (${citados}) VALUES ${marcadores} ON DUPLICATE KEY UPDATE ${updates}`
              const valores = []
              for (const fila of lote) {
                for (const c of columnas) {
                  let v = fila[c] === undefined ? null : fila[c]
                  if (v === null) {
                    if (defaults[c] !== undefined) {
                      v = defaults[c]
                    } else if (notNull[c] !== undefined) {
                      const meta = notNull[c]
                      const defTxt = meta.def === null ? null : String(meta.def).trim()
                      if (defTxt !== null && !FUNCION_DEFAULTS.has(defTxt)) {
                        v = valorPorDefault(defTxt, meta.tipo)
                      } else {
                        v = valorPorTipo(meta.tipo)
                      }
                    }
                  }
                  valores.push(v)
                }
              }
              await connection.execute(stmt, valores)
            }
            filasProcesadas.push(`${nombre}:${filas.length}`)

            // Propagar borrados: eliminar las filas de la empresa que ya no están
            // en el JSON (productos/clientes/etc. borrados desde el móvil).
            if (tieneEmpresa && tieneId) {
              const idsLocal = filas.map((f) => f.id).filter((v) => v !== null && v !== undefined && v !== '')
              try {
                if (idsLocal.length > 0) {
                  for (let i = 0; i < idsLocal.length; i += TAMANO_LOTE) {
                    const lote = idsLocal.slice(i, i + TAMANO_LOTE)
                    const marc = lote.map(() => '?').join(', ')
                    try {
                      await connection.execute(
                        `DELETE FROM \`${nombre}\` WHERE empresa_id = ? AND id NOT IN (${marc})`,
                        [empresaId, ...lote]
                      )
                    } catch (eBorrar) {
                      if (columnasReales.has('activo')) {
                        await connection.execute(
                          `UPDATE \`${nombre}\` SET activo = 0 WHERE empresa_id = ? AND id NOT IN (${marc})`,
                          [empresaId, ...lote]
                        )
                      } else {
                        throw eBorrar
                      }
                    }
                  }
                }
              } catch (eBorrar) {
                erroresTablas.push(`${nombre} (borrados): ${eBorrar.message}`)
              }
            }
          } catch (e) {
            erroresTablas.push(`${nombre}: ${e.message}`)
            console.error(`Error subiendo tabla ${nombre}:`, e.message)
          }
        }

        // Actualizar la empresa misma (no borra los datos de otras empresas)
        if (datos.empresa && typeof datos.empresa === 'object' && datos.empresa.id) {
          const e = datos.empresa
          const generadas = generadasPorTabla.empresas || new Set()
          const columnas = Object.keys(e).filter((c) => columnasPorTabla.empresas?.has(c) && !generadas.has(c))
          if (columnas.length > 0) {
            const citados = columnas.map((c) => '`' + c + '`').join(', ')
            const marcadores = columnas.map(() => '?').join(', ')
            const updates = columnas.map((c) => '`' + c + '` = VALUES(`' + c + '`)').join(', ')
            await connection.execute(
              `INSERT INTO \`empresas\` (${citados}) VALUES (${marcadores})
               ON DUPLICATE KEY UPDATE ${updates}`,
              columnas.map((c) => e[c] === undefined ? null : e[c])
            )
          }
        }
      } finally {
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1')
      }

      if (erroresTablas.length > 0) {
        return {
          success: false,
          mensaje: 'La base de datos se subió con algunos errores: ' + erroresTablas.join(' | '),
          errores: erroresTablas,
        }
      }

      // Subida correcta: desbloquear la empresa (ya no está en modo offline total)
      try {
        await connection.execute(
          `UPDATE settings SET value = '0', updated_at = NOW() WHERE empresa_id = ? AND name = 'modo_offline_confirmado'`,
          [empresaId]
        )
        await connection.execute(
          `UPDATE settings SET value = '0', updated_at = NOW() WHERE empresa_id = ? AND name = 'modo_offline'`,
          [empresaId]
        )
      } catch (_) {}

      return {
        success: true,
        mensaje: `Base de datos subida correctamente (${filasProcesadas.length} tablas). Ahora puedes desactivar el modo offline.`,
        tablas: filasProcesadas,
      }
    })

    connection.release()
    return resultado
  } catch (error) {
    console.error('Error al subir base de datos:', error)
    if (connection) connection.release()
    return { success: false, mensaje: 'Error al subir la base de datos' }
  }
}

export async function recibirSyncOperaciones(operaciones) {
  let connection
  try {
    const { empresaId } = await obtenerSesion()

    if (!empresaId || !Array.isArray(operaciones) || operaciones.length === 0) {
      return { success: false, mensaje: 'Sin operaciones para procesar' }
    }

    connection = await db.getConnection()

    const resultados = await conPermisoEscrituraOffline(async () => {
      const items = []
      for (const op of operaciones) {
        try {
          const { tipo, datos } = op
          let resultado = null

          if (tipo === 'crear_producto') {
            const [r] = await connection.execute(
              `INSERT INTO productos (empresa_id, codigo, nombre, precio, stock, activo)
               VALUES (?, ?, ?, ?, ?, TRUE)`,
              [empresaId, datos.codigo, datos.nombre, datos.precio, datos.stock || 0]
            )
            resultado = { insertId: r.insertId }
          } else if (tipo === 'actualizar_producto') {
            await connection.execute(
              `UPDATE productos SET codigo = ?, nombre = ?, precio = ?, stock = ?
               WHERE id = ? AND empresa_id = ?`,
              [datos.codigo, datos.nombre, datos.precio, datos.stock, datos.id, empresaId]
            )
            resultado = { updated: true }
          } else if (tipo === 'crear_cliente') {
            const [r] = await connection.execute(
              `INSERT INTO clientes (empresa_id, nombre, apellidos, telefono, email, cedula, direccion, activo)
               VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
              [empresaId, datos.nombre, datos.apellidos || '', datos.telefono || '', datos.email || '', datos.cedula || '', datos.direccion || '']
            )
            resultado = { insertId: r.insertId }
          } else if (tipo === 'actualizar_cliente') {
            await connection.execute(
              `UPDATE clientes SET nombre = ?, apellidos = ?, telefono = ?, email = ?
               WHERE id = ? AND empresa_id = ?`,
              [datos.nombre, datos.apellidos || '', datos.telefono || '', datos.email || '', datos.id, empresaId]
            )
            resultado = { updated: true }
          }

          items.push({ exito: true, id: op.id, resultado, tipo })
        } catch (errOp) {
          items.push({ exito: false, id: op.id, error: errOp.message, tipo: op.tipo })
        }
      }
      return items
    })

    connection.release()
    return { success: true, resultados }
  } catch (error) {
    console.error('Error al sincronizar operaciones:', error)
    if (connection) connection.release()
    return { success: false, mensaje: 'Error al procesar sincronización' }
  }
}
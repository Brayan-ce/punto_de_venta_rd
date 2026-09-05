"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'

function limpiarTextoPlano(valor = '') {
    return String(valor || '')
        .normalize('NFD')
        .replace(/[^\x00-\x7F]/g, '')
        .replace(/[^a-zA-Z0-9\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function generarPasswordAleatoria(longitud = 12) {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*'
    let resultado = ''
    for (let i = 0; i < longitud; i += 1) {
        const idx = Math.floor(Math.random() * caracteres.length)
        resultado += caracteres[idx]
    }
    return resultado
}

function generarTextoAleatorio(longitud = 4) {
    const caracteres = 'abcdefghjkmnpqrstuvwxyz23456789'
    let resultado = ''
    for (let i = 0; i < longitud; i += 1) {
        const idx = Math.floor(Math.random() * caracteres.length)
        resultado += caracteres[idx]
    }
    return resultado
}

async function obtenerModuloPosId(connection) {
    const [rows] = await connection.execute(
        `SELECT id
         FROM modulos
         WHERE codigo = 'pos' AND activo = TRUE
         LIMIT 1`
    )

    if (!rows.length) {
        throw new Error('No existe el modulo POS activo en la tabla modulos')
    }

    return Number(rows[0].id)
}

async function habilitarModuloPosEmpresa(connection, empresaId, moduloPosId) {
    await connection.execute(
        `INSERT INTO empresa_modulos (empresa_id, modulo_id, habilitado)
         VALUES (?, ?, TRUE)
         ON DUPLICATE KEY UPDATE
            habilitado = TRUE,
            fecha_actualizacion = CURRENT_TIMESTAMP`,
        [empresaId, moduloPosId]
    )
}

async function crearUsuarioSucursalAutomatico(connection, { empresaId, nombreSucursal, codigoSucursal, emailSucursal }) {
    const nombreLimpio = limpiarTextoPlano(nombreSucursal || 'Sucursal')
    const baseSlug = (nombreLimpio || 'sucursal')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 28)

    for (let intento = 0; intento < 20; intento += 1) {
        const marca = Date.now().toString().slice(-6)
        const semilla = generarTextoAleatorio(4)
        const cedula = `SUC${empresaId}${marca}${semilla}`.toUpperCase().slice(0, 20)

        const localPart = `${baseSlug || 'sucursal'}-${codigoSucursal.toLowerCase().replace(/[^a-z0-9]/g, '')}-${semilla}`.slice(0, 56)
        const emailSucursalNormalizado = String(emailSucursal || '').trim().toLowerCase()
        const emailCandidato = emailSucursalNormalizado || `${localPart}@pos.local`

        const [duplicadoCedula] = await connection.execute(
            `SELECT id
             FROM usuarios
             WHERE cedula = ?
             LIMIT 1`,
            [cedula]
        )

        if (duplicadoCedula.length > 0) continue

        let email = emailCandidato
        const [duplicadoEmail] = await connection.execute(
            `SELECT id
             FROM usuarios
             WHERE email = ?
             LIMIT 1`,
            [email]
        )

        if (duplicadoEmail.length > 0) {
            if (emailSucursalNormalizado) {
                // Si el email de la sucursal ya existe, fallback a email tecnico unico.
                email = `${localPart}@pos.local`
                const [duplicadoFallback] = await connection.execute(
                    `SELECT id
                     FROM usuarios
                     WHERE email = ?
                     LIMIT 1`,
                    [email]
                )

                if (duplicadoFallback.length > 0) continue
            } else {
                continue
            }
        }

        const passwordPlano = generarPasswordAleatoria(12)
        const passwordHash = await bcrypt.hash(passwordPlano, 10)
        const nombreUsuario = `Sucursal ${nombreLimpio || codigoSucursal}`.slice(0, 100)

        const [insertResult] = await connection.execute(
            `INSERT INTO usuarios (
                empresa_id,
                nombre,
                cedula,
                email,
                password,
                tipo,
                system_mode,
                activo
            ) VALUES (?, ?, ?, ?, ?, 'admin', 'POS', TRUE)`,
            [empresaId, nombreUsuario, cedula, email, passwordHash]
        )

        return {
            usuarioId: Number(insertResult.insertId),
            nombre: nombreUsuario,
            cedula,
            email,
            password: passwordPlano,
            system_mode: 'POS',
            tipo: 'admin'
        }
    }

    throw new Error('No se pudo generar un usuario unico para la sucursal')
}

async function obtenerContextoSesion() {
    const cookieStore = await cookies()
    const empresaId = cookieStore.get('empresaId')?.value
    const userId = cookieStore.get('userId')?.value

    if (!empresaId || !userId) return null

    return {
        empresaId: Number(empresaId),
        userId: Number(userId)
    }
}

async function generarCodigoSucursal(connection, empresaId) {
    const [rows] = await connection.execute(
        `SELECT codigo FROM sucursales WHERE empresa_id = ?`,
        [empresaId]
    )

    const codigos = new Set(rows.map((r) => String(r.codigo || '').toUpperCase()))

    let maxCorrelativo = 0
    for (const code of codigos) {
        const match = /^SUC-(\d+)$/.exec(code)
        if (match) {
            const numero = Number(match[1])
            if (!Number.isNaN(numero) && numero > maxCorrelativo) {
                maxCorrelativo = numero
            }
        }
    }

    let siguiente = maxCorrelativo + 1
    let candidato = `SUC-${String(siguiente).padStart(4, '0')}`

    while (codigos.has(candidato)) {
        siguiente += 1
        candidato = `SUC-${String(siguiente).padStart(4, '0')}`
    }

    return candidato
}

async function obtenerReferenciasSucursal(connection, sucursalId) {
    const [referencias] = await connection.execute(
        `SELECT TABLE_NAME, COLUMN_NAME
         FROM information_schema.KEY_COLUMN_USAGE
         WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
           AND REFERENCED_TABLE_NAME = 'sucursales'
           AND REFERENCED_COLUMN_NAME = 'id'`
    )

    const uso = []

    for (const ref of referencias) {
        const tabla = String(ref.TABLE_NAME || '')
        const columna = String(ref.COLUMN_NAME || '')

        if (!tabla || !columna || tabla === 'sucursales') continue

        const sql = `SELECT COUNT(*) AS total FROM \`${tabla}\` WHERE \`${columna}\` = ?`
        const [rows] = await connection.execute(sql, [sucursalId])
        const total = Number(rows?.[0]?.total || 0)
        if (total > 0) {
            uso.push({ tabla, total })
        }
    }

    return uso
}

async function rollbackYReleaseSeguro(connection) {
    if (!connection) return
    try {
        await connection.rollback()
    } catch (rollbackError) {
        console.error('No se pudo hacer rollback de la transaccion:', rollbackError)
    }

    try {
        connection.release()
    } catch (releaseError) {
        console.error('No se pudo liberar la conexion:', releaseError)
    }
}

async function obtenerMonedasActivas(connection) {
    const [monedas] = await connection.execute(
        `SELECT id, codigo, nombre, simbolo
         FROM monedas
         WHERE activo = TRUE
         ORDER BY CASE WHEN codigo = 'DOP' THEN 0 ELSE 1 END, codigo ASC`
    )
    return monedas || []
}

async function existeColumnaMonedaSucursal(connection) {
    const [rows] = await connection.execute(
        `SELECT 1
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'sucursales'
           AND COLUMN_NAME = 'moneda_id'
         LIMIT 1`
    )
    return rows.length > 0
}

export async function obtenerDatosSucursales(filtros = {}) {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()

        const tieneMonedaSucursal = await existeColumnaMonedaSucursal(connection)
        const monedas = await obtenerMonedasActivas(connection)

        const [usuarios] = await connection.execute(
            `SELECT id, nombre, email
             FROM usuarios
             WHERE empresa_id = ? AND activo = TRUE
             ORDER BY nombre ASC
             LIMIT 500`,
            [contexto.empresaId]
        )

        let query = `
            SELECT
                s.id,
                s.codigo,
                s.nombre,
                s.telefono,
                s.email,
                s.direccion,
                s.ciudad,
                ${tieneMonedaSucursal ? 's.moneda_id,' : 'NULL AS moneda_id,'}
                s.encargado_usuario_id,
                s.es_principal,
                s.activa,
                s.notas,
                s.fecha_actualizacion,
                u.nombre AS encargado_nombre,
                ${tieneMonedaSucursal ? 'm.codigo AS moneda_codigo,' : 'NULL AS moneda_codigo,'}
                ${tieneMonedaSucursal ? 'm.nombre AS moneda_nombre,' : 'NULL AS moneda_nombre,'}
                ${tieneMonedaSucursal ? 'm.simbolo AS moneda_simbolo,' : 'NULL AS moneda_simbolo,'}
                COUNT(DISTINCT us.id) AS total_usuarios,
                upos.email AS usuario_pos_email,
                upos.nombre AS usuario_pos_nombre,
                upos.cedula AS usuario_pos_cedula
            FROM sucursales s
            LEFT JOIN usuarios u ON u.id = s.encargado_usuario_id
            ${tieneMonedaSucursal ? 'LEFT JOIN monedas m ON m.id = s.moneda_id' : ''}
            LEFT JOIN usuarios_sucursales us ON us.sucursal_id = s.id AND us.empresa_id = s.empresa_id
            LEFT JOIN (
                SELECT
                    us2.sucursal_id,
                    MIN(us2.id) AS acceso_admin_pos_id
                FROM usuarios_sucursales us2
                INNER JOIN usuarios u2 ON u2.id = us2.usuario_id
                WHERE us2.empresa_id = ?
                  AND us2.rol_sucursal = 'admin'
                  AND u2.system_mode = 'POS'
                  AND u2.activo = TRUE
                  AND u2.cedula LIKE 'SUC%'
                GROUP BY us2.sucursal_id
            ) upos_idx ON upos_idx.sucursal_id = s.id
            LEFT JOIN usuarios_sucursales us_pos ON us_pos.id = upos_idx.acceso_admin_pos_id
            LEFT JOIN usuarios upos ON upos.id = us_pos.usuario_id
            WHERE s.empresa_id = ?
        `
        const params = [contexto.empresaId, contexto.empresaId]

        if (filtros.buscar) {
            query += ' AND (s.nombre LIKE ? OR s.codigo LIKE ? OR s.ciudad LIKE ? OR s.email LIKE ?)'
            const like = `%${filtros.buscar}%`
            params.push(like, like, like, like)
        }

        if (typeof filtros.activa === 'boolean') {
            query += ' AND s.activa = ?'
            params.push(filtros.activa)
        }

        query += `
            GROUP BY
                s.id,
                s.codigo,
                s.nombre,
                s.telefono,
                s.email,
                s.direccion,
                s.ciudad,
                ${tieneMonedaSucursal ? 's.moneda_id,' : ''}
                s.encargado_usuario_id,
                s.es_principal,
                s.activa,
                s.notas,
                s.fecha_actualizacion,
                u.nombre,
                ${tieneMonedaSucursal ? 'm.codigo, m.nombre, m.simbolo,' : ''}
                upos.email,
                upos.nombre,
                upos.cedula
            ORDER BY s.es_principal DESC, s.nombre ASC
        `

        const [sucursales] = await connection.execute(query, params)
        connection.release()

        return {
            success: true,
            sucursales,
            usuarios,
            monedas,
            tieneMonedaSucursal
        }
    } catch (error) {
        console.error('Error en obtenerDatosSucursales:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar sucursales' }
    }
}

export async function guardarSucursal(payload = {}) {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const sucursalId = payload.id ? Number(payload.id) : null
        let codigo = ''
        const nombre = String(payload.nombre || '').trim()
        const telefono = String(payload.telefono || '').trim()
        const email = String(payload.email || '').trim()
        const direccion = String(payload.direccion || '').trim()
        const ciudad = String(payload.ciudad || '').trim()
        const notas = String(payload.notas || '').trim()
        const monedaId = payload.monedaId ? Number(payload.monedaId) : null
        const encargadoUsuarioId = payload.encargadoUsuarioId ? Number(payload.encargadoUsuarioId) : null
        const esPrincipal = Boolean(payload.esPrincipal)
        const activa = payload.activa !== false

        if (!nombre) {
            return { success: false, mensaje: 'El nombre es obligatorio' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        const tieneMonedaSucursal = await existeColumnaMonedaSucursal(connection)

        if (!tieneMonedaSucursal) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Debes ejecutar la migracion para agregar moneda_id en sucursales antes de guardar.'
            }
        }

        if (!monedaId || Number.isNaN(monedaId)) {
            await connection.rollback()
            connection.release()
            return { success: false, mensaje: 'Debes seleccionar una moneda para la sucursal' }
        }

        const [monedaRows] = await connection.execute(
            `SELECT id
             FROM monedas
             WHERE id = ? AND activo = TRUE
             LIMIT 1`,
            [monedaId]
        )

        if (!monedaRows.length) {
            await connection.rollback()
            connection.release()
            return { success: false, mensaje: 'La moneda seleccionada no es valida o esta inactiva' }
        }

        if (sucursalId) {
            const [actualRows] = await connection.execute(
                `SELECT codigo
                 FROM sucursales
                 WHERE id = ? AND empresa_id = ?
                 LIMIT 1`,
                [sucursalId, contexto.empresaId]
            )

            if (!actualRows.length) {
                await connection.rollback()
                connection.release()
                return { success: false, mensaje: 'Sucursal no encontrada' }
            }

            codigo = String(actualRows[0].codigo || '').toUpperCase()
        }

        if (!codigo) {
            codigo = await generarCodigoSucursal(connection, contexto.empresaId)
        }

        const [codigoDuplicado] = await connection.execute(
            `SELECT id
             FROM sucursales
             WHERE empresa_id = ? AND codigo = ? AND (? IS NULL OR id <> ?)
             LIMIT 1`,
            [contexto.empresaId, codigo, sucursalId, sucursalId]
        )

        if (codigoDuplicado.length > 0) {
            await connection.rollback()
            connection.release()
            return { success: false, mensaje: 'Ya existe una sucursal con ese codigo' }
        }

        const [nombreDuplicado] = await connection.execute(
            `SELECT id
             FROM sucursales
             WHERE empresa_id = ? AND nombre = ? AND (? IS NULL OR id <> ?)
             LIMIT 1`,
            [contexto.empresaId, nombre, sucursalId, sucursalId]
        )

        if (nombreDuplicado.length > 0) {
            await connection.rollback()
            connection.release()
            return { success: false, mensaje: 'Ya existe una sucursal con ese nombre' }
        }

        if (encargadoUsuarioId) {
            const [usuarioRows] = await connection.execute(
                `SELECT id
                 FROM usuarios
                 WHERE id = ? AND empresa_id = ?
                 LIMIT 1`,
                [encargadoUsuarioId, contexto.empresaId]
            )

            if (!usuarioRows.length) {
                await connection.rollback()
                connection.release()
                return { success: false, mensaje: 'El encargado seleccionado no es valido' }
            }
        }

        if (esPrincipal) {
            await connection.execute(
                `UPDATE sucursales
                 SET es_principal = FALSE
                 WHERE empresa_id = ?`,
                [contexto.empresaId]
            )
        }

        let credencialesGeneradas = null

        if (sucursalId) {
            await connection.execute(
                `UPDATE sucursales
                 SET codigo = ?, nombre = ?, telefono = ?, email = ?, direccion = ?, ciudad = ?,
                     moneda_id = ?, encargado_usuario_id = ?, es_principal = ?, activa = ?, notas = ?
                 WHERE id = ? AND empresa_id = ?`,
                [
                    codigo,
                    nombre,
                    telefono || null,
                    email || null,
                    direccion || null,
                    ciudad || null,
                    monedaId,
                    encargadoUsuarioId,
                    esPrincipal,
                    activa,
                    notas || null,
                    sucursalId,
                    contexto.empresaId
                ]
            )
        } else {
            const moduloPosId = await obtenerModuloPosId(connection)
            await habilitarModuloPosEmpresa(connection, contexto.empresaId, moduloPosId)

            const [result] = await connection.execute(
                `INSERT INTO sucursales (
                    empresa_id, codigo, nombre, telefono, email, direccion, ciudad,
                    moneda_id, encargado_usuario_id, es_principal, activa, notas
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    contexto.empresaId,
                    codigo,
                    nombre,
                    telefono || null,
                    email || null,
                    direccion || null,
                    ciudad || null,
                    monedaId,
                    encargadoUsuarioId,
                    esPrincipal,
                    activa,
                    notas || null
                ]
            )

            const sucursalNuevaId = Number(result.insertId)

            const usuarioAuto = await crearUsuarioSucursalAutomatico(connection, {
                empresaId: contexto.empresaId,
                nombreSucursal: nombre,
                codigoSucursal: codigo,
                emailSucursal: email
            })

            credencialesGeneradas = {
                sucursalId: sucursalNuevaId,
                nombre: usuarioAuto.nombre,
                email: usuarioAuto.email,
                cedula: usuarioAuto.cedula,
                password: usuarioAuto.password,
                tipo: usuarioAuto.tipo,
                system_mode: usuarioAuto.system_mode
            }

            await connection.execute(
                `INSERT INTO usuarios_sucursales (empresa_id, usuario_id, sucursal_id, rol_sucursal, activo)
                 VALUES (?, ?, ?, 'admin', TRUE)
                 ON DUPLICATE KEY UPDATE
                    rol_sucursal = VALUES(rol_sucursal),
                    activo = TRUE,
                    fecha_actualizacion = CURRENT_TIMESTAMP`,
                [contexto.empresaId, usuarioAuto.usuarioId, sucursalNuevaId]
            )

            if (!encargadoUsuarioId) {
                await connection.execute(
                    `UPDATE sucursales
                     SET encargado_usuario_id = ?
                     WHERE id = ? AND empresa_id = ?`,
                    [usuarioAuto.usuarioId, sucursalNuevaId, contexto.empresaId]
                )
            }

            if (encargadoUsuarioId) {
                await connection.execute(
                    `INSERT INTO usuarios_sucursales (empresa_id, usuario_id, sucursal_id, rol_sucursal, activo)
                     VALUES (?, ?, ?, 'encargado', TRUE)
                     ON DUPLICATE KEY UPDATE
                        rol_sucursal = VALUES(rol_sucursal),
                        activo = TRUE,
                        fecha_actualizacion = CURRENT_TIMESTAMP`,
                    [contexto.empresaId, encargadoUsuarioId, sucursalNuevaId]
                )
            }

            await connection.execute(
                `UPDATE sucursales
                 SET fecha_actualizacion = CURRENT_TIMESTAMP
                 WHERE id = ? AND empresa_id = ?`,
                [sucursalNuevaId, contexto.empresaId]
            )

            await connection.commit()
            connection.release()

            return {
                success: true,
                mensaje: 'Sucursal creada correctamente. Se habilito POS y se genero usuario de acceso.',
                credenciales: credencialesGeneradas
            }
        }

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: sucursalId ? 'Sucursal actualizada correctamente' : 'Sucursal creada correctamente'
        }
    } catch (error) {
        console.error('Error en guardarSucursal:', error)
        if (connection) {
            await rollbackYReleaseSeguro(connection)
        }
        const detalle = error?.sqlMessage || error?.message || ''
        return {
            success: false,
            mensaje: detalle
                ? `No se pudo guardar la sucursal: ${detalle}`
                : 'No se pudo guardar la sucursal'
        }
    }
}

export async function cambiarEstadoSucursal(payload = {}) {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const sucursalId = Number(payload.sucursalId)
        const activa = Boolean(payload.activa)

        if (!sucursalId) return { success: false, mensaje: 'Sucursal invalida' }

        connection = await db.getConnection()

        const [rows] = await connection.execute(
            `SELECT es_principal
             FROM sucursales
             WHERE id = ? AND empresa_id = ?
             LIMIT 1`,
            [sucursalId, contexto.empresaId]
        )

        if (!rows.length) {
            connection.release()
            return { success: false, mensaje: 'Sucursal no encontrada' }
        }

        if (rows[0].es_principal && !activa) {
            connection.release()
            return { success: false, mensaje: 'No puedes desactivar la sucursal principal' }
        }

        await connection.execute(
            `UPDATE sucursales
             SET activa = ?, fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE id = ? AND empresa_id = ?`,
            [activa, sucursalId, contexto.empresaId]
        )

        connection.release()
        return { success: true, mensaje: activa ? 'Sucursal activada' : 'Sucursal desactivada' }
    } catch (error) {
        console.error('Error en cambiarEstadoSucursal:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo cambiar el estado' }
    }
}

export async function eliminarSucursal(payload = {}) {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const sucursalId = Number(payload.sucursalId)
        if (!sucursalId) return { success: false, mensaje: 'Sucursal invalida' }

        connection = await db.getConnection()
        await connection.beginTransaction()

        const [rows] = await connection.execute(
            `SELECT id, es_principal
             FROM sucursales
             WHERE id = ? AND empresa_id = ?
             LIMIT 1`,
            [sucursalId, contexto.empresaId]
        )

        if (!rows.length) {
            await connection.rollback()
            connection.release()
            return { success: false, mensaje: 'Sucursal no encontrada' }
        }

        if (Boolean(rows[0].es_principal)) {
            await connection.rollback()
            connection.release()
            return { success: false, mensaje: 'No puedes eliminar la sucursal principal' }
        }

        const uso = await obtenerReferenciasSucursal(connection, sucursalId)
            .then((items) => items.filter((it) => it.tabla !== 'usuarios_sucursales'))

        if (uso.length > 0) {
            const detalle = uso.slice(0, 3).map((u) => `${u.tabla} (${u.total})`).join(', ')
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: `No se puede eliminar: la sucursal tiene datos relacionados en ${detalle}`
            }
        }

        await connection.execute(
            `DELETE FROM usuarios_sucursales
             WHERE empresa_id = ? AND sucursal_id = ?`,
            [contexto.empresaId, sucursalId]
        )

        await connection.execute(
            `UPDATE usuarios
             SET activo = FALSE
             WHERE empresa_id = ?
                             AND tipo IN ('sucursales', 'admin')
               AND system_mode = 'POS'
                             AND cedula LIKE 'SUC%'
               AND id NOT IN (
                    SELECT DISTINCT usuario_id
                    FROM usuarios_sucursales
                    WHERE empresa_id = ?
               )`,
            [contexto.empresaId, contexto.empresaId]
        )

        await connection.execute(
            `DELETE FROM sucursales
             WHERE id = ? AND empresa_id = ?`,
            [sucursalId, contexto.empresaId]
        )

        await connection.commit()
        connection.release()

        return { success: true, mensaje: 'Sucursal eliminada correctamente' }
    } catch (error) {
        console.error('Error en eliminarSucursal:', error)
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        return { success: false, mensaje: 'No se pudo eliminar la sucursal' }
    }
}

export async function regenerarPasswordUsuarioSucursal(payload = {}) {
    let connection

    try {
        const contexto = await obtenerContextoSesion()
        if (!contexto) return { success: false, mensaje: 'Sesion invalida' }

        const sucursalId = Number(payload.sucursalId)
        if (!sucursalId) return { success: false, mensaje: 'Sucursal invalida' }

        connection = await db.getConnection()

        const [sucursalRows] = await connection.execute(
            `SELECT id, nombre, encargado_usuario_id
             FROM sucursales
             WHERE id = ? AND empresa_id = ?
             LIMIT 1`,
            [sucursalId, contexto.empresaId]
        )

        if (!sucursalRows.length) {
            connection.release()
            return { success: false, mensaje: 'Sucursal no encontrada' }
        }

        let usuarioIdObjetivo = Number(sucursalRows[0].encargado_usuario_id || 0)

        if (!usuarioIdObjetivo) {
            const [relRows] = await connection.execute(
                `SELECT us.usuario_id
                 FROM usuarios_sucursales us
                 INNER JOIN usuarios u ON u.id = us.usuario_id
                 WHERE us.empresa_id = ?
                   AND us.sucursal_id = ?
                   AND us.activo = TRUE
                                     AND u.tipo IN ('sucursales', 'admin')
                                     AND u.system_mode = 'POS'
                 ORDER BY CASE us.rol_sucursal WHEN 'admin' THEN 0 WHEN 'encargado' THEN 1 ELSE 2 END
                 LIMIT 1`,
                [contexto.empresaId, sucursalId]
            )

            if (relRows.length) {
                usuarioIdObjetivo = Number(relRows[0].usuario_id)
            }
        }

        if (!usuarioIdObjetivo) {
            connection.release()
            return { success: false, mensaje: 'Esta sucursal no tiene usuario asociado para regenerar clave' }
        }

        const [usuarioRows] = await connection.execute(
            `SELECT id, nombre, email, cedula
             FROM usuarios
             WHERE id = ?
               AND empresa_id = ?
                             AND tipo IN ('sucursales', 'admin')
                             AND system_mode = 'POS'
             LIMIT 1`,
            [usuarioIdObjetivo, contexto.empresaId]
        )

        if (!usuarioRows.length) {
            connection.release()
            return { success: false, mensaje: 'El usuario asociado no es valido para regenerar clave' }
        }

        const nuevaPassword = generarPasswordAleatoria(12)
        const passwordHash = await bcrypt.hash(nuevaPassword, 10)

        await connection.execute(
            `UPDATE usuarios
             SET password = ?,
                 activo = TRUE,
                 fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE id = ? AND empresa_id = ?`,
            [passwordHash, usuarioIdObjetivo, contexto.empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Contrasena regenerada correctamente',
            credenciales: {
                sucursalId,
                nombre: usuarioRows[0].nombre,
                email: usuarioRows[0].email,
                cedula: usuarioRows[0].cedula,
                password: nuevaPassword,
                tipo: 'admin',
                system_mode: 'POS'
            }
        }
    } catch (error) {
        console.error('Error en regenerarPasswordUsuarioSucursal:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'No se pudo regenerar la contrasena' }
    }
}

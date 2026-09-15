"use server"
import db from "@/_DB/db"
import { cookies } from 'next/headers'

async function getEmpresaId() {
    const cookieStore = await cookies()
    return cookieStore.get('empresaId')?.value
}

export async function obtenerDatosEmpresa() {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }
        connection = await db.getConnection()
        const [rows] = await connection.execute(
            `SELECT moneda, simbolo_moneda, impuesto_porcentaje, nombre_empresa, direccion, telefono, email, rnc FROM empresas WHERE id = ?`,
            [empresaId]
        )
        connection.release()
        const e = rows[0]
        return {
            success: true,
            empresa: {
                moneda: e?.moneda || 'DOP',
                simbolo_moneda: e?.simbolo_moneda || 'RD$',
                locale: e?.moneda === 'USD' ? 'en-US' : 'es-DO',
                itbis_incluido: true,
                nombre: e?.nombre_empresa || '',
                direccion: e?.direccion || '',
                telefono: e?.telefono || '',
                email: e?.email || '',
                rnc: e?.rnc || ''
            }
        }
    } catch (error) {
        console.error('obtenerDatosEmpresa:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function obtenerContratoParaEditar(id) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()

        const [contratos] = await connection.execute(
            `SELECT c.id, c.numero, c.estado, c.notas,
                    c.monto_financiado, c.monto_inicial, c.cuota_mensual,
                    c.saldo_pendiente, c.fecha_inicio, c.fecha_fin,
                    c.meses, c.frecuencia, c.tasa_interes,
                    cl.nombre as cliente_nombre, cl.apellidos as cliente_apellidos,
                    p.nombre as plan_nombre
             FROM fin_contratos c
             LEFT JOIN clientes cl ON c.cliente_id = cl.id
             LEFT JOIN fin_planes p ON c.plan_id = p.id
             WHERE c.id = ? AND c.empresa_id = ?`,
            [id, empresaId]
        )

        if (!contratos.length) {
            connection.release()
            return { success: false, mensaje: 'Contrato no encontrado' }
        }

        const [fiadores] = await connection.execute(
            `SELECT * FROM fin_fiadores WHERE contrato_id = ? LIMIT 1`,
            [id]
        )

        const [activos] = await connection.execute(
            `SELECT * FROM fin_contrato_activos WHERE contrato_id = ? AND empresa_id = ?`,
            [id, empresaId]
        )

        connection.release()
        return {
            success: true,
            contrato: contratos[0],
            fiador: fiadores[0] || null,
            activos,
        }
    } catch (error) {
        console.error('obtenerContratoParaEditar:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function actualizarContrato(id, datos) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        const estadosValidos = ['activo', 'pagado', 'incumplido', 'reestructurado', 'cancelado']
        if (!estadosValidos.includes(datos.estado))
            return { success: false, mensaje: 'Estado invalido' }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            await connection.execute(
                `UPDATE fin_contratos SET estado = ?, notas = ? WHERE id = ? AND empresa_id = ?`,
                [datos.estado, datos.notas || null, id, empresaId]
            )

            const tieneFiador = datos.fiador_nombre?.trim()

            if (datos.fiador_id) {
                if (tieneFiador) {
                    await connection.execute(
                        `UPDATE fin_fiadores
                         SET nombre = ?, cedula = ?, telefono = ?, email = ?, direccion = ?
                         WHERE id = ? AND contrato_id = ?`,
                        [
                            datos.fiador_nombre,
                            datos.fiador_cedula    || null,
                            datos.fiador_telefono  || null,
                            datos.fiador_email     || null,
                            datos.fiador_direccion || null,
                            datos.fiador_id,
                            id,
                        ]
                    )
                } else {
                    await connection.execute(
                        `DELETE FROM fin_fiadores WHERE id = ? AND contrato_id = ?`,
                        [datos.fiador_id, id]
                    )
                }
            } else if (tieneFiador) {
                await connection.execute(
                    `INSERT INTO fin_fiadores (contrato_id, nombre, cedula, telefono, email, direccion)
                     VALUES (?,?,?,?,?,?)`,
                    [
                        id,
                        datos.fiador_nombre,
                        datos.fiador_cedula    || null,
                        datos.fiador_telefono  || null,
                        datos.fiador_email     || null,
                        datos.fiador_direccion || null,
                    ]
                )
            }

            if (datos.activos_eliminados?.length) {
                for (const aid of datos.activos_eliminados) {
                    await connection.execute(
                        `DELETE FROM fin_contrato_activos
                         WHERE id = ? AND contrato_id = ? AND empresa_id = ?`,
                        [aid, id, empresaId]
                    )
                }
            }

            for (const a of (datos.activos || [])) {
                if (!a.nombre?.trim()) continue
                if (a.id) {
                    await connection.execute(
                        `UPDATE fin_contrato_activos
                         SET nombre = ?, descripcion = ?, serial = ?, valor = ?
                         WHERE id = ? AND contrato_id = ? AND empresa_id = ?`,
                        [
                            a.nombre,
                            a.descripcion || null,
                            a.serial      || null,
                            parseFloat(a.valor || 0),
                            a.id, id, empresaId,
                        ]
                    )
                } else {
                    await connection.execute(
                        `INSERT INTO fin_contrato_activos
                             (contrato_id, empresa_id, nombre, descripcion, serial, valor, imagen)
                         VALUES (?,?,?,?,?,?,NULL)`,
                        [
                            id, empresaId,
                            a.nombre,
                            a.descripcion || null,
                            a.serial      || null,
                            parseFloat(a.valor || 0),
                        ]
                    )
                }
            }

            await connection.commit()
            connection.release()
            return { success: true, mensaje: 'Contrato actualizado' }

        } catch (err) {
            await connection.rollback()
            throw err
        }
    } catch (error) {
        console.error('actualizarContrato:', error)
        if (connection) {
            try { await connection.rollback() } catch {}
            connection.release()
        }
        return { success: false, mensaje: error.message }
    }
}
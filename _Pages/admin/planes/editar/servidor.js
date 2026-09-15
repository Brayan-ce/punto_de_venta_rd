"use server"
import db from "@/_DB/db"
import { cookies } from 'next/headers'

async function getEmpresaId() {
    const cookieStore = await cookies()
    return cookieStore.get('empresaId')?.value
}

export async function obtenerPlanPorId(id) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()

        const [planes] = await connection.execute(
            `SELECT * FROM fin_planes WHERE id = ? AND empresa_id = ?`,
            [id, empresaId]
        )

        if (!planes.length) {
            connection.release()
            return { success: false, mensaje: 'Plan no encontrado' }
        }

        const [opciones] = await connection.execute(
            `SELECT * FROM fin_plan_opciones WHERE plan_id = ? ORDER BY meses ASC`,
            [id]
        )

        const [statsContratos] = await connection.execute(
            `SELECT
                COUNT(*) as total_contratos,
                SUM(estado = 'activo')  as contratos_activos,
                SUM(estado = 'pagado')  as contratos_pagados,
                COALESCE(SUM(monto_financiado), 0) as total_financiado
             FROM fin_contratos
             WHERE plan_id = ? AND empresa_id = ?`,
            [id, empresaId]
        )

        connection.release()
        return {
            success: true,
            plan: planes[0],
            opciones,
            stats: statsContratos[0],
        }
    } catch (error) {
        console.error('obtenerPlanPorId:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function actualizarPlan(id, datos) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        if (!datos.nombre?.trim()) return { success: false, mensaje: 'El nombre es requerido' }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            await connection.execute(
                `UPDATE fin_planes SET
                     nombre = ?, codigo = ?, descripcion = ?, frecuencia = ?,
                     tasa_interes = ?, mora_pct = ?, dias_gracia = ?,
                     monto_minimo = ?, monto_maximo = ?,
                     requiere_fiador = ?, permite_anticipado = ?
                 WHERE id = ? AND empresa_id = ?`,
                [
                    datos.nombre.trim(),
                    datos.codigo?.trim()      || null,
                    datos.descripcion?.trim() || null,
                    datos.frecuencia,
                    parseFloat(datos.tasa_interes || 0),
                    parseFloat(datos.mora_pct     || 5),
                    parseInt(datos.dias_gracia    || 5),
                    parseFloat(datos.monto_minimo || 0),
                    datos.monto_maximo ? parseFloat(datos.monto_maximo) : null,
                    datos.requiere_fiador    ? 1 : 0,
                    datos.permite_anticipado ? 1 : 0,
                    id, empresaId,
                ]
            )

            // Eliminar plazos marcados
            if (datos.opciones_eliminadas?.length) {
                for (const oid of datos.opciones_eliminadas) {
                    await connection.execute(
                        `DELETE FROM fin_plan_opciones WHERE id = ? AND plan_id = ?`,
                        [oid, id]
                    )
                }
            }

            // Insertar o actualizar plazos
            for (const op of (datos.opciones || [])) {
                if (!op.meses || parseInt(op.meses) <= 0) continue
                if (op.id) {
                    await connection.execute(
                        `UPDATE fin_plan_opciones
                         SET meses = ?, inicial_pct = ?, tipo = ?
                         WHERE id = ? AND plan_id = ?`,
                        [
                            parseInt(op.meses),
                            parseFloat(op.inicial_pct || 0),
                            op.tipo || 'credito',
                            op.id, id,
                        ]
                    )
                } else {
                    await connection.execute(
                        `INSERT INTO fin_plan_opciones (plan_id, meses, inicial_pct, tipo)
                         VALUES (?,?,?,?)`,
                        [
                            id,
                            parseInt(op.meses),
                            parseFloat(op.inicial_pct || 0),
                            op.tipo || 'credito',
                        ]
                    )
                }
            }

            await connection.commit()
            connection.release()
            return { success: true, mensaje: 'Plan actualizado exitosamente' }

        } catch (err) {
            await connection.rollback()
            throw err
        }
    } catch (error) {
        console.error('actualizarPlan:', error)
        if (connection) {
            try { await connection.rollback() } catch {}
            connection.release()
        }
        return { success: false, mensaje: error.message }
    }
}
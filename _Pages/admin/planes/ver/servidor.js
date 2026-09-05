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

export async function toggleActivoPlan(id, activo) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        await connection.execute(
            `UPDATE fin_planes SET activo = ? WHERE id = ? AND empresa_id = ?`,
            [activo ? 1 : 0, id, empresaId]
        )
        connection.release()
        return { success: true }
    } catch (error) {
        console.error('toggleActivoPlan:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}
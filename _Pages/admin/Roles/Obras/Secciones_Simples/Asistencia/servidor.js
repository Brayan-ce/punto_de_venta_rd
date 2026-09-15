"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerMonedaEmpresa() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        const [empresa] = await connection.query(
            'SELECT simbolo_moneda, moneda FROM empresas WHERE id = ?',
            [empresaId]
        )

        connection.release()

        const simboloMoneda = empresa[0]?.simbolo_moneda || 'RD$'
        const codigoMoneda = empresa[0]?.moneda || 'DOP'

        return {
            success: true,
            simbolo_moneda: simboloMoneda,
            codigo_moneda: codigoMoneda
        }
    } catch (error) {
        console.error('Error al obtener moneda:', error)
        if (connection) connection.release()
        return {
            success: false,
            mensaje: 'Error al obtener moneda'
        }
    }
}

export async function obtenerObrasActivas() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [obras] = await connection.execute(
            `SELECT id, codigo_obra, nombre, color_identificacion
             FROM obras_simples
             WHERE empresa_id = ? AND estado = 'activa'
             ORDER BY nombre`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            obras
        }
    } catch (error) {
        console.error('Error al obtener obras activas:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar las obras'
        }
    }
}

export async function obtenerTrabajadoresObra(obraId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [trabajadores] = await connection.execute(
            `SELECT 
                ts.id,
                ts.nombre,
                ts.apellido,
                ts.especialidad,
                ts.salario_diario
             FROM trabajadores_simples ts
             INNER JOIN asignaciones_obra_simple aos ON ts.id = aos.trabajador_id
             WHERE aos.obra_id = ? AND aos.activo = TRUE AND ts.activo = TRUE
             ORDER BY ts.nombre, ts.apellido`,
            [obraId]
        )

        connection.release()

        return {
            success: true,
            trabajadores
        }
    } catch (error) {
        console.error('Error al obtener trabajadores:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar los trabajadores'
        }
    }
}

export async function obtenerAsistenciasDia(obraId, fecha) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [asistencias] = await connection.execute(
            `SELECT 
                trabajador_id,
                presente,
                horas_trabajadas,
                observaciones
             FROM asistencias_simple
             WHERE obra_id = ? AND fecha = ?`,
            [obraId, fecha]
        )

        connection.release()

        return {
            success: true,
            asistencias
        }
    } catch (error) {
        console.error('Error al obtener asistencias:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar las asistencias'
        }
    }
}

export async function guardarAsistencia(obraId, fecha, asistencias) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        await connection.execute(
            'DELETE FROM asistencias_simple WHERE obra_id = ? AND fecha = ?',
            [obraId, fecha]
        )

        for (const asistencia of asistencias) {
            const montoPagar = asistencia.presente 
                ? await calcularMontoPagar(connection, asistencia.trabajador_id, asistencia.horas)
                : 0

            await connection.execute(
                `INSERT INTO asistencias_simple (
                    obra_id,
                    trabajador_id,
                    fecha,
                    presente,
                    horas_trabajadas,
                    monto_pagar,
                    observaciones,
                    registrado_por
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    obraId,
                    asistencia.trabajador_id,
                    fecha,
                    asistencia.presente,
                    asistencia.horas,
                    montoPagar,
                    asistencia.observaciones || null,
                    userId
                ]
            )
        }

        connection.release()

        return {
            success: true,
            mensaje: 'Asistencia guardada exitosamente'
        }
    } catch (error) {
        console.error('Error al guardar asistencia:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al guardar la asistencia'
        }
    }
}

async function calcularMontoPagar(connection, trabajadorId, horas) {
    try {
        const [trabajador] = await connection.execute(
            'SELECT salario_diario, tipo_pago FROM trabajadores_simples WHERE id = ?',
            [trabajadorId]
        )

        if (trabajador.length === 0) return 0

        const { salario_diario, tipo_pago } = trabajador[0]

        if (tipo_pago === 'diario') {
            return (salario_diario / 8) * horas
        }

        return salario_diario
    } catch (error) {
        console.error('Error al calcular monto:', error)
        return 0
    }
}
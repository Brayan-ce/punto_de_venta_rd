"use server"

import db from "@/_DB/db"
import { obtenerUsuarioActual, validarPermisoObras } from '../lib'
import { calcularPorcentajeEjecutado } from '../../core/construction/calculos'

/**
 * Obtener estadísticas de obra
 */
export async function obtenerEstadisticasObra(obraId) {
    let connection
    try {
        const usuario = await obtenerUsuarioActual()
        validarPermisoObras(usuario)

        connection = await db.getConnection()

        // Verificar que la obra existe
        const [obra] = await connection.execute(
            `SELECT * FROM obras WHERE id = ? AND empresa_id = ?`,
            [obraId, usuario.empresaId]
        )

        if (obra.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Obra no encontrada'
            }
        }

        const obraData = obra[0]

        // Costos por categoría - Mano de obra
        let costoManoObra = 0
        try {
            const [manoObra] = await connection.execute(
                `SELECT COALESCE(SUM(costo_total), 0) as total
                 FROM asignaciones_trabajadores
                 WHERE tipo_destino = 'obra'
                 AND destino_id = ?
                 AND estado = 'finalizada'`,
                [obraId]
            )
            costoManoObra = Number(manoObra[0]?.total || 0)
        } catch (err) {
            // Usar costo_mano_obra de la obra si existe
            costoManoObra = Number(obraData.costo_mano_obra || 0)
        }

        // Costos por categoría - Materiales
        let costoMateriales = 0
        try {
            const [materiales] = await connection.execute(
                `SELECT COALESCE(SUM(monto_total), 0) as total
                 FROM compras_obra
                 WHERE tipo_destino = 'obra'
                 AND destino_id = ?
                 AND estado != 'anulada'`,
                [obraId]
            )
            costoMateriales = Number(materiales[0]?.total || 0)
        } catch (err) {
            // Usar costo_materiales de la obra si existe
            costoMateriales = Number(obraData.costo_materiales || 0)
        }

        // Días trabajados
        let diasTrabajados = 0
        try {
            const [dias] = await connection.execute(
                `SELECT COUNT(DISTINCT fecha) as total
                 FROM bitacora_diaria
                 WHERE tipo_destino = 'obra'
                 AND destino_id = ?`,
                [obraId]
            )
            diasTrabajados = Number(dias[0]?.total || 0)
        } catch (err) {
            // Calcular días desde fecha_inicio hasta hoy si no hay bitácoras
            if (obraData.fecha_inicio) {
                const inicio = new Date(obraData.fecha_inicio)
                const hoy = new Date()
                diasTrabajados = Math.ceil((hoy - inicio) / (1000 * 60 * 60 * 24))
            }
        }

        // Trabajadores únicos
        let trabajadoresUnicos = 0
        try {
            const [trabajadores] = await connection.execute(
                `SELECT COUNT(DISTINCT trabajador_id) as total
                 FROM asignaciones_trabajadores
                 WHERE tipo_destino = 'obra'
                 AND destino_id = ?`,
                [obraId]
            )
            trabajadoresUnicos = Number(trabajadores[0]?.total || 0)
        } catch (err) {
            trabajadoresUnicos = 0
        }

        // Total de horas
        let horasTotales = 0
        try {
            const [horas] = await connection.execute(
                `SELECT COALESCE(SUM(horas_trabajadas), 0) as total
                 FROM asignaciones_trabajadores
                 WHERE tipo_destino = 'obra'
                 AND destino_id = ?
                 AND estado = 'finalizada'`,
                [obraId]
            )
            horasTotales = Number(horas[0]?.total || 0)
        } catch (err) {
            horasTotales = 0
        }

        // Calcular proyecciones
        const presupuesto = Number(obraData.presupuesto_aprobado || 0)
        const costoTotal = costoManoObra + costoMateriales
        const porcentajeEjecutado = calcularPorcentajeEjecutado(costoTotal, presupuesto)
        const porcentajeAvance = Number(obraData.porcentaje_avance || porcentajeEjecutado)
        
        // Proyección de costo final
        let costoProyectado = costoTotal
        if (porcentajeAvance > 0 && porcentajeAvance < 100) {
            costoProyectado = (costoTotal / porcentajeAvance) * 100
        }

        connection.release()

        return {
            success: true,
            estadisticas: {
                presupuesto,
                costo_total: costoTotal,
                costo_mano_obra: costoManoObra,
                costo_materiales: costoMateriales,
                porcentaje_ejecutado: porcentajeEjecutado,
                porcentaje_avance: porcentajeAvance,
                saldo_disponible: presupuesto - costoTotal,
                dias_trabajados: diasTrabajados,
                trabajadores_unicos: trabajadoresUnicos,
                horas_totales: horasTotales,
                costo_proyectado: costoProyectado,
                diferencia_proyeccion: costoProyectado - presupuesto
            }
        }
    } catch (error) {
        console.error('Error al obtener estadísticas:', error)
        if (connection) connection.release()
        return {
            success: false,
            mensaje: error.message || 'Error al obtener estadísticas'
        }
    }
}


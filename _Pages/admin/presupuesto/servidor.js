"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { calcularPorcentajeEjecutado, calcularSaldoPresupuesto, calcularDiasRestantes } from '../core/construction/calculos'
import { obtenerSeveridadAlerta, REGLAS_NEGOCIO } from '../core/construction/reglas'
import { obtenerObras } from '../obras/servidor'

export async function obtenerControlPresupuestario(obraId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        
        // 1. Obtener datos de la obra
        const [obras] = await connection.query(
            `SELECT o.*,
                    DATEDIFF(o.fecha_fin_estimada, CURDATE()) as dias_restantes,
                    DATEDIFF(o.fecha_fin_estimada, o.fecha_inicio) as dias_totales
             FROM obras o
             WHERE o.id = ? AND o.empresa_id = ?`,
            [obraId, empresaId]
        )
        
        if (obras.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Obra no encontrada' }
        }
        
        const obra = obras[0]
        
        // 2. Calcular costos por categoría
        // Costo de materiales (compras)
        const [compras] = await connection.query(
            `SELECT COALESCE(SUM(total), 0) as total_materiales
             FROM compras_obra
             WHERE tipo_destino = 'obra' 
               AND destino_id = ?
               AND estado != 'anulada'
               AND empresa_id = ?`,
            [obraId, empresaId]
        )
        
        // Costo de mano de obra (asignaciones)
        const [manoObra] = await connection.query(
            `SELECT COALESCE(SUM(a.costo_calculado), 0) as total_mano_obra
             FROM asignaciones_trabajadores a
             WHERE a.tipo_destino = 'obra'
               AND a.destino_id = ?
               AND a.estado = 'activo'
               AND a.empresa_id = ?`,
            [obraId, empresaId]
        )
        
        // Costo de servicios (si hay tabla de servicios)
        const costoServicios = 0 // TODO: Implementar cuando se cree módulo de servicios
        
        // Costo de imprevistos (compras marcadas como imprevistas)
        const [imprevistos] = await connection.query(
            `SELECT COALESCE(SUM(total), 0) as total_imprevistos
             FROM compras_obra
             WHERE tipo_destino = 'obra'
               AND destino_id = ?
               AND tipo_compra = 'imprevista'
               AND estado != 'anulada'
               AND empresa_id = ?`,
            [obraId, empresaId]
        )
        
        const costoMateriales = parseFloat(compras[0].total_materiales || 0)
        const costoManoObra = parseFloat(manoObra[0].total_mano_obra || 0)
        const costoImprevistos = parseFloat(imprevistos[0].total_imprevistos || 0)
        const costoTotal = costoMateriales + costoManoObra + costoServicios + costoImprevistos
        
        const presupuesto = parseFloat(obra.presupuesto_aprobado || 0)
        const porcentajeEjecutado = calcularPorcentajeEjecutado(costoTotal, presupuesto)
        const saldoDisponible = calcularSaldoPresupuesto(presupuesto, costoTotal)
        
        // Calcular tasa de consumo diaria
        const diasTranscurridos = obra.dias_totales - obra.dias_restantes
        const tasaConsumoDiaria = diasTranscurridos > 0 ? costoTotal / diasTranscurridos : 0
        
        // Proyección final
        const proyeccionFinal = costoTotal + (tasaConsumoDiaria * obra.dias_restantes)
        const sobrecostoProyectado = proyeccionFinal - presupuesto
        
        // Índice CPI (Cost Performance Index)
        const valorGanado = presupuesto * (porcentajeEjecutado / 100)
        const indiceCPI = costoTotal > 0 ? valorGanado / costoTotal : 1
        
        connection.release()
        
        return {
            success: true,
            control: {
                obra: {
                    id: obra.id,
                    nombre: obra.nombre,
                    codigo_obra: obra.codigo_obra,
                    presupuesto_aprobado: presupuesto,
                    fecha_inicio: obra.fecha_inicio,
                    fecha_fin_estimada: obra.fecha_fin_estimada,
                    dias_restantes: obra.dias_restantes,
                    dias_totales: obra.dias_totales
                },
                costos: {
                    materiales: costoMateriales,
                    mano_obra: costoManoObra,
                    servicios: costoServicios,
                    imprevistos: costoImprevistos,
                    total: costoTotal
                },
                presupuesto: {
                    total: presupuesto,
                    ejecutado: costoTotal,
                    porcentaje: porcentajeEjecutado,
                    saldo: saldoDisponible
                },
                proyeccion: {
                    tasa_consumo_diaria: tasaConsumoDiaria,
                    costo_proyectado: proyeccionFinal,
                    sobrecosto: sobrecostoProyectado,
                    tiene_sobrecosto: sobrecostoProyectado > 0
                },
                indicadores: {
                    cpi: indiceCPI,
                    dias_transcurridos: diasTranscurridos
                }
            }
        }
    } catch (error) {
        console.error('Error al obtener control presupuestario:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar control presupuestario' }
    }
}

export async function obtenerAlertasPresupuesto(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        
        let query = `
            SELECT pa.*,
                   o.nombre as obra_nombre,
                   o.codigo_obra
            FROM presupuesto_alertas pa
            LEFT JOIN obras o ON pa.tipo_destino = 'obra' AND pa.destino_id = o.id
            WHERE pa.empresa_id = ?
        `
        const params = [empresaId]
        
        if (filtros.estado) {
            query += ' AND pa.estado = ?'
            params.push(filtros.estado)
        }
        
        if (filtros.severidad) {
            query += ' AND pa.severidad = ?'
            params.push(filtros.severidad)
        }
        
        if (filtros.obra_id) {
            query += ' AND pa.tipo_destino = "obra" AND pa.destino_id = ?'
            params.push(filtros.obra_id)
        }
        
        query += ' ORDER BY pa.fecha_generacion DESC'
        
        const [alertas] = await connection.query(query, params)
        connection.release()
        
        return { success: true, alertas }
    } catch (error) {
        console.error('Error al obtener alertas:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar alertas' }
    }
}

export async function obtenerCostosSemanales(obraId, semanas = 4) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        
        // Obtener costos agrupados por semana
        const [costos] = await connection.query(
            `SELECT 
                YEARWEEK(fecha_compra) as semana,
                DATE_SUB(DATE(fecha_compra), INTERVAL WEEKDAY(fecha_compra) DAY) as fecha_inicio_semana,
                COALESCE(SUM(total), 0) as costo_real
             FROM compras_obra
             WHERE tipo_destino = 'obra'
               AND destino_id = ?
               AND estado != 'anulada'
               AND empresa_id = ?
             GROUP BY YEARWEEK(fecha_compra)
             ORDER BY semana DESC
             LIMIT ?`,
            [obraId, empresaId, semanas]
        )
        
        // Obtener presupuesto semanal estimado
        const [obra] = await connection.query(
            'SELECT presupuesto_aprobado, fecha_inicio, fecha_fin_estimada FROM obras WHERE id = ?',
            [obraId]
        )
        
        let presupuestoSemanal = 0
        if (obra.length > 0) {
            const diasTotales = Math.ceil((new Date(obra[0].fecha_fin_estimada) - new Date(obra[0].fecha_inicio)) / (1000 * 60 * 60 * 24))
            presupuestoSemanal = (parseFloat(obra[0].presupuesto_aprobado) / diasTotales) * 7
        }
        
        const costosConPresupuesto = costos.map(c => ({
            semana: `Semana ${costos.indexOf(c) + 1}`,
            fecha_inicio: c.fecha_inicio_semana,
            costo: parseFloat(c.costo_real),
            presupuestado: presupuestoSemanal
        }))
        
        connection.release()
        
        return { success: true, costos: costosConPresupuesto }
    } catch (error) {
        console.error('Error al obtener costos semanales:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar costos semanales' }
    }
}

export async function marcarAlertaRevisada(alertaId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        
        await connection.query(
            `UPDATE presupuesto_alertas 
             SET estado = 'revisada',
                 revisada_por = ?,
                 fecha_revision = NOW()
             WHERE id = ? AND empresa_id = ?`,
            [userId, alertaId, empresaId]
        )
        
        connection.release()
        
        return { success: true, mensaje: 'Alerta marcada como revisada' }
    } catch (error) {
        console.error('Error al marcar alerta:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar alerta' }
    }
}


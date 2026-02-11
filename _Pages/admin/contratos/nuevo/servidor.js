"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { crearContratoFinanciamiento } from '../servidor.js'
import { obtenerPlanesFinanciamiento } from '../../planes/servidor.js'

// Re-exportar función de creación desde el servidor principal
export { crearContratoFinanciamiento }

/**
 * Valida el crédito del cliente para un monto requerido
 * @param {number} clienteId - ID del cliente
 * @param {number} montoRequerido - Monto que se necesita financiar
 * @returns {Object} { valido: boolean, error?: string, creditoDisponible?: number, datos?: Object }
 */
export async function validarCreditoCliente(clienteId, montoRequerido) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { valido: false, error: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        const [credito] = await connection.execute(
            `SELECT limite_credito, saldo_utilizado,
                    (limite_credito - saldo_utilizado) as credito_disponible,
                    estado_credito, clasificacion, contratos_activos,
                    max_contratos_activos, score_crediticio
             FROM credito_clientes
             WHERE cliente_id = ? AND empresa_id = ?`,
            [clienteId, empresaId]
        )

        connection.release()

        if (!credito || credito.length === 0) {
            return { 
                valido: false, 
                error: 'Cliente sin límite de crédito asignado. Configure el crédito del cliente primero.' 
            }
        }

        const datosCredito = credito[0]

        // Validar estado del crédito
        if (datosCredito.estado_credito === 'bloqueado' || datosCredito.estado_credito === 'suspendido') {
            return { 
                valido: false, 
                error: `El crédito del cliente está ${datosCredito.estado_credito}. No se pueden crear nuevos contratos.`,
                datos: datosCredito
            }
        }

        // Validar clasificación (no permitir D)
        if (datosCredito.clasificacion === 'D') {
            return { 
                valido: false, 
                error: 'Cliente con clasificación D (Moroso). No se pueden crear nuevos contratos.',
                datos: datosCredito
            }
        }

        // Validar número máximo de contratos activos
        if (datosCredito.contratos_activos >= datosCredito.max_contratos_activos) {
            return { 
                valido: false, 
                error: `El cliente ya tiene ${datosCredito.contratos_activos} contratos activos (máximo: ${datosCredito.max_contratos_activos}).`,
                datos: datosCredito
            }
        }

        // Validar crédito disponible
        const creditoDisponible = parseFloat(datosCredito.credito_disponible || 0)
        if (creditoDisponible < montoRequerido) {
            return { 
                valido: false, 
                error: `Crédito insuficiente. Disponible: ${creditoDisponible.toFixed(2)}, Requerido: ${montoRequerido.toFixed(2)}`,
                creditoDisponible,
                datos: datosCredito
            }
        }

        return { 
            valido: true, 
            creditoDisponible,
            datos: datosCredito
        }

    } catch (error) {
        console.error('Error al validar crédito:', error)
        if (connection) connection.release()
        return { 
            valido: false, 
            error: 'Error al validar crédito del cliente' 
        }
    }
}

/**
 * Obtiene los datos completos de un cliente incluyendo información de crédito
 * @param {number} clienteId - ID del cliente
 * @returns {Object} { success: boolean, cliente?: Object, mensaje?: string }
 */
export async function obtenerDatosCliente(clienteId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        const [clientes] = await connection.execute(
            `SELECT c.*, 
                    cr.limite_credito, 
                    cr.saldo_utilizado,
                    (cr.limite_credito - cr.saldo_utilizado) as credito_disponible,
                    cr.contratos_activos,
                    cr.max_contratos_activos,
                    cr.score_crediticio,
                    cr.clasificacion,
                    cr.estado_credito,
                    cr.fecha_proximo_vencimiento
             FROM clientes c
             LEFT JOIN credito_clientes cr ON c.id = cr.cliente_id AND cr.empresa_id = c.empresa_id
             WHERE c.id = ? AND c.empresa_id = ?`,
            [clienteId, empresaId]
        )

        connection.release()

        if (clientes.length === 0) {
            return { success: false, mensaje: 'Cliente no encontrado' }
        }

        return {
            success: true,
            cliente: clientes[0]
        }

    } catch (error) {
        console.error('Error al obtener datos del cliente:', error)
        if (connection) connection.release()
        return { 
            success: false, 
            mensaje: 'Error al cargar datos del cliente' 
        }
    }
}

/**
 * Obtiene los datos necesarios para crear un contrato
 * @returns {Object} { success: boolean, planes?: Array, clientes?: Array, activos?: Array, mensaje?: string }
 */
export async function obtenerDatosCreacion() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        // Obtener planes activos con plazos incluidos
        const resultadoPlanes = await obtenerPlanesFinanciamiento({ activo: true })
        let planes = resultadoPlanes.success ? resultadoPlanes.planes : []
        
        // Procesar planes para asegurar que los plazos estén parseados correctamente
        planes = planes.map(plan => {
            let plazos = []
            
            try {
                // Intentar parsear el JSON de plazos
                if (plan.plazos && typeof plan.plazos === 'string') {
                    plazos = JSON.parse(plan.plazos)
                } else if (Array.isArray(plan.plazos)) {
                    plazos = plan.plazos
                }
            } catch (e) {
                console.warn('Error al parsear plazos del plan', plan.id, e)
                plazos = []
            }
            
            // Filtrar plazos nulos y solo activos
            plazos = plazos.filter(p => p && p.id !== null && p.activo === 1)
            
            // Ordenar plazos: sugeridos primero, luego por orden, luego por plazo_meses
            plazos.sort((a, b) => {
                if (a.es_sugerido !== b.es_sugerido) {
                    return b.es_sugerido - a.es_sugerido // Sugeridos primero
                }
                if (a.orden !== b.orden) {
                    return a.orden - b.orden
                }
                return a.plazo_meses - b.plazo_meses
            })
            
            return {
                ...plan,
                plazos: plazos,
                tiene_plazos: plazos.length > 0,
                es_legacy: plazos.length === 0 && plan.plazo_meses !== null
            }
        })

        // Obtener clientes activos con información de crédito
        const [clientes] = await connection.execute(
            `SELECT c.id, c.nombre, c.apellidos, c.numero_documento, c.telefono, c.email,
                    c.foto_url,
                    cr.limite_credito, 
                    cr.saldo_utilizado,
                    (cr.limite_credito - cr.saldo_utilizado) as credito_disponible,
                    cr.contratos_activos,
                    cr.max_contratos_activos,
                    cr.score_crediticio,
                    cr.clasificacion,
                    cr.estado_credito,
                    CASE WHEN cr.id IS NULL THEN 0 ELSE 1 END as tiene_credito
             FROM clientes c
             LEFT JOIN credito_clientes cr ON c.id = cr.cliente_id AND cr.empresa_id = c.empresa_id
             WHERE c.empresa_id = ? AND c.estado = 'activo'
             ORDER BY c.nombre, c.apellidos`,
            [empresaId]
        )

        // Obtener equipos (productos rastreables) con sus activos disponibles agrupados
        const [equipos] = await connection.execute(
            `SELECT p.id, p.nombre, p.descripcion, p.precio_venta, p.imagen_url,
                    p.codigo_barras, p.sku,
                    m.nombre as marca, c.nombre as categoria,
                    COUNT(a.id) as activos_disponibles,
                    GROUP_CONCAT(a.id) as activos_ids
             FROM productos p
             INNER JOIN activos_productos a ON p.id = a.producto_id
             LEFT JOIN marcas m ON p.marca_id = m.id
             LEFT JOIN categorias c ON p.categoria_id = c.id
             WHERE p.empresa_id = ? 
             AND p.es_rastreable = 1
             AND p.activo = 1
             AND a.estado = 'en_stock'
             AND a.contrato_financiamiento_id IS NULL
             GROUP BY p.id
             HAVING activos_disponibles > 0
             ORDER BY p.nombre`,
            [empresaId]
        )

        // Obtener todos los activos disponibles para poder seleccionar individualmente
        const [activos] = await connection.execute(
            `SELECT a.id, a.codigo_activo, a.numero_serie, a.vin, a.producto_id,
                    p.nombre as producto_nombre, p.precio_venta, p.imagen_url
             FROM activos_productos a
             LEFT JOIN productos p ON a.producto_id = p.id
             WHERE a.empresa_id = ? 
             AND a.estado = 'en_stock'
             AND a.contrato_financiamiento_id IS NULL
             ORDER BY p.nombre, a.codigo_activo`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            planes,
            clientes,
            equipos,
            activos
        }

    } catch (error) {
        console.error('Error al obtener datos para creación:', error)
        if (connection) connection.release()
        return { 
            success: false, 
            mensaje: 'Error al cargar datos', 
            planes: [],
            clientes: [],
            activos: []
        }
    }
}


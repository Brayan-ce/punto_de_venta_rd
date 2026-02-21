"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { 
    validarMontoFinanciable,
    validarMontoInicial
} from '../core/finance/reglas.js'
import { validarDatosContrato } from '../core/finance/validaciones.js'
import { 
    calcularAmortizacionFrancesa,
    generarCronograma,
    generarCronogramaFechas,
    formatearNumeroContrato,
    tasaAnualAMensual
} from '../core/finance/calculos.js'
import { ESTADOS_CONTRATO } from '../core/finance/estados.js'

/**
 * Obtiene estadísticas y datos para el dashboard de contratos
 * @returns {Object} { success: boolean, estadisticas, contratosRecientes, distribucionEstados, evolucionMensual, alertas }
 */
export async function obtenerDashboardContratos() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        // Estadísticas generales
        const [statsGenerales] = await connection.execute(
            `SELECT 
                COUNT(*) as total_contratos,
                SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as contratos_activos,
                SUM(CASE WHEN estado = 'pagado' THEN 1 ELSE 0 END) as contratos_pagados,
                SUM(CASE WHEN estado = 'incumplido' THEN 1 ELSE 0 END) as contratos_incumplidos,
                SUM(CASE WHEN estado = 'reestructurado' THEN 1 ELSE 0 END) as contratos_reestructurados,
                SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) as contratos_cancelados,
                COALESCE(SUM(monto_financiado), 0) as total_financiado,
                COALESCE(SUM(saldo_pendiente), 0) as total_por_cobrar,
                COALESCE(SUM(monto_pagado), 0) as total_cobrado,
                COALESCE(SUM(total_intereses), 0) as total_intereses,
                COALESCE(AVG(monto_financiado), 0) as promedio_financiado
            FROM contratos_financiamiento
            WHERE empresa_id = ?`,
            [empresaId]
        )

        // Estadísticas de cuotas
        const [statsCuotas] = await connection.execute(
            `SELECT 
                COUNT(*) as total_cuotas,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as cuotas_pendientes,
                SUM(CASE WHEN estado = 'pagada' THEN 1 ELSE 0 END) as cuotas_pagadas,
                SUM(CASE WHEN estado = 'vencida' THEN 1 ELSE 0 END) as cuotas_vencidas,
                SUM(CASE WHEN estado = 'parcial' THEN 1 ELSE 0 END) as cuotas_parciales,
                COALESCE(SUM(CASE WHEN estado = 'vencida' THEN monto_mora ELSE 0 END), 0) as total_mora,
                COALESCE(SUM(CASE WHEN estado IN ('pendiente', 'vencida', 'parcial') THEN total_a_pagar ELSE 0 END), 0) as monto_por_cobrar_cuotas
            FROM cuotas_financiamiento
            WHERE empresa_id = ?`,
            [empresaId]
        )

        // Cuotas próximas a vencer (próximos 7 días)
        const [cuotasProximas] = await connection.execute(
            `SELECT COUNT(*) as cantidad
            FROM cuotas_financiamiento
            WHERE empresa_id = ? 
            AND estado = 'pendiente'
            AND fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`,
            [empresaId]
        )

        // Contratos recientes (últimos 10)
        const [contratosRecientes] = await connection.execute(
            `SELECT c.id, c.numero_contrato, c.monto_financiado, c.saldo_pendiente,
                    c.estado, c.fecha_contrato, c.numero_cuotas, c.cuotas_pagadas,
                    cl.nombre as cliente_nombre,
                    cl.apellidos as cliente_apellidos,
                    cl.foto_url as cliente_foto,
                    p.nombre as plan_nombre,
                    GROUP_CONCAT(DISTINCT CONCAT(pr.nombre, ' - ', a.numero_serie) SEPARATOR ', ') as equipos_activos,
                    GROUP_CONCAT(DISTINCT pr.imagen_url SEPARATOR ',') as equipos_imagenes
            FROM contratos_financiamiento c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN planes_financiamiento p ON c.plan_id = p.id
            LEFT JOIN activos_productos a ON c.id = a.contrato_financiamiento_id
            LEFT JOIN productos pr ON a.producto_id = pr.id
            WHERE c.empresa_id = ?
            GROUP BY c.id
            ORDER BY c.fecha_creacion DESC
            LIMIT 10`,
            [empresaId]
        )

        // Distribución por estado para gráfica de dona
        const distribucionEstados = [
            { nombre: 'Activos', valor: parseInt(statsGenerales[0]?.contratos_activos || 0), color: '#10b981' },
            { nombre: 'Pagados', valor: parseInt(statsGenerales[0]?.contratos_pagados || 0), color: '#3b82f6' },
            { nombre: 'Incumplidos', valor: parseInt(statsGenerales[0]?.contratos_incumplidos || 0), color: '#ef4444' },
            { nombre: 'Reestructurados', valor: parseInt(statsGenerales[0]?.contratos_reestructurados || 0), color: '#f59e0b' },
            { nombre: 'Cancelados', valor: parseInt(statsGenerales[0]?.contratos_cancelados || 0), color: '#6b7280' }
        ]

        // Evolución mensual (últimos 6 meses)
        const [evolucionMensual] = await connection.execute(
            `SELECT 
                DATE_FORMAT(fecha_contrato, '%Y-%m') as mes,
                DATE_FORMAT(fecha_contrato, '%b') as mes_nombre,
                COUNT(*) as contratos,
                COALESCE(SUM(monto_financiado), 0) as monto_financiado,
                COALESCE(SUM(pago_inicial), 0) as pagos_iniciales
            FROM contratos_financiamiento
            WHERE empresa_id = ?
            AND fecha_contrato >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(fecha_contrato, '%Y-%m'), DATE_FORMAT(fecha_contrato, '%b')
            ORDER BY mes ASC`,
            [empresaId]
        )

        // Pagos recibidos por mes (últimos 6 meses)
        const [pagosMensuales] = await connection.execute(
            `SELECT 
                DATE_FORMAT(fecha_pago, '%Y-%m') as mes,
                DATE_FORMAT(fecha_pago, '%b') as mes_nombre,
                COUNT(*) as cantidad_pagos,
                COALESCE(SUM(monto_pago), 0) as total_pagado
            FROM pagos_financiamiento
            WHERE empresa_id = ?
            AND fecha_pago >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(fecha_pago, '%Y-%m'), DATE_FORMAT(fecha_pago, '%b')
            ORDER BY mes ASC`,
            [empresaId]
        )

        // Combinar evolución mensual con pagos
        const evolucionCompleta = evolucionMensual.map(mes => {
            const pago = pagosMensuales.find(p => p.mes === mes.mes)
            return {
                ...mes,
                pagos_recibidos: pago ? parseFloat(pago.total_pagado) : 0,
                cantidad_pagos: pago ? parseInt(pago.cantidad_pagos) : 0
            }
        })

        // Alertas
        const alertas = []
        
        if (parseInt(statsCuotas[0]?.cuotas_vencidas || 0) > 0) {
            alertas.push({
                tipo: 'danger',
                icono: 'alert-circle-outline',
                titulo: 'Cuotas Vencidas',
                mensaje: `${statsCuotas[0].cuotas_vencidas} cuotas requieren atención inmediata`,
                enlace: '/admin/cuotas?estado=vencida'
            })
        }

        if (parseInt(cuotasProximas[0]?.cantidad || 0) > 0) {
            alertas.push({
                tipo: 'warning',
                icono: 'time-outline',
                titulo: 'Cuotas Próximas',
                mensaje: `${cuotasProximas[0].cantidad} cuotas vencen en los próximos 7 días`,
                enlace: '/admin/cuotas?proximas=7'
            })
        }

        if (parseInt(statsGenerales[0]?.contratos_incumplidos || 0) > 0) {
            alertas.push({
                tipo: 'danger',
                icono: 'warning-outline',
                titulo: 'Contratos en Incumplimiento',
                mensaje: `${statsGenerales[0].contratos_incumplidos} contratos en estado de incumplimiento`,
                enlace: '/admin/contratos?estado=incumplido'
            })
        }

        // Top clientes por monto financiado
        const [topClientes] = await connection.execute(
            `SELECT 
                cl.id, cl.nombre, cl.numero_documento,
                COUNT(c.id) as total_contratos,
                COALESCE(SUM(c.monto_financiado), 0) as total_financiado,
                COALESCE(SUM(c.saldo_pendiente), 0) as saldo_pendiente
            FROM contratos_financiamiento c
            INNER JOIN clientes cl ON c.cliente_id = cl.id
            WHERE c.empresa_id = ? AND c.estado = 'activo'
            GROUP BY cl.id, cl.nombre, cl.numero_documento
            ORDER BY total_financiado DESC
            LIMIT 5`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            estadisticas: {
                total_contratos: parseInt(statsGenerales[0]?.total_contratos || 0),
                contratos_activos: parseInt(statsGenerales[0]?.contratos_activos || 0),
                contratos_pagados: parseInt(statsGenerales[0]?.contratos_pagados || 0),
                contratos_incumplidos: parseInt(statsGenerales[0]?.contratos_incumplidos || 0),
                total_financiado: parseFloat(statsGenerales[0]?.total_financiado || 0),
                total_por_cobrar: parseFloat(statsGenerales[0]?.total_por_cobrar || 0),
                total_cobrado: parseFloat(statsGenerales[0]?.total_cobrado || 0),
                total_intereses: parseFloat(statsGenerales[0]?.total_intereses || 0),
                promedio_financiado: parseFloat(statsGenerales[0]?.promedio_financiado || 0),
                cuotas_pendientes: parseInt(statsCuotas[0]?.cuotas_pendientes || 0),
                cuotas_vencidas: parseInt(statsCuotas[0]?.cuotas_vencidas || 0),
                total_mora: parseFloat(statsCuotas[0]?.total_mora || 0),
                cuotas_proximas: parseInt(cuotasProximas[0]?.cantidad || 0)
            },
            contratosRecientes,
            distribucionEstados,
            evolucionMensual: evolucionCompleta,
            alertas,
            topClientes
        }

    } catch (error) {
        console.error('Error al obtener dashboard de contratos:', error)
        if (connection) connection.release()
        return { 
            success: false, 
            mensaje: 'Error al cargar dashboard: ' + (error?.message || 'Error desconocido'),
            estadisticas: {},
            contratosRecientes: [],
            distribucionEstados: [],
            evolucionMensual: [],
            alertas: [],
            topClientes: []
        }
    }
}

/**
 * Obtiene la lista de contratos de financiamiento con filtros
 * @param {Object} filtros - Filtros de búsqueda
 * @returns {Object} { success: boolean, contratos: Array, paginacion: Object, mensaje?: string }
 */
export async function obtenerContratos(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const pagina = filtros.pagina || 1
        const limite = filtros.limite || 20
        const offset = (pagina - 1) * limite

        let query = `
            SELECT c.*,
                   cl.nombre as cliente_nombre,
                   cl.numero_documento as cliente_documento,
                   cl.telefono as cliente_telefono,
                   p.nombre as plan_nombre,
                   u.nombre as vendedor_nombre
            FROM contratos_financiamiento c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN planes_financiamiento p ON c.plan_id = p.id
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.empresa_id = ?
        `
        const params = [empresaId]

        // Filtro por estado
        if (filtros.estado) {
            query += ` AND c.estado = ?`
            params.push(filtros.estado)
        }

        // Búsqueda por número de contrato, cliente o NCF
        if (filtros.buscar) {
            query += ` AND (c.numero_contrato LIKE ? OR cl.nombre LIKE ? OR c.ncf LIKE ?)`
            const busqueda = `%${filtros.buscar}%`
            params.push(busqueda, busqueda, busqueda)
        }

        // Filtro por cliente
        if (filtros.cliente_id) {
            query += ` AND c.cliente_id = ?`
            params.push(filtros.cliente_id)
        }

        // Contar total (sin LIMIT y OFFSET)
        let countQuery = `
            SELECT COUNT(*) as total
            FROM contratos_financiamiento c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN planes_financiamiento p ON c.plan_id = p.id
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.empresa_id = ?
        `
        const countParams = [empresaId]

        // Aplicar los mismos filtros que la consulta principal
        if (filtros.estado) {
            countQuery += ` AND c.estado = ?`
            countParams.push(filtros.estado)
        }

        if (filtros.buscar) {
            countQuery += ` AND (c.numero_contrato LIKE ? OR cl.nombre LIKE ? OR c.ncf LIKE ?)`
            const busqueda = `%${filtros.buscar}%`
            countParams.push(busqueda, busqueda, busqueda)
        }

        if (filtros.cliente_id) {
            countQuery += ` AND c.cliente_id = ?`
            countParams.push(filtros.cliente_id)
        }

        const [countResult] = await connection.execute(countQuery, countParams)
        const total = countResult && countResult[0] ? parseInt(countResult[0].total) : 0

        query += ` ORDER BY c.fecha_creacion DESC LIMIT ? OFFSET ?`
        params.push(limite, offset)

        const [contratos] = await connection.execute(query, params)

        connection.release()

        return {
            success: true,
            contratos,
            paginacion: {
                pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite)
            }
        }

    } catch (error) {
        console.error('Error al obtener contratos:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar contratos', contratos: [] }
    }
}

/**
 * Obtiene el detalle completo de un contrato
 * @param {number} id - ID del contrato
 * @returns {Object} { success: boolean, contrato?: Object, cuotas?: Array, pagos?: Array, activos?: Array, mensaje?: string }
 */
/**
 * Obtiene datos completos del contrato para generación de PDF
 * Incluye: contrato, empresa, cliente, cuotas, activos
 * @param {number} contratoId - ID del contrato
 * @param {number} empresaId - ID de la empresa
 * @returns {Object} { success: boolean, datos: { contrato, empresa, cliente, cuotas, activos } }
 */
export async function obtenerDatosCompletosContrato(contratoId, empresaId) {
    let connection
    try {
        if (!empresaId || !contratoId) {
            return { success: false, mensaje: 'Parámetros inválidos' }
        }

        connection = await db.getConnection()

        // Obtener datos del contrato con información relacionada
        const [contratos] = await connection.execute(
            `SELECT c.*,
                   cl.nombre as cliente_nombre,
                   cl.apellidos as cliente_apellidos,
                   cl.numero_documento as cliente_documento,
                   cl.telefono as cliente_telefono,
                   cl.email as cliente_email,
                   cl.direccion as cliente_direccion,
                   p.nombre as plan_nombre,
                   p.codigo as plan_codigo,
                   u.nombre as vendedor_nombre
            FROM contratos_financiamiento c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN planes_financiamiento p ON c.plan_id = p.id
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.id = ? AND c.empresa_id = ?`,
            [contratoId, empresaId]
        )

        if (contratos.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Contrato no encontrado' }
        }

        const contrato = contratos[0]

        // Obtener datos de la empresa
        const [empresas] = await connection.execute(
            `SELECT nombre_empresa as nombre, rnc, direccion, telefono, email, logo_url
             FROM empresas
             WHERE id = ?`,
            [empresaId]
        )

        const empresa = empresas[0] || {}

        // Obtener datos completos del cliente
        const [clientes] = await connection.execute(
            `SELECT *
             FROM clientes
             WHERE id = ? AND empresa_id = ?`,
            [contrato.cliente_id, empresaId]
        )

        const cliente = clientes[0] || {}

        // Obtener todas las cuotas del contrato
        const [cuotas] = await connection.execute(
            `SELECT *
             FROM cuotas_financiamiento
             WHERE contrato_id = ?
             ORDER BY numero_cuota ASC`,
            [contratoId]
        )

        // Obtener activos relacionados con el contrato
        const [activos] = await connection.execute(
            `SELECT a.*, p.nombre as producto_nombre
             FROM activos_productos a
             LEFT JOIN productos p ON a.producto_id = p.id
             WHERE a.contrato_financiamiento_id = ? AND a.empresa_id = ?`,
            [contratoId, empresaId]
        )

        connection.release()

        return {
            success: true,
            datos: {
                contrato,
                empresa,
                cliente,
                cuotas,
                activos
            }
        }

    } catch (error) {
        console.error('Error al obtener datos completos del contrato:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al obtener datos del contrato: ' + error.message }
    }
}

export async function obtenerContratoPorId(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [contratos] = await connection.execute(
            `SELECT c.*,
                   cl.nombre as cliente_nombre,
                   cl.apellidos as cliente_apellidos,
                   cl.numero_documento as cliente_documento,
                   cl.telefono as cliente_telefono,
                   cl.email as cliente_email,
                   cl.direccion as cliente_direccion,
                   cl.foto_url as cliente_foto,
                   p.nombre as plan_nombre,
                   p.codigo as plan_codigo,
                   u.nombre as vendedor_nombre,
                   v.numero_interno as venta_numero
            FROM contratos_financiamiento c
            LEFT JOIN clientes cl ON c.cliente_id = cl.id
            LEFT JOIN planes_financiamiento p ON c.plan_id = p.id
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            LEFT JOIN ventas v ON c.venta_id = v.id
            WHERE c.id = ? AND c.empresa_id = ?`,
            [id, empresaId]
        )

        if (contratos.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Contrato no encontrado' }
        }

        const contrato = contratos[0]

        // Obtener cuotas del contrato
        const [cuotas] = await connection.execute(
            `SELECT * FROM cuotas_financiamiento
             WHERE contrato_id = ?
             ORDER BY numero_cuota ASC`,
            [id]
        )

        // Obtener pagos del contrato
        const [pagos] = await connection.execute(
            `SELECT p.*, u.nombre as registrado_por_nombre
             FROM pagos_financiamiento p
             LEFT JOIN usuarios u ON p.registrado_por = u.id
             WHERE p.contrato_id = ?
             ORDER BY p.fecha_pago DESC`,
            [id]
        )

        // Obtener activos asociados
        const [activos] = await connection.execute(
            `SELECT a.*, pr.nombre as producto_nombre
             FROM activos_productos a
             LEFT JOIN productos pr ON a.producto_id = pr.id
             WHERE a.contrato_financiamiento_id = ?`,
            [id]
        )

        connection.release()

        return {
            success: true,
            contrato,
            cuotas,
            pagos,
            activos
        }

    } catch (error) {
        console.error('Error al obtener contrato:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar contrato' }
    }
}

/**
 * Obtiene las cuotas de un contrato
 * @param {number} contratoId - ID del contrato
 * @returns {Object} { success: boolean, cuotas: Array, mensaje?: string }
 */
export async function obtenerCuotasPorContrato(contratoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        // Verificar que el contrato pertenece a la empresa
        const [contratos] = await connection.execute(
            `SELECT id FROM contratos_financiamiento 
             WHERE id = ? AND empresa_id = ?`,
            [contratoId, empresaId]
        )

        if (contratos.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Contrato no encontrado' }
        }

        const [cuotas] = await connection.execute(
            `SELECT * FROM cuotas_financiamiento
             WHERE contrato_id = ?
             ORDER BY numero_cuota ASC`,
            [contratoId]
        )

        connection.release()

        return { success: true, cuotas }

    } catch (error) {
        console.error('Error al obtener cuotas:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar cuotas', cuotas: [] }
    }
}

/**
 * Crea un nuevo contrato de financiamiento
 * @param {Object} datos - Datos del contrato
 * @returns {Object} { success: boolean, contrato_id?: number, numero_contrato?: string, mensaje?: string }
 */
export async function crearContratoFinanciamiento(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        // Validar datos usando el dominio compartido
        const validacion = validarDatosContrato(datos)
        if (!validacion.valido) {
            return { success: false, mensaje: validacion.errores.join(', ') }
        }

        connection = await db.getConnection()

        // Validar crédito del cliente antes de iniciar transacción
        const [creditoCliente] = await connection.execute(
            `SELECT limite_credito, saldo_utilizado,
                    (limite_credito - saldo_utilizado) as credito_disponible,
                    estado_credito, clasificacion, contratos_activos,
                    max_contratos_activos
             FROM credito_clientes
             WHERE cliente_id = ? AND empresa_id = ?`,
            [datos.cliente_id, empresaId]
        )

        if (creditoCliente.length === 0) {
            connection.release()
            return { 
                success: false, 
                mensaje: 'Cliente sin límite de crédito asignado. Configure el crédito del cliente primero.' 
            }
        }

        const credito = creditoCliente[0]

        // Validar estado del crédito
        if (credito.estado_credito === 'bloqueado' || credito.estado_credito === 'suspendido') {
            connection.release()
            return { 
                success: false, 
                mensaje: `El crédito del cliente está ${credito.estado_credito}. No se pueden crear nuevos contratos.` 
            }
        }

        // Validar clasificación (no permitir D)
        if (credito.clasificacion === 'D') {
            connection.release()
            return { 
                success: false, 
                mensaje: 'Cliente con clasificación D (Moroso). No se pueden crear nuevos contratos.' 
            }
        }

        // Validar número máximo de contratos activos
        if (credito.contratos_activos >= credito.max_contratos_activos) {
            connection.release()
            return { 
                success: false, 
                mensaje: `El cliente ya tiene ${credito.contratos_activos} contratos activos (máximo: ${credito.max_contratos_activos}).` 
            }
        }

        await connection.beginTransaction()

        try {
            // ============================================
            // PASO 1: Obtener plan y validar existencia
            // ============================================
            const [planes] = await connection.execute(
                `SELECT * FROM planes_financiamiento WHERE id = ?`,
                [datos.plan_id]
            )

            if (planes.length === 0) {
                throw new Error('Plan de financiamiento no encontrado')
            }

            const plan = planes[0]

            // ============================================
            // PASO 2: Obtener plazo (FUENTE DE VERDAD)
            // ============================================
            let plazoData = null
            let numeroCuotas = null
            let tasaMensual = null
            let tasaAnual = null
            let montoCuota = null
            let pagoInicialMinimo = 0

            // 🔑 CRÍTICO: Si viene plazo_id, OBLIGATORIO obtenerlo
            if (!datos.plazo_id) {
                throw new Error('plazo_id es obligatorio. Debe seleccionar un plazo del plan.')
            }

            const [plazos] = await connection.execute(
                `SELECT * FROM planes_plazos WHERE id = ? AND plan_id = ? AND activo = 1`,
                [datos.plazo_id, datos.plan_id]
            )

            if (plazos.length === 0) {
                throw new Error('Plazo no encontrado o inactivo. La opción de plazo seleccionada ya no está disponible.')
            }

            plazoData = plazos[0]

            // 🔑 COPIAR TODOS LOS VALORES DEL PLAZO (inmutabilidad)
            numeroCuotas = plazoData.plazo_meses  // COPIADO
            tasaMensual = parseFloat(plazoData.tasa_mensual_calculada)  // COPIADO
            tasaAnual = parseFloat(plazoData.tasa_anual_calculada)  // COPIADO
            
            // Si el plazo tiene cuota fija, usarla (interés implícito)
            if (plazoData.cuota_mensual) {
                montoCuota = parseFloat(plazoData.cuota_mensual)  // COPIADO
            }

            // Calcular pago inicial mínimo desde el plazo
            if (plazoData.tipo_pago_inicial === 'PORCENTAJE') {
                pagoInicialMinimo = datos.precio_producto * (parseFloat(plazoData.pago_inicial_valor) / 100)
            } else {
                // MONTO fijo
                pagoInicialMinimo = parseFloat(plazoData.pago_inicial_valor)
            }

            // ============================================
            // PASO 3: Validar pago inicial (mínimo, pero puede ser mayor)
            // ============================================
            const pagoInicialReal = parseFloat(datos.pago_inicial || 0)
            
            if (pagoInicialReal < pagoInicialMinimo) {
                throw new Error(
                    `El pago inicial debe ser al menos ${pagoInicialMinimo.toFixed(2)} ` +
                    `(mínimo del plazo: ${plazoData.tipo_pago_inicial === 'PORCENTAJE' 
                        ? `${plazoData.pago_inicial_valor}%` 
                        : `RD$${plazoData.pago_inicial_valor}`})`
                )
            }

            // ============================================
            // PASO 4: Calcular montos (solo aritmética, NO fórmulas financieras)
            // ============================================
            let precioProducto = parseFloat(datos.precio_producto)
            
            // Para planes comerciales, aplicar recargo al precio base
            if (plazoData.tipo_plan === 'COMERCIAL' && plazoData.recargo_tipo && plazoData.recargo_valor) {
                const recargoValor = parseFloat(plazoData.recargo_valor)
                if (plazoData.recargo_tipo === 'FIJO') {
                    precioProducto = precioProducto + recargoValor
                } else if (plazoData.recargo_tipo === 'PORCENTAJE') {
                    precioProducto = precioProducto * (1 + recargoValor / 100)
                }
            }
            
            const montoFinanciado = precioProducto - pagoInicialReal  // CALCULADO
            
            if (montoFinanciado <= 0) {
                throw new Error('El pago inicial no puede ser mayor o igual al precio del producto')
            }

            // Si no hay cuota fija del plazo, calcularla (solo para legacy)
            if (!montoCuota) {
                const amortizacion = calcularAmortizacionFrancesa(
                    montoFinanciado,
                    tasaMensual,
                    numeroCuotas
                )
                montoCuota = amortizacion.cuotaMensual
            }

            // Calcular totales
            const totalPagar = montoCuota * numeroCuotas
            const totalIntereses = totalPagar - montoFinanciado

            // ============================================
            // PASO 5: Validar crédito del cliente (AHORA con monto calculado)
            // ============================================
            const creditoDisponible = parseFloat(credito.credito_disponible || 0)
            if (creditoDisponible < montoFinanciado) {
                throw new Error(
                    `Crédito insuficiente. Disponible: ${creditoDisponible.toFixed(2)}, ` +
                    `Requerido: ${montoFinanciado.toFixed(2)}`
                )
            }

            // Obtener siguiente número de contrato
            const [ultimoContrato] = await connection.execute(
                `SELECT numero_contrato FROM contratos_financiamiento
                 WHERE empresa_id = ?
                 ORDER BY id DESC LIMIT 1`,
                [empresaId]
            )

            let secuencia = 1
            if (ultimoContrato.length > 0) {
                const ultimoNum = ultimoContrato[0].numero_contrato
                const match = ultimoNum.match(/FIN-\d+-(\d+)/)
                if (match) {
                    secuencia = parseInt(match[1]) + 1
                }
            }

            const numeroContrato = formatearNumeroContrato(empresaId, secuencia)

            // ============================================
            // PASO 6: Calcular fechas
            // ============================================
            const fechaContrato = datos.fecha_contrato || new Date().toISOString().split('T')[0]
            let fechaPrimerPago = datos.fecha_primer_pago
            if (!fechaPrimerPago) {
                const fecha = new Date(fechaContrato)
                fecha.setMonth(fecha.getMonth() + 1)
                fechaPrimerPago = fecha.toISOString().split('T')[0]
            }

            // Calcular fecha último pago desde fecha primer pago + número de cuotas
            const fechaUltimoPago = new Date(fechaPrimerPago)
            fechaUltimoPago.setMonth(fechaUltimoPago.getMonth() + numeroCuotas - 1)
            const fechaUltimoPagoStr = fechaUltimoPago.toISOString().split('T')[0]

            // Insertar contrato
            // Construir INSERT dinámicamente según si hay venta_id o no
            const tieneVenta = datos.venta_id !== null && datos.venta_id !== undefined
            
            const columnas = [
                'empresa_id', 'cliente_id', 'plan_id', 'usuario_id', 'numero_contrato',
                'numero_referencia', 'precio_producto', 'pago_inicial', 'monto_financiado', 
                'total_intereses', 'total_a_pagar', 'numero_cuotas', 'monto_cuota',
                'tasa_interes_mensual', 'fecha_contrato', 'fecha_primer_pago',
                'fecha_ultimo_pago', 'monto_pagado', 'saldo_pendiente',
                'cuotas_pagadas', 'estado', 'nombre_fiador', 
                'documento_fiador', 'telefono_fiador', 'notas'
            ]
            
            const valores = [
                empresaId,
                datos.cliente_id,
                datos.plan_id,
                datos.plazo_id,  // 🔑 SIEMPRE incluir plazo_id
                userId,
                numeroContrato,
                datos.numero_referencia || null,
                precioProducto,  // CALCULADO/VALIDADO
                pagoInicialReal,  // VALIDADO
                montoFinanciado,  // CALCULADO
                totalIntereses,  // CALCULADO
                totalPagar,  // CALCULADO
                numeroCuotas,  // COPIADO del plazo
                montoCuota,  // COPIADO del plazo o calculado
                tasaMensual,  // COPIADO del plazo
                fechaContrato,
                fechaPrimerPago,
                fechaUltimoPagoStr,  // CALCULADO
                pagoInicialReal,  // monto_pagado inicial
                montoFinanciado,  // saldo_pendiente inicial
                0,  // cuotas_pagadas
                ESTADOS_CONTRATO.ACTIVO,
                datos.nombre_fiador || null,
                datos.documento_fiador || null,
                datos.telefono_fiador || null,
                datos.notas || null
            ]

            // Agregar plazo_id en la posición correcta
            columnas.splice(3, 0, 'plazo_id')

            // Agregar venta_id y ncf solo si hay una venta asociada
            if (tieneVenta) {
                const indiceVenta = columnas.indexOf('numero_referencia')
                columnas.splice(indiceVenta, 0, 'venta_id', 'ncf')
                valores.splice(indiceVenta, 0, datos.venta_id, datos.ncf || '')
            }

            const placeholders = columnas.map(() => '?').join(', ')
            
            const [resultContrato] = await connection.execute(
                `INSERT INTO contratos_financiamiento (${columnas.join(', ')}) VALUES (${placeholders})`,
                valores
            )

            const contratoId = resultContrato.insertId

            // ============================================
            // PASO 7: Generar cronograma de cuotas
            // ============================================
            let cronograma
            
            if (plazoData.cuota_mensual) {
                // Si el plazo tiene cuota fija, generar cronograma simple (interés implícito)
                const fechas = generarCronogramaFechas(
                    fechaPrimerPago,
                    numeroCuotas,
                    null,
                    plan.dias_gracia || 5
                )
                
                let saldoRestante = montoFinanciado
                cronograma = fechas.map((fechaInfo, index) => {
                    const esUltima = index === fechas.length - 1
                    const montoCapital = esUltima ? saldoRestante : montoCuota
                    saldoRestante -= montoCapital
                    
                    return {
                        numero_cuota: index + 1,
                        fecha_vencimiento: fechaInfo.fechaVencimiento,
                        fecha_fin_gracia: fechaInfo.fechaFinGracia,
                        monto_capital: montoCapital,
                        monto_interes: 0,  // Interés implícito en la cuota
                        monto_cuota: montoCuota,
                        saldo_restante: Math.max(0, saldoRestante),
                        monto_pagado: 0,
                        monto_mora: 0,
                        total_a_pagar: montoCuota,
                        estado: 'pendiente',
                        dias_atraso: 0
                    }
                })
            } else {
                // Usar amortización francesa (legacy o cuando no hay cuota fija)
                cronograma = generarCronograma({
                    monto_financiado: montoFinanciado,
                    numero_cuotas: numeroCuotas,
                    fecha_primer_pago: fechaPrimerPago,
                    tasa_interes_mensual: tasaMensual,
                    dias_gracia: plan.dias_gracia || 5
                })
            }

            // Insertar cuotas
            for (const cuota of cronograma) {
                await connection.execute(
                    `INSERT INTO cuotas_financiamiento (
                        contrato_id, empresa_id, cliente_id, numero_cuota,
                        fecha_vencimiento, fecha_fin_gracia, monto_capital,
                        monto_interes, monto_cuota, saldo_restante,
                        monto_pagado, monto_mora, total_a_pagar, estado, dias_atraso
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        contratoId,
                        empresaId,
                        datos.cliente_id,
                        cuota.numero_cuota,
                        cuota.fecha_vencimiento,
                        cuota.fecha_fin_gracia,
                        cuota.monto_capital,
                        cuota.monto_interes,
                        cuota.monto_cuota,
                        cuota.saldo_restante,
                        0,
                        0,
                        cuota.monto_cuota,
                        'pendiente',
                        0
                    ]
                )
            }

            // Si hay activos asociados, actualizarlos
            if (datos.activos && datos.activos.length > 0) {
                for (const activoId of datos.activos) {
                    await connection.execute(
                        `UPDATE activos_productos
                         SET estado = 'financiado',
                             cliente_id = ?,
                             contrato_financiamiento_id = ?,
                             venta_id = ?,
                             fecha_venta = ?
                         WHERE id = ? AND empresa_id = ?`,
                        [
                            datos.cliente_id,
                            contratoId,
                            datos.venta_id,
                            new Date().toISOString().split('T')[0],
                            activoId,
                            empresaId
                        ]
                    )
                }
            }

            // ============================================
            // PASO 8: Actualizar límite de crédito del cliente
            // ============================================
            await connection.execute(
                `UPDATE credito_clientes
                 SET saldo_utilizado = saldo_utilizado + ?,
                     monto_financiado_total = monto_financiado_total + ?,
                     contratos_activos = contratos_activos + 1
                 WHERE cliente_id = ? AND empresa_id = ?`,
                [montoFinanciado, montoFinanciado, datos.cliente_id, empresaId]  // CALCULADO
            )

            // Actualizar venta para asociar con contrato
            await connection.execute(
                `UPDATE ventas
                 SET tiene_financiamiento = 1,
                     contrato_financiamiento_id = ?
                 WHERE id = ? AND empresa_id = ?`,
                [contratoId, datos.venta_id, empresaId]
            )

            await connection.commit()
            connection.release()

            return {
                success: true,
                contrato_id: contratoId,
                numero_contrato: numeroContrato,
                mensaje: 'Contrato creado exitosamente'
            }

        } catch (error) {
            await connection.rollback()
            throw error
        }

    } catch (error) {
        console.error('Error al crear contrato:', error)
        if (connection) {
            try {
                await connection.rollback()
            } catch (rollbackError) {
                console.error('Error en rollback:', rollbackError)
            }
            connection.release()
        }
        return { success: false, mensaje: 'Error al crear contrato: ' + error.message }
    }
}

/**
 * Actualiza un contrato de financiamiento
 * @param {number} id - ID del contrato
 * @param {Object} datos - Datos a actualizar
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function actualizarContratoFinanciamiento(id, datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            // Verificar que el contrato existe y pertenece a la empresa
            const [contratos] = await connection.execute(
                `SELECT c.*, p.tasa_interes_anual, p.plazo_meses, p.dias_gracia
                 FROM contratos_financiamiento c
                 LEFT JOIN planes_financiamiento p ON c.plan_id = p.id
                 WHERE c.id = ? AND c.empresa_id = ?`,
                [id, empresaId]
            )

            if (contratos.length === 0) {
                await connection.rollback()
                connection.release()
                return { success: false, mensaje: 'Contrato no encontrado' }
            }

            const contrato = contratos[0]

            // No permitir editar contratos pagados o cancelados
            if (contrato.estado === ESTADOS_CONTRATO.PAGADO || contrato.estado === ESTADOS_CONTRATO.CANCELADO) {
                await connection.rollback()
                connection.release()
                return { success: false, mensaje: 'No se puede editar un contrato pagado o cancelado' }
            }

            // Manejar cambio de plan
            if (datos.plan_id !== undefined && datos.plan_id !== contrato.plan_id) {
                // Obtener el nuevo plan
                const [nuevosPlanes] = await connection.execute(
                    `SELECT * FROM planes_financiamiento WHERE id = ?`,
                    [datos.plan_id]
                )

                if (nuevosPlanes.length === 0) {
                    await connection.rollback()
                    connection.release()
                    return { success: false, mensaje: 'Plan no encontrado' }
                }

                const nuevoPlan = nuevosPlanes[0]

                // Obtener cuotas pendientes del contrato
                const [cuotasPendientes] = await connection.execute(
                    `SELECT * FROM cuotas_financiamiento
                     WHERE contrato_id = ? AND estado IN ('pendiente', 'vencida', 'parcial')
                     ORDER BY numero_cuota ASC`,
                    [id]
                )

                // Si hay cuotas pendientes, recalcularlas
                if (cuotasPendientes.length > 0) {
                    // Calcular nuevo monto financiado pendiente (suma de capital pendiente)
                    const capitalPendiente = cuotasPendientes.reduce((sum, cuota) => {
                        return sum + parseFloat(cuota.monto_capital || 0)
                    }, 0)

                    // Calcular nueva tasa mensual
                    const tasaMensual = tasaAnualAMensual(nuevoPlan.tasa_interes_anual)

                    // Recalcular amortización con el nuevo plan
                    const amortizacion = calcularAmortizacionFrancesa(
                        capitalPendiente,
                        tasaMensual,
                        nuevoPlan.plazo_meses
                    )

                    // Actualizar contrato con nuevo plan y nuevos cálculos
                    await connection.execute(
                        `UPDATE contratos_financiamiento 
                         SET plan_id = ?,
                             numero_cuotas = ?,
                             tasa_interes_mensual = ?,
                             monto_cuota = ?,
                             total_intereses = total_intereses + ?,
                             total_a_pagar = monto_pagado + saldo_pendiente + ?
                         WHERE id = ?`,
                        [
                            nuevoPlan.id,
                            nuevoPlan.plazo_meses,
                            tasaMensual,
                            amortizacion.cuotaMensual,
                            amortizacion.totalIntereses,
                            amortizacion.totalIntereses,
                            id
                        ]
                    )

                    // Recalcular y actualizar cuotas pendientes
                    const fechaPrimerPago = cuotasPendientes[0]?.fecha_vencimiento || new Date().toISOString().split('T')[0]
                    const nuevoCronograma = generarCronograma({
                        monto_financiado: capitalPendiente,
                        numero_cuotas: nuevoPlan.plazo_meses,
                        fecha_primer_pago: fechaPrimerPago,
                        tasa_interes_mensual: tasaMensual,
                        dias_gracia: nuevoPlan.dias_gracia || 5
                    })

                    // Actualizar cada cuota pendiente
                    for (let i = 0; i < Math.min(cuotasPendientes.length, nuevoCronograma.length); i++) {
                        const cuotaActual = cuotasPendientes[i]
                        const nuevaCuota = nuevoCronograma[i]

                        await connection.execute(
                            `UPDATE cuotas_financiamiento
                             SET monto_capital = ?,
                                 monto_interes = ?,
                                 monto_cuota = ?,
                                 saldo_restante = ?,
                                 fecha_vencimiento = ?,
                                 fecha_fin_gracia = ?
                             WHERE id = ?`,
                            [
                                nuevaCuota.monto_capital,
                                nuevaCuota.monto_interes,
                                nuevaCuota.monto_cuota,
                                nuevaCuota.saldo_restante,
                                nuevaCuota.fecha_vencimiento,
                                nuevaCuota.fecha_fin_gracia,
                                cuotaActual.id
                            ]
                        )
                    }

                    // Si el nuevo plan tiene más cuotas, crear las adicionales
                    if (nuevoCronograma.length > cuotasPendientes.length) {
                        for (let i = cuotasPendientes.length; i < nuevoCronograma.length; i++) {
                            const nuevaCuota = nuevoCronograma[i]
                            await connection.execute(
                                `INSERT INTO cuotas_financiamiento (
                                    contrato_id, empresa_id, cliente_id, numero_cuota,
                                    fecha_vencimiento, fecha_fin_gracia, monto_capital,
                                    monto_interes, monto_cuota, saldo_restante,
                                    monto_pagado, monto_mora, total_a_pagar, estado, dias_atraso
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    id,
                                    empresaId,
                                    contrato.cliente_id,
                                    nuevaCuota.numero_cuota,
                                    nuevaCuota.fecha_vencimiento,
                                    nuevaCuota.fecha_fin_gracia,
                                    nuevaCuota.monto_capital,
                                    nuevaCuota.monto_interes,
                                    nuevaCuota.monto_cuota,
                                    nuevaCuota.saldo_restante,
                                    0,
                                    0,
                                    nuevaCuota.monto_cuota,
                                    'pendiente',
                                    0
                                ]
                            )
                        }
                    }
                } else {
                    // No hay cuotas pendientes, solo actualizar el plan
                    const tasaMensual = tasaAnualAMensual(nuevoPlan.tasa_interes_anual)
                    await connection.execute(
                        `UPDATE contratos_financiamiento 
                         SET plan_id = ?,
                             numero_cuotas = ?,
                             tasa_interes_mensual = ?
                         WHERE id = ?`,
                        [nuevoPlan.id, nuevoPlan.plazo_meses, tasaMensual, id]
                    )
                }
            }

            // Construir query de actualización dinámicamente para otros campos
            const campos = []
            const valores = []

            if (datos.notas !== undefined) {
                campos.push('notas = ?')
                valores.push(datos.notas)
            }

            if (datos.notas_internas !== undefined) {
                campos.push('notas_internas = ?')
                valores.push(datos.notas_internas)
            }

            if (datos.nombre_fiador !== undefined) {
                campos.push('nombre_fiador = ?')
                valores.push(datos.nombre_fiador)
            }

            if (datos.documento_fiador !== undefined) {
                campos.push('documento_fiador = ?')
                valores.push(datos.documento_fiador)
            }

            if (datos.telefono_fiador !== undefined) {
                campos.push('telefono_fiador = ?')
                valores.push(datos.telefono_fiador)
            }

            if (datos.estado !== undefined) {
                campos.push('estado = ?')
                valores.push(datos.estado)
                
                if (datos.razon_estado !== undefined) {
                    campos.push('razon_estado = ?')
                    valores.push(datos.razon_estado)
                }
            }

            // Actualizar otros campos si hay cambios
            if (campos.length > 0) {
                valores.push(id)
                await connection.execute(
                    `UPDATE contratos_financiamiento 
                     SET ${campos.join(', ')}
                     WHERE id = ?`,
                    valores
                )
            }

            await connection.commit()
            connection.release()

            return { success: true, mensaje: 'Contrato actualizado exitosamente' }

        } catch (error) {
            await connection.rollback()
            throw error
        }

    } catch (error) {
        console.error('Error al actualizar contrato:', error)
        if (connection) {
            try {
                await connection.rollback()
            } catch (rollbackError) {
                console.error('Error en rollback:', rollbackError)
            }
            connection.release()
        }
        return { success: false, mensaje: 'Error al actualizar contrato: ' + error.message }
    }
}

/**
 * Actualiza el plan de financiamiento de un contrato
 * @param {number} id - ID del contrato
 * @param {number} planId - ID del nuevo plan
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function actualizarPlanContrato(id, planId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            // Obtener contrato actual
            const [contratos] = await connection.execute(
                `SELECT c.*, p.tasa_interes_anual, p.plazo_meses, p.dias_gracia
                 FROM contratos_financiamiento c
                 LEFT JOIN planes_financiamiento p ON c.plan_id = p.id
                 WHERE c.id = ? AND c.empresa_id = ?`,
                [id, empresaId]
            )

            if (contratos.length === 0) {
                throw new Error('Contrato no encontrado')
            }

            const contrato = contratos[0]

            // Validar que el contrato puede editarse
            if (contrato.estado === ESTADOS_CONTRATO.PAGADO || contrato.estado === ESTADOS_CONTRATO.CANCELADO) {
                throw new Error('No se puede editar un contrato pagado o cancelado')
            }

            // Obtener nuevo plan
            const [nuevosPlanes] = await connection.execute(
                `SELECT * FROM planes_financiamiento WHERE id = ? AND activo = 1`,
                [planId]
            )

            if (nuevosPlanes.length === 0) {
                throw new Error('Plan no encontrado o inactivo')
            }

            const nuevoPlan = nuevosPlanes[0]

            // Obtener cuotas pendientes
            const [cuotasPendientes] = await connection.execute(
                `SELECT * FROM cuotas_financiamiento
                 WHERE contrato_id = ? AND estado IN ('pendiente', 'vencida', 'parcial')
                 ORDER BY numero_cuota ASC`,
                [id]
            )

            // Si hay cuotas pendientes, recalcularlas
            if (cuotasPendientes.length > 0) {
                const capitalPendiente = cuotasPendientes.reduce((sum, cuota) => {
                    return sum + parseFloat(cuota.monto_capital || 0)
                }, 0)

                const tasaMensual = tasaAnualAMensual(nuevoPlan.tasa_interes_anual)
                const amortizacion = calcularAmortizacionFrancesa(
                    capitalPendiente,
                    tasaMensual,
                    nuevoPlan.plazo_meses
                )

                // Actualizar contrato
                await connection.execute(
                    `UPDATE contratos_financiamiento 
                     SET plan_id = ?,
                         numero_cuotas = ?,
                         tasa_interes_mensual = ?,
                         monto_cuota = ?,
                         total_intereses = total_intereses + ?,
                         total_a_pagar = monto_pagado + saldo_pendiente + ?
                     WHERE id = ?`,
                    [
                        nuevoPlan.id,
                        nuevoPlan.plazo_meses,
                        tasaMensual,
                        amortizacion.cuotaMensual,
                        amortizacion.totalIntereses,
                        amortizacion.totalIntereses,
                        id
                    ]
                )

                // Recalcular cuotas pendientes
                const fechaPrimerPago = cuotasPendientes[0]?.fecha_vencimiento || new Date().toISOString().split('T')[0]
                const nuevoCronograma = generarCronograma({
                    monto_financiado: capitalPendiente,
                    numero_cuotas: nuevoPlan.plazo_meses,
                    fecha_primer_pago: fechaPrimerPago,
                    tasa_interes_mensual: tasaMensual,
                    dias_gracia: nuevoPlan.dias_gracia || 5
                })

                // Actualizar cuotas existentes
                for (let i = 0; i < Math.min(cuotasPendientes.length, nuevoCronograma.length); i++) {
                    const cuotaActual = cuotasPendientes[i]
                    const nuevaCuota = nuevoCronograma[i]

                    await connection.execute(
                        `UPDATE cuotas_financiamiento
                         SET monto_capital = ?,
                             monto_interes = ?,
                             monto_cuota = ?,
                             saldo_restante = ?,
                             fecha_vencimiento = ?,
                             fecha_fin_gracia = ?
                         WHERE id = ?`,
                        [
                            nuevaCuota.monto_capital,
                            nuevaCuota.monto_interes,
                            nuevaCuota.monto_cuota,
                            nuevaCuota.saldo_restante,
                            nuevaCuota.fecha_vencimiento,
                            nuevaCuota.fecha_fin_gracia,
                            cuotaActual.id
                        ]
                    )
                }

                // Crear cuotas adicionales si el nuevo plan tiene más meses
                if (nuevoCronograma.length > cuotasPendientes.length) {
                    for (let i = cuotasPendientes.length; i < nuevoCronograma.length; i++) {
                        const nuevaCuota = nuevoCronograma[i]
                        await connection.execute(
                            `INSERT INTO cuotas_financiamiento (
                                contrato_id, empresa_id, cliente_id, numero_cuota,
                                fecha_vencimiento, fecha_fin_gracia, monto_capital,
                                monto_interes, monto_cuota, saldo_restante,
                                monto_pagado, monto_mora, total_a_pagar, estado, dias_atraso
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                id,
                                empresaId,
                                contrato.cliente_id,
                                nuevaCuota.numero_cuota,
                                nuevaCuota.fecha_vencimiento,
                                nuevaCuota.fecha_fin_gracia,
                                nuevaCuota.monto_capital,
                                nuevaCuota.monto_interes,
                                nuevaCuota.monto_cuota,
                                nuevaCuota.saldo_restante,
                                0,
                                0,
                                nuevaCuota.monto_cuota,
                                'pendiente',
                                0
                            ]
                        )
                    }
                }
            } else {
                // No hay cuotas pendientes, solo actualizar plan
                const tasaMensual = tasaAnualAMensual(nuevoPlan.tasa_interes_anual)
                await connection.execute(
                    `UPDATE contratos_financiamiento 
                     SET plan_id = ?,
                         numero_cuotas = ?,
                         tasa_interes_mensual = ?
                     WHERE id = ?`,
                    [nuevoPlan.id, nuevoPlan.plazo_meses, tasaMensual, id]
                )
            }

            await connection.commit()
            connection.release()

            return { success: true, mensaje: 'Plan actualizado exitosamente' }

        } catch (error) {
            await connection.rollback()
            throw error
        }

    } catch (error) {
        console.error('Error al actualizar plan:', error)
        if (connection) {
            try {
                await connection.rollback()
            } catch (rollbackError) {
                console.error('Error en rollback:', rollbackError)
            }
            connection.release()
        }
        return { success: false, mensaje: 'Error al actualizar plan: ' + error.message }
    }
}

/**
 * Actualiza los montos y compensación de un contrato
 * @param {number} id - ID del contrato
 * @param {Object} datos - Datos a actualizar (pago_inicial, precio_producto, ncf)
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function actualizarMontosContrato(id, datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            // Obtener contrato y plan actual
            const [contratos] = await connection.execute(
                `SELECT c.*, p.pago_inicial_minimo_pct, p.tasa_interes_anual, p.plazo_meses, p.dias_gracia
                 FROM contratos_financiamiento c
                 LEFT JOIN planes_financiamiento p ON c.plan_id = p.id
                 WHERE c.id = ? AND c.empresa_id = ?`,
                [id, empresaId]
            )

            if (contratos.length === 0) {
                throw new Error('Contrato no encontrado')
            }

            const contrato = contratos[0]

            // Validar que el contrato puede editarse
            if (contrato.estado === ESTADOS_CONTRATO.PAGADO || contrato.estado === ESTADOS_CONTRATO.CANCELADO) {
                throw new Error('No se puede editar un contrato pagado o cancelado')
            }

            const precioProducto = datos.precio_producto !== undefined ? parseFloat(datos.precio_producto) : parseFloat(contrato.precio_producto)
            const pagoInicial = datos.pago_inicial !== undefined ? parseFloat(datos.pago_inicial) : parseFloat(contrato.pago_inicial)
            const montoFinanciado = precioProducto - pagoInicial

            // Validar monto inicial usando reglas de negocio
            const validacionInicial = validarMontoInicial(
                precioProducto,
                pagoInicial,
                contrato.pago_inicial_minimo_pct || 0
            )

            if (!validacionInicial.valido) {
                throw new Error(validacionInicial.error)
            }

            // Validar monto financiado
            const validacionMonto = validarMontoFinanciable(montoFinanciado)
            if (!validacionMonto.valido) {
                throw new Error(validacionMonto.error)
            }

            // Si cambió el monto financiado, recalcular cuotas pendientes
            const [cuotasPendientes] = await connection.execute(
                `SELECT * FROM cuotas_financiamiento
                 WHERE contrato_id = ? AND estado IN ('pendiente', 'vencida', 'parcial')
                 ORDER BY numero_cuota ASC`,
                [id]
            )

            if (cuotasPendientes.length > 0 && montoFinanciado !== parseFloat(contrato.monto_financiado)) {
                // Recalcular capital pendiente
                const capitalPendiente = cuotasPendientes.reduce((sum, cuota) => {
                    return sum + parseFloat(cuota.monto_capital || 0)
                }, 0)

                // Ajustar capital pendiente según la diferencia
                const diferenciaCapital = montoFinanciado - parseFloat(contrato.monto_financiado)
                const nuevoCapitalPendiente = capitalPendiente + diferenciaCapital

                if (nuevoCapitalPendiente <= 0) {
                    throw new Error('El nuevo monto financiado no puede ser menor al capital ya pagado')
                }

                // Recalcular cuotas con nuevo capital
                const tasaMensual = tasaAnualAMensual(contrato.tasa_interes_anual)
                const amortizacion = calcularAmortizacionFrancesa(
                    nuevoCapitalPendiente,
                    tasaMensual,
                    contrato.numero_cuotas
                )

                // Actualizar contrato
                await connection.execute(
                    `UPDATE contratos_financiamiento 
                     SET precio_producto = ?,
                         pago_inicial = ?,
                         monto_financiado = ?,
                         monto_cuota = ?,
                         total_intereses = ?,
                         total_a_pagar = ?,
                         saldo_pendiente = ?
                         ${datos.ncf !== undefined ? ', ncf = ?' : ''}
                     WHERE id = ?`,
                    datos.ncf !== undefined 
                        ? [precioProducto, pagoInicial, montoFinanciado, amortizacion.cuotaMensual, 
                           amortizacion.totalIntereses, amortizacion.totalPagar, nuevoCapitalPendiente, datos.ncf, id]
                        : [precioProducto, pagoInicial, montoFinanciado, amortizacion.cuotaMensual, 
                           amortizacion.totalIntereses, amortizacion.totalPagar, nuevoCapitalPendiente, id]
                )

                // Recalcular cuotas pendientes
                const fechaPrimerPago = cuotasPendientes[0]?.fecha_vencimiento || new Date().toISOString().split('T')[0]
                const nuevoCronograma = generarCronograma({
                    monto_financiado: nuevoCapitalPendiente,
                    numero_cuotas: contrato.numero_cuotas,
                    fecha_primer_pago: fechaPrimerPago,
                    tasa_interes_mensual: tasaMensual,
                    dias_gracia: contrato.dias_gracia || 5
                })

                // Actualizar cuotas
                for (let i = 0; i < Math.min(cuotasPendientes.length, nuevoCronograma.length); i++) {
                    const cuotaActual = cuotasPendientes[i]
                    const nuevaCuota = nuevoCronograma[i]

                    await connection.execute(
                        `UPDATE cuotas_financiamiento
                         SET monto_capital = ?,
                             monto_interes = ?,
                             monto_cuota = ?,
                             saldo_restante = ?
                         WHERE id = ?`,
                        [
                            nuevaCuota.monto_capital,
                            nuevaCuota.monto_interes,
                            nuevaCuota.monto_cuota,
                            nuevaCuota.saldo_restante,
                            cuotaActual.id
                        ]
                    )
                }
            } else {
                // Solo actualizar montos sin recalcular cuotas
                await connection.execute(
                    `UPDATE contratos_financiamiento 
                     SET precio_producto = ?,
                         pago_inicial = ?,
                         monto_financiado = ?
                         ${datos.ncf !== undefined ? ', ncf = ?' : ''}
                     WHERE id = ?`,
                    datos.ncf !== undefined 
                        ? [precioProducto, pagoInicial, montoFinanciado, datos.ncf, id]
                        : [precioProducto, pagoInicial, montoFinanciado, id]
                )
            }

            await connection.commit()
            connection.release()

            return { success: true, mensaje: 'Montos actualizados exitosamente' }

        } catch (error) {
            await connection.rollback()
            throw error
        }

    } catch (error) {
        console.error('Error al actualizar montos:', error)
        if (connection) {
            try {
                await connection.rollback()
            } catch (rollbackError) {
                console.error('Error en rollback:', rollbackError)
            }
            connection.release()
        }
        return { success: false, mensaje: 'Error al actualizar montos: ' + error.message }
    }
}

/**
 * Actualiza los datos del fiador de un contrato
 * @param {number} id - ID del contrato
 * @param {Object} datos - Datos del fiador (nombre_fiador, documento_fiador, telefono_fiador)
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function actualizarFiadorContrato(id, datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        // Verificar que el contrato existe
        const [contratos] = await connection.execute(
            `SELECT id, estado FROM contratos_financiamiento 
             WHERE id = ? AND empresa_id = ?`,
            [id, empresaId]
        )

        if (contratos.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Contrato no encontrado' }
        }

        const contrato = contratos[0]

        // Validar que el contrato puede editarse
        if (contrato.estado === ESTADOS_CONTRATO.PAGADO || contrato.estado === ESTADOS_CONTRATO.CANCELADO) {
            connection.release()
            return { success: false, mensaje: 'No se puede editar un contrato pagado o cancelado' }
        }

        // Verificar si el plan requiere fiador
        const [planes] = await connection.execute(
            `SELECT requiere_fiador FROM planes_financiamiento p
             INNER JOIN contratos_financiamiento c ON p.id = c.plan_id
             WHERE c.id = ?`,
            [id]
        )

        if (planes.length > 0 && planes[0].requiere_fiador === 1) {
            if (!datos.nombre_fiador || !datos.documento_fiador) {
                connection.release()
                return { success: false, mensaje: 'Este plan requiere un fiador. Complete nombre y documento.' }
            }
        }

        // Actualizar fiador
        await connection.execute(
            `UPDATE contratos_financiamiento 
             SET nombre_fiador = ?,
                 documento_fiador = ?,
                 telefono_fiador = ?
             WHERE id = ?`,
            [
                datos.nombre_fiador || null,
                datos.documento_fiador || null,
                datos.telefono_fiador || null,
                id
            ]
        )

        connection.release()

        return { success: true, mensaje: 'Fiador actualizado exitosamente' }

    } catch (error) {
        console.error('Error al actualizar fiador:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar fiador: ' + error.message }
    }
}

/**
 * Cancela un contrato de financiamiento
 * @param {number} id - ID del contrato
 * @param {string} razon - Razón de la cancelación
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function cancelarContratoFinanciamiento(id, razon) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            // Verificar que el contrato existe
            const [contratos] = await connection.execute(
                `SELECT id, estado, monto_financiado, cliente_id 
                 FROM contratos_financiamiento 
                 WHERE id = ? AND empresa_id = ?`,
                [id, empresaId]
            )

            if (contratos.length === 0) {
                throw new Error('Contrato no encontrado')
            }

            const contrato = contratos[0]

            // No permitir cancelar contratos ya cancelados
            if (contrato.estado === ESTADOS_CONTRATO.CANCELADO) {
                throw new Error('El contrato ya está cancelado')
            }

            // Actualizar contrato
            await connection.execute(
                `UPDATE contratos_financiamiento
                 SET estado = ?,
                     razon_estado = ?,
                     fecha_cancelacion = NOW(),
                     cancelado_por = ?
                 WHERE id = ?`,
                [ESTADOS_CONTRATO.CANCELADO, razon, userId, id]
            )

            // Actualizar límite de crédito del cliente
            await connection.execute(
                `UPDATE credito_clientes
                 SET saldo_utilizado = saldo_utilizado - ?,
                     monto_financiado_total = monto_financiado_total - ?,
                     contratos_activos = GREATEST(contratos_activos - 1, 0)
                 WHERE cliente_id = ? AND empresa_id = ?`,
                [contrato.monto_financiado, contrato.monto_financiado, contrato.cliente_id, empresaId]
            )

            // Actualizar activos asociados
            await connection.execute(
                `UPDATE activos_productos
                 SET estado = 'en_stock',
                     cliente_id = NULL,
                     contrato_financiamiento_id = NULL,
                     venta_id = NULL
                 WHERE contrato_financiamiento_id = ?`,
                [id]
            )

            await connection.commit()
            connection.release()

            return { success: true, mensaje: 'Contrato cancelado exitosamente' }

        } catch (error) {
            await connection.rollback()
            throw error
        }

    } catch (error) {
        console.error('Error al cancelar contrato:', error)
        if (connection) {
            try {
                await connection.rollback()
            } catch (rollbackError) {
                console.error('Error en rollback:', rollbackError)
            }
            connection.release()
        }
        return { success: false, mensaje: 'Error al cancelar contrato: ' + error.message }
    }
}

/**
 * Registra un pago de cuota de financiamiento
 * @param {number} cuotaId - ID de la cuota
 * @param {Object} datos - Datos del pago
 * @returns {Object} { success: boolean, mensaje?: string }
 */
export async function registrarPagoCuota(cuotaId, datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        const { monto_pago, metodo_pago, fecha_pago, numero_referencia, notas } = datos

        // Validaciones
        if (!monto_pago || parseFloat(monto_pago) <= 0) {
            return { success: false, mensaje: 'El monto debe ser mayor a cero' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            // Obtener cuota con información del contrato
            const [cuotas] = await connection.execute(
                `SELECT c.*, co.id as contrato_id, co.cliente_id, co.monto_pagado as contrato_monto_pagado,
                        co.saldo_pendiente as contrato_saldo_pendiente
                 FROM cuotas_financiamiento c
                 INNER JOIN contratos_financiamiento co ON c.contrato_id = co.id
                 WHERE c.id = ? AND c.empresa_id = ?`,
                [cuotaId, empresaId]
            )

            if (cuotas.length === 0) {
                throw new Error('Cuota no encontrada')
            }

            const cuota = cuotas[0]
            const montoPago = parseFloat(monto_pago)
            const montoPendiente = parseFloat(cuota.monto_cuota) - parseFloat(cuota.monto_pagado || 0)

            if (montoPago > montoPendiente) {
                throw new Error(`El monto no puede exceder ${montoPendiente.toFixed(2)}`)
            }

            // Generar número de recibo
            const [ultimoRecibo] = await connection.execute(
                `SELECT MAX(CAST(SUBSTRING(numero_recibo, -6) AS UNSIGNED)) as ultimo
                 FROM pagos_financiamiento WHERE empresa_id = ?`,
                [empresaId]
            )
            const numeroRecibo = `REC-${empresaId}-${(ultimoRecibo[0]?.ultimo || 0) + 1}`

            // Crear pago
            const [resultPago] = await connection.execute(
                `INSERT INTO pagos_financiamiento (
                    cuota_id, contrato_id, empresa_id, cliente_id,
                    numero_recibo, monto_pago, aplicado_capital,
                    metodo_pago, numero_referencia, fecha_pago,
                    registrado_por, estado
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    cuotaId,
                    cuota.contrato_id,
                    empresaId,
                    cuota.cliente_id,
                    numeroRecibo,
                    montoPago,
                    montoPago,
                    metodo_pago,
                    numero_referencia || null,
                    fecha_pago || new Date().toISOString().split('T')[0],
                    userId,
                    'confirmado'
                ]
            )

            // Actualizar cuota
            const nuevoMontoPagado = parseFloat(cuota.monto_pagado || 0) + montoPago
            const totalCuota = parseFloat(cuota.monto_cuota)
            let nuevoEstado = 'pendiente'

            if (nuevoMontoPagado >= totalCuota) {
                nuevoEstado = 'pagada'
            } else if (nuevoMontoPagado > 0) {
                nuevoEstado = 'parcial'
            }

            await connection.execute(
                `UPDATE cuotas_financiamiento
                 SET monto_pagado = ?,
                     estado = ?,
                     fecha_ultimo_pago = NOW()
                 WHERE id = ?`,
                [nuevoMontoPagado, nuevoEstado, cuotaId]
            )

            // Actualizar contrato
            const nuevoMontoPagadoContrato = parseFloat(cuota.contrato_monto_pagado || 0) + montoPago
            const nuevoSaldoContrato = parseFloat(cuota.contrato_saldo_pendiente || 0) - montoPago

            // Contar cuotas pagadas
            const [cuotasPagadas] = await connection.execute(
                `SELECT COUNT(*) as total FROM cuotas_financiamiento
                 WHERE contrato_id = ? AND estado = 'pagada'`,
                [cuota.contrato_id]
            )

            await connection.execute(
                `UPDATE contratos_financiamiento
                 SET monto_pagado = ?,
                     saldo_pendiente = ?,
                     cuotas_pagadas = ?,
                     fecha_ultimo_pago = NOW()
                 WHERE id = ?`,
                [
                    nuevoMontoPagadoContrato,
                    nuevoSaldoContrato,
                    parseInt(cuotasPagadas[0].total),
                    cuota.contrato_id
                ]
            )

            // Marcar alertas relacionadas como resueltas
            await connection.execute(
                `UPDATE alertas_financiamiento
                 SET estado = 'resuelta',
                     accion_realizada = 'Pago registrado automáticamente',
                     resuelta_por = ?,
                     fecha_resolucion = NOW()
                 WHERE cuota_id = ? AND empresa_id = ? AND estado IN ('activa', 'vista')`,
                [userId, cuotaId, empresaId]
            )

            await connection.commit()
            connection.release()

            return {
                success: true,
                mensaje: 'Pago registrado exitosamente',
                numero_recibo: numeroRecibo,
                montoPago: montoPago
            }

        } catch (error) {
            await connection.rollback()
            throw error
        }

    } catch (error) {
        console.error('Error al registrar pago:', error)
        if (connection) {
            try {
                await connection.rollback()
            } catch (rollbackError) {
                console.error('Error en rollback:', rollbackError)
            }
            connection.release()
        }
        return { success: false, mensaje: 'Error al registrar pago: ' + error.message }
    }
}


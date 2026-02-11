"use server"

import db from "@/_DB/db"
import {cookies} from 'next/headers'
import {obtenerCajaAbierta} from '../servidor'
import { calcularPrecioTotal } from '@/utils/unidadesUtils'
import { convertirCantidadGrafo, obtenerFactorConversionGrafo } from '@/utils/unidadesGrafoUtils'
import { obtenerGrafoCache } from '@/utils/unidadesGrafoCache'

export async function obtenerDatosVenta() {
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

        const [empresa] = await connection.execute(
            `SELECT id,
                    nombre_empresa,
                    rnc,
                    impuesto_nombre,
                    impuesto_porcentaje,
                    moneda,
                    locale,
                    simbolo_moneda
             FROM empresas
             WHERE id = ?
               AND activo = TRUE`,
            [empresaId]
        )

        if (empresa.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Empresa no encontrada'
            }
        }

        const [tiposComprobante] = await connection.execute(
            `SELECT id,
                    codigo,
                    nombre,
                    prefijo_ncf,
                    requiere_rnc,
                    requiere_razon_social
             FROM tipos_comprobante
             WHERE activo = TRUE
             ORDER BY codigo ASC`
        )

        const [tiposDocumento] = await connection.execute(
            `SELECT id,
                    codigo,
                    nombre
             FROM tipos_documento
             WHERE activo = TRUE
             ORDER BY codigo ASC`
        )

        const [unidadesMedida] = await connection.execute(
            `SELECT id, codigo, nombre, abreviatura, tipo_medida, permite_decimales
             FROM unidades_medida
             WHERE activo = TRUE
             ORDER BY nombre ASC`
        )

        connection.release()

        return {
            success: true,
            empresa: empresa[0],
            tiposComprobante: tiposComprobante,
            tiposDocumento: tiposDocumento,
            unidadesMedida: unidadesMedida
        }

    } catch (error) {
        console.error('Error al obtener datos de venta:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar datos'
        }
    }
}

export async function buscarProductos(termino) {
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

        const [productos] = await connection.execute(
            `SELECT p.id,
                    p.codigo_barras,
                    p.sku,
                    p.nombre,
                    p.precio_venta,
                    p.precio_por_unidad,
                    p.stock,
                    p.aplica_itbis,
                    p.permite_decimales,
                    p.unidad_medida_id,
                    p.unidad_venta_default_id,
                    um.nombre as unidad_medida_nombre,
                    um.abreviatura as unidad_medida_abreviatura,
                    um.tipo_medida
             FROM productos p
             LEFT JOIN unidades_medida um ON p.unidad_medida_id = um.id
             WHERE p.empresa_id = ?
               AND p.activo = TRUE
               AND (
                 p.nombre LIKE ? OR
                 p.codigo_barras LIKE ? OR
                 p.sku LIKE ?
                 )
               AND p.stock > 0
             ORDER BY p.nombre ASC LIMIT 20`,
            [empresaId, `%${termino}%`, `%${termino}%`, `%${termino}%`]
        )

        connection.release()

        return {
            success: true,
            productos: productos
        }

    } catch (error) {
        console.error('Error al buscar productos:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al buscar productos'
        }
    }
}

/**
 * Obtiene el factor de conversión entre dos unidades (para uso en cliente)
 * Soporta conversiones directas, inversas e indirectas mediante grafos
 * @param {number} unidadOrigenId - ID de unidad origen
 * @param {number} unidadDestinoId - ID de unidad destino
 * @returns {Promise<{success: boolean, factor: number|null, mensaje?: string}>}
 */
export async function obtenerFactorConversionCliente(unidadOrigenId, unidadDestinoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                factor: null,
                mensaje: 'Sesión inválida'
            }
        }

        if (!unidadOrigenId || !unidadDestinoId) {
            return {
                success: false,
                factor: null,
                mensaje: 'Unidades no especificadas'
            }
        }

        // Si son la misma unidad, factor = 1
        if (parseInt(unidadOrigenId) === parseInt(unidadDestinoId)) {
            return {
                success: true,
                factor: 1.0
            }
        }

        connection = await db.getConnection()

        // Obtener grafo cacheado para conversiones indirectas
        const grafoCache = await obtenerGrafoCache(connection, empresaId)

        // Obtener factor usando grafo (soporta rutas indirectas)
        const factor = await obtenerFactorConversionGrafo(
            parseInt(unidadOrigenId),
            parseInt(unidadDestinoId),
            connection,
            empresaId,
            grafoCache
        )

        connection.release()

        if (factor === null) {
            return {
                success: false,
                factor: null,
                mensaje: 'No existe conversión entre las unidades especificadas'
            }
        }

        return {
            success: true,
            factor: factor
        }

    } catch (error) {
        console.error('Error al obtener factor de conversión:', error)
        if (connection) connection.release()
        return {
            success: false,
            factor: null,
            mensaje: 'Error al obtener factor de conversión'
        }
    }
}

export async function obtenerClientePorId(clienteId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || !['admin', 'vendedor'].includes(userTipo)) {
            return {success: false, mensaje: 'Sesión inválida'}
        }

        if (!clienteId) {
            return {success: false, mensaje: 'ID de cliente requerido'}
        }

        connection = await db.getConnection()

        const [cliente] = await connection.execute(
            `SELECT c.id,
                    c.numero_documento,
                    CONCAT(c.nombre, ' ', IFNULL(c.apellidos, '')) AS nombre_completo,
                    td.codigo                                      AS tipo_documento,
                    c.telefono,
                    c.email,
                    c.puntos_fidelidad
             FROM clientes c
                      INNER JOIN tipos_documento td ON td.id = c.tipo_documento_id
             WHERE c.id = ?
               AND c.empresa_id = ?
               AND c.activo = TRUE
               AND c.estado = 'activo'`,
            [clienteId, empresaId]
        )

        connection.release()

        if (cliente.length === 0) {
            return {success: false, mensaje: 'Cliente no encontrado'}
        }

        return {
            success: true,
            cliente: cliente[0]
        }

    } catch (error) {
        console.error('[obtenerClientePorId]', error)
        return {
            success: false,
            mensaje: 'Error al obtener cliente'
        }
    } finally {
        if (connection) connection.release()
    }
}

export async function buscarClientes(termino = '') {
    let connection

    try {
        // =========================
        // Validación de sesión
        // =========================
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || !['admin', 'vendedor'].includes(userTipo)) {
            return {success: false, mensaje: 'Sesión inválida'}
        }

        // =========================
        // Normalizar término
        // =========================
        // =========================
        // Normalizar término
        // =========================
        const terminoLimpio = termino?.toString().trim()

        // Caso: término muy corto pero no vacío (evita búsquedas pobres)
        if (terminoLimpio.length > 0 && terminoLimpio.length < 2) {
            return {success: true, clientes: []}
        }

        connection = await db.getConnection()

        // =========================
        // Lógica de Búsqueda
        // =========================
        let sql
        let params

        if (!terminoLimpio) {
            // CASO 1: Búsqueda vacía -> Retornar últimos 10 clientes
            // Usamos la misma estructura de columnas que la búsqueda general para evitar errores en frontend
            sql = `
                SELECT c.id,
                       c.numero_documento,
                       CONCAT(c.nombre, ' ', IFNULL(c.apellidos, '')) AS nombre_completo,
                       td.codigo                                      AS tipo_documento,
                       c.telefono,
                       c.email,
                       c.puntos_fidelidad
                FROM clientes c
                         INNER JOIN tipos_documento td ON td.id = c.tipo_documento_id
                WHERE c.empresa_id = ?
                  AND c.activo = TRUE
                  AND c.estado = 'activo'
                ORDER BY c.nombre ASC LIMIT 20
            `
            params = [empresaId]
        } else {
            // CASO 2: Búsqueda General (Nombre, Apellido, Documento, Teléfono, Email)
            // Siempre incluir los 3 primeros clientes + resultados de búsqueda
            const like = `%${terminoLimpio}%`
            sql = `
                (
                    -- Primeros 3 clientes (siempre visibles)
                    SELECT c.id,
                           c.numero_documento,
                           CONCAT(c.nombre, ' ', IFNULL(c.apellidos, '')) AS nombre_completo,
                           td.codigo                                      AS tipo_documento,
                           c.telefono,
                           c.email,
                           c.puntos_fidelidad,
                           0 AS orden_prioridad
                    FROM clientes c
                             INNER JOIN tipos_documento td ON td.id = c.tipo_documento_id
                    WHERE c.empresa_id = ?
                      AND c.activo = TRUE
                      AND c.estado = 'activo'
                    ORDER BY c.nombre ASC LIMIT 3
                )
                UNION
                (
                    -- Resultados de búsqueda
                    SELECT c.id,
                           c.numero_documento,
                           CONCAT(c.nombre, ' ', IFNULL(c.apellidos, '')) AS nombre_completo,
                           td.codigo                                      AS tipo_documento,
                           c.telefono,
                           c.email,
                           c.puntos_fidelidad,
                           1 AS orden_prioridad
                    FROM clientes c
                             INNER JOIN tipos_documento td ON td.id = c.tipo_documento_id
                    WHERE c.empresa_id = ?
                      AND c.activo = TRUE
                      AND c.estado = 'activo'
                      AND (
                        c.numero_documento LIKE ?
                            OR c.nombre LIKE ?
                            OR c.apellidos LIKE ?
                            OR c.telefono LIKE ?
                            OR c.email LIKE ?
                        )
                )
                ORDER BY orden_prioridad ASC, nombre_completo ASC
                LIMIT 20
            `
            params = [
                empresaId,
                empresaId,
                like, like, like, like, like
            ]
        }

        const [clientes] = await connection.execute(sql, params)

        return {
            success: true,
            clientes
        }

    } catch (error) {
        console.error('[buscarClientes]', error)
        return {
            success: false,
            mensaje: 'Error al buscar clientes'
        }
    } finally {
        if (connection) connection.release()
    }
}


export async function crearClienteRapido(nombre) {
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

        const [tipoDocCedula] = await connection.execute(
            `SELECT id
             FROM tipos_documento
             WHERE codigo = 'CED' LIMIT 1`
        )

        if (tipoDocCedula.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Tipo de documento no encontrado'
            }
        }

        const timestamp = Date.now()
        const numeroDocumentoTemporal = `TEMP${timestamp}`

        const [resultado] = await connection.execute(
            `INSERT INTO clientes (empresa_id,
                                   tipo_documento_id,
                                   numero_documento,
                                   nombre,
                                   activo)
             VALUES (?, ?, ?, ?, TRUE)`,
            [empresaId, tipoDocCedula[0].id, numeroDocumentoTemporal, nombre]
        )

        const [nuevoCliente] = await connection.execute(
            `SELECT c.id,
                    c.nombre,
                    c.numero_documento,
                    td.codigo as tipo_documento
             FROM clientes c
                      INNER JOIN tipos_documento td ON c.tipo_documento_id = td.id
             WHERE c.id = ?`,
            [resultado.insertId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Cliente creado exitosamente',
            cliente: nuevoCliente[0]
        }

    } catch (error) {
        console.error('Error al crear cliente rapido:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear el cliente'
        }
    }
}

export async function crearVenta(datosVenta) {
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
        if (!datosVenta.metodo_pago) {
            return {
                success: false,
                mensaje: 'Método de pago requerido'
            }
        }

        if (datosVenta.metodo_pago === 'efectivo' && datosVenta.efectivo_recibido < datosVenta.total) {
            return {
                success: false,
                mensaje: 'Efectivo insuficiente'
            }
        }

        // ============================================
        // FASE 0: PRE-VALIDACIONES ESPECÍFICAS
        // ============================================

        // Validar Crédito antes de iniciar transacción
        if (datosVenta.metodo_pago === 'credito') {
            // 1. Validar Cliente
            if (!datosVenta.cliente_id) {
                return {success: false, mensaje: 'Venta a crédito requiere un cliente seleccionado'}
            }

            // 2. Obtener y Validar Estado Crediticio
            const [credito] = await connection.execute(                `SELECT *
                 FROM credito_clientes
                 WHERE cliente_id = ?
                   AND empresa_id = ?
                   AND activo = TRUE`,
                [datosVenta.cliente_id, empresaId]
            )

            if (credito.length === 0) return {success: false, mensaje: 'El cliente no tiene configuración de crédito'}

            const c = credito[0]
            if (c.estado_credito === 'bloqueado') return {
                success: false,
                mensaje: 'Crédito bloqueado por incumplimiento'
            }
            if (c.estado_credito === 'suspendido') return {success: false, mensaje: 'Crédito suspendido temporalmente'}
            if (c.clasificacion === 'D') return {
                success: false,
                mensaje: 'Cliente clasificado D (Moroso). Crédito no permitido'
            }

            if (parseFloat(c.saldo_disponible) < parseFloat(datosVenta.total)) {
                return {
                    success: false,
                    mensaje: `Venta excede saldo disponible. Disponible: ${new Intl.NumberFormat('es-DO', {
                        style: 'currency',
                        currency: 'DOP'
                    }).format(c.saldo_disponible)}`
                }
            }

            // 3. Deudas Vencidas
            const [deudas] = await connection.execute(
                `SELECT COUNT(*) as total
                 FROM cuentas_por_cobrar
                 WHERE cliente_id = ?
                   AND empresa_id = ?
                   AND estado_cxc = 'vencida'`,
                [datosVenta.cliente_id, empresaId]
            )
            if (deudas[0].total > 0) return {
                success: false,
                mensaje: 'Cliente posee facturas vencidas. Debe regularizar su estado.'
            }

            // 4. Alertas Críticas
            const [alertas] = await connection.execute(
                `SELECT COUNT(*) as total
                 FROM alertas_credito
                 WHERE cliente_id = ?
                   AND empresa_id = ?
                   AND estado = 'activa'
                   AND severidad = 'critica'`,
                [datosVenta.cliente_id, empresaId]
            )
            if (alertas[0].total > 0) return {
                success: false,
                mensaje: 'Cliente con alertas críticas de crédito activas'
            }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        // Validaciones de crédito ya realizadas en Fase 0, pero mantenemos referencia para lógica posterior se aplica
        let creditoCliente = null
        if (datosVenta.metodo_pago === 'credito') {
            const [credito] = await connection.execute(
                `SELECT *
                 FROM credito_clientes
                 WHERE cliente_id = ?
                   AND empresa_id = ?`,
                [datosVenta.cliente_id, empresaId]
            )
            creditoCliente = credito[0]
        }

        // Obtener tipo de comprobante y generar NCF
        const [tipoComprobante] = await connection.execute(
            `SELECT id,
                    codigo,
                    prefijo_ncf,
                    secuencia_actual,
                    secuencia_hasta
             FROM tipos_comprobante
             WHERE id = ?`,
            [datosVenta.tipo_comprobante_id]
        )

        if (tipoComprobante.length === 0) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Tipo de comprobante no encontrado'
            }
        }

        const secuenciaActual = tipoComprobante[0].secuencia_actual
        const secuenciaHasta = tipoComprobante[0].secuencia_hasta

        if (secuenciaActual > secuenciaHasta) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Se agotaron los NCF disponibles para este tipo de comprobante'
            }
        }

        const ncf = `${tipoComprobante[0].prefijo_ncf}${String(secuenciaActual).padStart(8, '0')}`

        await connection.execute(
            `UPDATE tipos_comprobante
             SET secuencia_actual = secuencia_actual + 1
             WHERE id = ?`,
            [datosVenta.tipo_comprobante_id]
        )

        // Generar número interno
        const [ultimaVenta] = await connection.execute(
            `SELECT MAX(CAST(SUBSTRING(numero_interno, 6) AS UNSIGNED)) as ultimo_numero
             FROM ventas
             WHERE empresa_id = ?`,
            [empresaId]
        )

        const numeroInterno = `VENTA${String((ultimaVenta[0].ultimo_numero || 0) + 1).padStart(6, '0')}`

        // Verificar stock de productos
        for (const producto of datosVenta.productos) {
            const [stockActual] = await connection.execute(
                `SELECT stock
                 FROM productos
                 WHERE id = ?
                   AND empresa_id = ?`,
                [producto.producto_id, empresaId]
            )

            if (stockActual.length === 0) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: 'Producto no encontrado'
                }
            }

            if (stockActual[0].stock < producto.cantidad_despachar) {
                await connection.rollback()
                connection.release()
                return {
                    success: false,
                    mensaje: `Stock insuficiente para el producto ID ${producto.producto_id}`
                }
            }
        }

        // Obtener caja activa (usando la nueva lógica compartida)
        const cajaId = await obtenerCajaAbierta(connection, empresaId, userId)

        if (!cajaId) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'No tienes una caja abierta. Abre una caja antes de realizar ventas.'
            }
        }
        const hayDespachoParcial = datosVenta.tipo_entrega === 'parcial'
        const despachoCompleto = !hayDespachoParcial

        // Insertar venta
        const [resultadoVenta] = await connection.execute(
            `INSERT INTO ventas (empresa_id,
                                 tipo_comprobante_id,
                                 ncf,
                                 numero_interno,
                                 usuario_id,
                                 cliente_id,
                                 caja_id,
                                 subtotal,
                                 descuento,
                                 monto_gravado,
                                 itbis,
                                 total,
                                 metodo_pago,
                                 tipo_entrega,
                                 despacho_completo,
                                 efectivo_recibido,
                                 cambio,
                                 estado,
                                 notas)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'emitida', ?)`,
            [
                empresaId,
                datosVenta.tipo_comprobante_id,
                ncf,
                numeroInterno,
                userId,
                datosVenta.cliente_id,
                cajaId,
                datosVenta.subtotal,
                datosVenta.descuento,
                datosVenta.monto_gravado,
                datosVenta.itbis,
                datosVenta.total,
                datosVenta.metodo_pago,
                datosVenta.tipo_entrega,
                despachoCompleto,
                datosVenta.efectivo_recibido,
                datosVenta.cambio,
                datosVenta.notas
            ]
        )


        const ventaId = resultadoVenta.insertId

        // ============================================
        // FASE 3: REGISTRAR CUENTA POR COBRAR
        // ============================================
        if (datosVenta.metodo_pago === 'credito' && creditoCliente) {
            const diasPlazo = creditoCliente.dias_plazo || 30
            const fechaVencimiento = new Date()
            fechaVencimiento.setDate(fechaVencimiento.getDate() + diasPlazo)
            const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0]

            // Insertar CxC (Trigger actualizará saldo_utilizado)
            await connection.execute(
                `INSERT INTO cuentas_por_cobrar (credito_cliente_id, empresa_id, cliente_id, venta_id,
                                                 origen, numero_documento, monto_total, fecha_emision,
                                                 fecha_vencimiento, fecha_vencimiento_original, creado_por)
                 VALUES (?, ?, ?, ?, 'venta', ?, ?, CURDATE(), ?, ?, ?)`,
                [
                    creditoCliente.id, empresaId, datosVenta.cliente_id, ventaId,
                    ncf, datosVenta.total, fechaVencimientoStr, fechaVencimientoStr, userId
                ]
            )
        }

        // Obtener grafo de conversiones (cache)
        const grafoCache = await obtenerGrafoCache(connection, empresaId)

        // Insertar detalle de productos
        for (const producto of datosVenta.productos) {
            // Obtener información del producto
            const [productoInfo] = await connection.execute(
                `SELECT unidad_medida_id, precio_por_unidad, unidad_venta_default_id 
                 FROM productos WHERE id = ?`,
                [producto.producto_id]
            )

            if (productoInfo.length === 0) {
                throw new Error(`Producto ${producto.producto_id} no encontrado`)
            }

            const unidadBaseId = productoInfo[0].unidad_medida_id
            const precioPorUnidad = parseFloat(productoInfo[0].precio_por_unidad) || parseFloat(producto.precio_unitario)
            const unidadUsadaId = producto.unidad_medida_id || productoInfo[0].unidad_venta_default_id || unidadBaseId
            const cantidadIngresada = parseFloat(producto.cantidad) || 0

            // Convertir cantidad a unidad base usando grafo
            let cantidadBase = cantidadIngresada
            if (unidadUsadaId !== unidadBaseId) {
                try {
                    // Verificar primero si existe conversión antes de intentar convertir
                    const factorConversion = await obtenerFactorConversionGrafo(
                        unidadUsadaId,
                        unidadBaseId,
                        connection,
                        empresaId,
                        grafoCache
                    )
                    
                    if (factorConversion && factorConversion > 0) {
                        cantidadBase = await convertirCantidadGrafo(
                            cantidadIngresada,
                            unidadUsadaId,
                            unidadBaseId,
                            connection,
                            empresaId,
                            grafoCache
                        )
                    } else {
                        // No hay conversión disponible, usar cantidad ingresada y registrar advertencia
                        console.warn(`No existe conversión entre unidad ${unidadUsadaId} y unidad base ${unidadBaseId} para producto ${producto.producto_id}. Usando cantidad ingresada sin conversión.`)
                        cantidadBase = cantidadIngresada
                    }
                } catch (error) {
                    console.error('Error en conversión:', error)
                    // Si falla la conversión, usar cantidad ingresada
                    cantidadBase = cantidadIngresada
                }
            }

            // Calcular subtotal usando cantidad base y precio por unidad
            const subtotalProducto = calcularPrecioTotal(cantidadBase, precioPorUnidad)
            const montoGravado = subtotalProducto
            const [empresa] = await connection.execute(
                `SELECT impuesto_porcentaje
                 FROM empresas
                 WHERE id = ?`,
                [empresaId]
            )
            const itbisProducto = (montoGravado * parseFloat(empresa[0].impuesto_porcentaje)) / 100
            const totalProducto = subtotalProducto + itbisProducto

            const cantidadDespachada = parseFloat(producto.cantidad_despachar || producto.cantidad) || cantidadIngresada
            const cantidadPendiente = cantidadIngresada - cantidadDespachada

            await connection.execute(
                `INSERT INTO detalle_ventas (venta_id,
                                             producto_id,
                                             unidad_medida_id,
                                             cantidad,
                                             cantidad_base,
                                             cantidad_despachada,
                                             cantidad_pendiente,
                                             precio_unitario,
                                             subtotal,
                                             descuento,
                                             monto_gravado,
                                             itbis,
                                             total)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
                [
                    ventaId,
                    producto.producto_id,
                    unidadUsadaId,
                    cantidadIngresada,
                    cantidadBase,
                    cantidadDespachada,
                    cantidadPendiente,
                    precioPorUnidad,
                    subtotalProducto,
                    montoGravado,
                    itbisProducto,
                    totalProducto
                ]
            )

            // Actualizar stock (usar cantidad_base para consistencia)
            // Calcular cantidadBaseDespachada proporcionalmente para evitar conversiones adicionales
            let cantidadBaseDespachada = cantidadDespachada
            if (unidadUsadaId !== unidadBaseId && cantidadIngresada > 0) {
                // Si ya convertimos cantidadIngresada a cantidadBase, calcular proporcionalmente
                // Esto evita tener que hacer otra conversión que podría fallar
                const proporcion = cantidadDespachada / cantidadIngresada
                cantidadBaseDespachada = cantidadBase * proporcion
            } else if (unidadUsadaId !== unidadBaseId && cantidadIngresada === 0) {
                // Si cantidadIngresada es 0, intentar convertir directamente
                try {
                    cantidadBaseDespachada = await convertirCantidadGrafo(
                        cantidadDespachada, 
                        unidadUsadaId, 
                        unidadBaseId, 
                        connection, 
                        empresaId, 
                        grafoCache
                    )
                } catch (error) {
                    console.error('Error en conversión de cantidad despachada:', error)
                    // Si falla, usar cantidadDespachada como fallback
                    cantidadBaseDespachada = cantidadDespachada
                }
            }

            await connection.execute(
                `UPDATE productos
                 SET stock = stock - ?
                 WHERE id = ?
                   AND empresa_id = ?`,
                [cantidadBaseDespachada, producto.producto_id, empresaId]
            )

            // Registrar movimiento de inventario
            const [productoActualizado] = await connection.execute(
                `SELECT stock
                 FROM productos
                 WHERE id = ?`,
                [producto.producto_id]
            )

            await connection.execute(
                `INSERT INTO movimientos_inventario (empresa_id,
                                                     producto_id,
                                                     tipo,
                                                     cantidad,
                                                     stock_anterior,
                                                     stock_nuevo,
                                                     referencia,
                                                     usuario_id,
                                                     notas)
                 VALUES (?, ?, 'salida', ?, ?, ?, ?, ?, ?)`,
                [
                    empresaId,
                    producto.producto_id,
                    cantidadBaseDespachada,
                    parseFloat(productoActualizado[0].stock) + cantidadBaseDespachada,
                    parseFloat(productoActualizado[0].stock),
                    ncf,
                    userId,
                    `Venta ${numeroInterno}`
                ]
            )
        }

        // Insertar productos extra si existen
        if (datosVenta.extras && datosVenta.extras.length > 0) {
            const [empresa] = await connection.execute(
                `SELECT impuesto_porcentaje
                 FROM empresas
                 WHERE id = ?`,
                [empresaId]
            )
            const impuestoPorcentaje = parseFloat(empresa[0].impuesto_porcentaje)

            for (const extra of datosVenta.extras) {
                const cantidad = parseFloat(extra.cantidad) || 1
                const precioUnitario = parseFloat(extra.precio_unitario) || 0
                const montoBase = cantidad * precioUnitario
                const montoImpuesto = extra.aplica_itbis ? (montoBase * impuestoPorcentaje) / 100 : 0
                const montoTotal = montoBase + montoImpuesto

                await connection.execute(
                    `INSERT INTO venta_extras (venta_id,
                                               empresa_id,
                                               usuario_id,
                                               tipo,
                                               nombre,
                                               cantidad,
                                               precio_unitario,
                                               aplica_itbis,
                                               impuesto_porcentaje,
                                               monto_base,
                                               monto_impuesto,
                                               monto_total,
                                               notas)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        ventaId,
                        empresaId,
                        userId,
                        extra.tipo || 'otro',
                        extra.nombre,
                        cantidad,
                        precioUnitario,
                        extra.aplica_itbis ? 1 : 0,
                        impuestoPorcentaje,
                        montoBase,
                        montoImpuesto,
                        montoTotal,
                        extra.notas
                    ]
                )
            }
        }

        // Crear despacho si hay despacho parcial
        if (hayDespachoParcial) {
            const [resultadoDespacho] = await connection.execute(
                `INSERT INTO despachos (venta_id,
                                        numero_despacho,
                                        usuario_id,
                                        observaciones,
                                        estado)
                 VALUES (?, 1, ?, 'Despacho inicial parcial', 'activo')`,
                [ventaId, userId]
            )

            const despachoId = resultadoDespacho.insertId

            const [detallesVenta] = await connection.execute(
                `SELECT id, cantidad_despachada
                 FROM detalle_ventas
                 WHERE venta_id = ?`,
                [ventaId]
            )

            for (const detalle of detallesVenta) {
                if (detalle.cantidad_despachada > 0) {
                    await connection.execute(
                        `INSERT INTO detalle_despachos (despacho_id,
                                                        detalle_venta_id,
                                                        cantidad_despachada)
                         VALUES (?, ?, ?)`,
                        [despachoId, detalle.id, detalle.cantidad_despachada]
                    )
                }
            }
        }

        // ============================================
        // FASE 6: ACTUALIZAR TOTALES DE CAJA
        // ============================================
        if (datosVenta.metodo_pago === 'credito') {
            // Caso Crédito: Solo suma al total vendido, NO entra dinero
            await connection.execute(
                `UPDATE cajas
                 SET total_ventas = total_ventas + ?
                 WHERE id = ?`,
                [datosVenta.total, cajaId]
            )
        } else {
            // Otros métodos: Suma total vendido Y total por tipo de pago
            await connection.execute(
                `UPDATE cajas
                 SET total_ventas          = total_ventas + ?,
                     total_efectivo        = total_efectivo + IF(? = 'efectivo', ?, 0),
                     total_tarjeta_debito  = total_tarjeta_debito + IF(? = 'tarjeta_debito', ?, 0),
                     total_tarjeta_credito = total_tarjeta_credito + IF(? = 'tarjeta_credito', ?, 0),
                     total_transferencia   = total_transferencia + IF(? = 'transferencia', ?, 0),
                     total_cheque          = total_cheque + IF(? = 'cheque', ?, 0)
                 WHERE id = ?`,
                [
                    datosVenta.total,
                    datosVenta.metodo_pago, datosVenta.total,
                    datosVenta.metodo_pago, datosVenta.total,
                    datosVenta.metodo_pago, datosVenta.total,
                    datosVenta.metodo_pago, datosVenta.total,
                    datosVenta.metodo_pago, datosVenta.total,
                    cajaId
                ]
            )
        }

        // ============================================
        // FASE 7: REGISTRAR HISTORIAL DE CRÉDITO
        // ============================================
        if (datosVenta.metodo_pago === 'credito' && creditoCliente) {
            const diasPlazo = creditoCliente.dias_plazo || 30
            const fechaVencimiento = new Date()
            fechaVencimiento.setDate(fechaVencimiento.getDate() + diasPlazo)
            const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0]

            await connection.execute(
                `INSERT INTO historial_credito (credito_cliente_id, empresa_id, cliente_id, tipo_evento,
                                                descripcion, datos_anteriores, datos_nuevos,
                                                clasificacion_momento, score_momento, generado_por, usuario_id)
                 VALUES (?, ?, ?, 'creacion_credito', ?, ?, ?, ?, ?, 'usuario', ?)`,
                [
                    creditoCliente.id,
                    empresaId,
                    datosVenta.cliente_id,
                    `Venta a crédito ${numeroInterno} - NCF: ${ncf}`,
                    JSON.stringify({
                        saldo_utilizado: creditoCliente.saldo_utilizado,
                        saldo_disponible: creditoCliente.saldo_disponible
                    }),
                    JSON.stringify({
                        venta_id: ventaId,
                        ncf: ncf,
                        monto: datosVenta.total,
                        vence: fechaVencimientoStr
                    }),
                    creditoCliente.clasificacion,
                    creditoCliente.score_crediticio,
                    userId
                ]
            )
        }

        // ============================================
        // FASE 8: ACTUALIZAR TOTALES DE CLIENTE
        // ============================================
        if (datosVenta.cliente_id) {
            await connection.execute(
                `UPDATE clientes
                 SET total_compras = total_compras + ?
                 WHERE id = ?
                   AND empresa_id = ?`,
                [datosVenta.total, datosVenta.cliente_id, empresaId]
            )
        }

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Venta creada exitosamente',
            venta: {
                id: ventaId,
                ncf: ncf,
                numero_interno: numeroInterno
            }
        }

    } catch (error) {
        console.error('Error al crear venta:', error)

        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear la venta'
        }
    }
}

export async function obtenerCreditoCliente(clienteId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {success: false, mensaje: 'Sesión no válida'}
        }

        connection = await db.getConnection()

        const [credito] = await connection.execute(
            `SELECT *
             FROM credito_clientes
             WHERE cliente_id = ?
               AND empresa_id = ?
               AND activo = TRUE`,
            [clienteId, empresaId]
        )

        connection.release()

        if (credito.length === 0) {
            return {success: false, mensaje: 'Cliente sin crédito configurado'}
        }

        return {success: true, credito: credito[0]}

    } catch (error) {
        console.error('Error al obtener crédito:', error)
        if (connection) connection.release()
        return {success: false, mensaje: 'Error al consultar crédito'}
    }
}
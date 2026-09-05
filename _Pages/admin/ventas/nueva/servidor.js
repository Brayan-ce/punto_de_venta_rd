"use server"

import db from "@/_DB/db"
import {cookies} from 'next/headers'
import {obtenerCajaAbierta} from '../servidor'
import { calcularPrecioTotal } from '@/utils/unidadesUtils'
import { convertirCantidadGrafo, obtenerFactorConversionGrafo } from '@/utils/unidadesGrafoUtils'
import { obtenerGrafoCache } from '@/utils/unidadesGrafoCache'
import { ejecutarFirmaVentaECF, obtenerEstadoFirmaECF as obtenerEstadoFirmaECFLib } from '@/lib/ecf/firmarVentaEcf'
import { ECF_SERVIDOR_API, ECF_AMBIENTE_DEFAULT } from '@/lib/ecf/apiEecf'
import { calcularScoreInicial } from '../../clientes/lib'

function sumarPeriodos(fechaStr, cantidad, frecuencia) {
    const d = new Date(fechaStr)
    if (frecuencia === 'mensual') d.setMonth(d.getMonth() + cantidad)
    if (frecuencia === 'quincenal') d.setDate(d.getDate() + cantidad * 15)
    if (frecuencia === 'semanal') d.setDate(d.getDate() + cantidad * 7)
    return d.toISOString().split('T')[0]
}

function distribuirAdelanto(numeroCuotas, cuotaMensual, capitalPorCuota, interesPorCuota, adelanto) {
    const cuotas = []
    let restante = Math.max(0, parseFloat(adelanto || 0))
    let totalCapital = 0
    let totalInteres = 0

    for (let i = 1; i <= numeroCuotas; i++) {
        if (restante <= 0) {
            cuotas.push({ numero: i, estado: 'pendiente', montoPagado: 0 })
            continue
        }
        if (restante >= cuotaMensual) {
            cuotas.push({ numero: i, estado: 'pagada', montoPagado: cuotaMensual })
            totalCapital += capitalPorCuota
            totalInteres += interesPorCuota
            restante -= cuotaMensual
        } else {
            const ratio = restante / cuotaMensual
            cuotas.push({ numero: i, estado: 'parcial', montoPagado: restante })
            totalCapital += capitalPorCuota * ratio
            totalInteres += interesPorCuota * ratio
            restante = 0
        }
    }

    return { cuotas, totalCapital, totalInteres }
}

function fechaHoyISO() {
    return new Date().toISOString().split('T')[0]
}

async function moduloHabilitado(connection, empresaId, codigoModulo) {
    const [rows] = await connection.execute(
        `SELECT COALESCE(em.habilitado, m.siempre_habilitado) AS habilitado
         FROM modulos m
         LEFT JOIN empresa_modulos em ON em.modulo_id = m.id AND em.empresa_id = ?
         WHERE m.codigo = ?
           AND m.activo = TRUE
         LIMIT 1`,
        [empresaId, codigoModulo]
    )
    if (rows.length === 0) return false
    return Boolean(rows[0].habilitado)
}

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
             WHERE activo = TRUE AND empresa_id = ?
             ORDER BY nombre ASC`,
            [empresaId]
        )

        const posHabilitado = await moduloHabilitado(connection, empresaId, 'pos')
        const financiamientoHabilitado = await moduloHabilitado(connection, empresaId, 'financiamiento')

        connection.release()

        return {
            success: true,
            empresa: empresa[0],
            tiposComprobante: tiposComprobante,
            tiposDocumento: tiposDocumento,
            unidadesMedida: unidadesMedida,
            permisosModulos: {
                pos: posHabilitado,
                financiamiento: financiamientoHabilitado,
                puedeUsarFinanciamientoEnVenta: posHabilitado && financiamientoHabilitado
            }
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
                    p.precio_mayorista,
                    p.cantidad_mayorista,
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

        if (parseInt(unidadOrigenId) === parseInt(unidadDestinoId)) {
            return {
                success: true,
                factor: 1.0
            }
        }

        connection = await db.getConnection()

        const grafoCache = await obtenerGrafoCache(connection, empresaId)

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
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || !['admin', 'vendedor'].includes(userTipo)) {
            return {success: false, mensaje: 'Sesión inválida'}
        }

        const terminoLimpio = termino?.toString().trim()

        if (terminoLimpio.length > 0 && terminoLimpio.length < 2) {
            return {success: true, clientes: []}
        }

        connection = await db.getConnection()

        let sql
        let params

        if (!terminoLimpio) {
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
            const like = `%${terminoLimpio}%`
            sql = `
                (
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

        const [clientesRaw] = await connection.execute(sql, params)
        const clientesMap = new Map()
        for (const c of clientesRaw) { if (!clientesMap.has(c.id)) clientesMap.set(c.id, c) }
        const clientes = [...clientesMap.values()]

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

        // Evitar duplicados: si ya existe un cliente con ese nombre, avisar
        const [existeCliente] = await connection.execute(
            `SELECT id
             FROM clientes
             WHERE empresa_id = ?
               AND nombre = ?
               AND COALESCE(estado, 'activo') != 'inactivo'
             LIMIT 1`,
            [empresaId, nombre]
        )

        if (existeCliente.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe un cliente con ese nombre. Poner otro nombre para continuar.'
            }
        }

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

        const clienteId = resultado.insertId

        // Crear el perfil de crédito del cliente rápido para que aparezca completo
        // en la cartera de clientes (igual que un cliente creado por el formulario).
        try {
            await connection.execute(
                `INSERT INTO credito_clientes (
                    cliente_id,
                    empresa_id,
                    limite_credito,
                    saldo_utilizado,
                    frecuencia_pago,
                    dias_plazo,
                    estado_credito,
                    clasificacion,
                    score_crediticio,
                    creado_por
                ) VALUES (?, ?, 0, 0, 'mensual', 30, 'normal', 'C', 50, ?)`,
                [clienteId, empresaId, userId]
            )
        } catch (e) {
            console.warn('No se pudo crear el crédito del cliente rápido:', e.message)
        }

        const [nuevoCliente] = await connection.execute(
            `SELECT c.id,
                    c.nombre,
                    c.numero_documento,
                    td.codigo as tipo_documento
             FROM clientes c
                      INNER JOIN tipos_documento td ON c.tipo_documento_id = td.id
             WHERE c.id = ?`,
            [clienteId]
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

export async function obtenerPlanesFinanciamientoVenta() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return { success: false, planes: [], mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        const posHabilitado = await moduloHabilitado(connection, empresaId, 'pos')
        const financiamientoHabilitado = await moduloHabilitado(connection, empresaId, 'financiamiento')
        if (!posHabilitado || !financiamientoHabilitado) {
            connection.release()
            return { success: false, planes: [], mensaje: 'Financiamiento no habilitado para esta empresa' }
        }

        const [planes] = await connection.execute(
            `SELECT id, codigo, nombre, descripcion, tasa_interes, frecuencia, monto_minimo, monto_maximo
             FROM fin_planes
             WHERE empresa_id = ?
               AND activo = 1
             ORDER BY nombre ASC`,
            [empresaId]
        )

        for (const plan of planes) {
            const [opciones] = await connection.execute(
                `SELECT id, plan_id, meses, inicial_pct
                 FROM fin_plan_opciones
                 WHERE plan_id = ?
                 ORDER BY meses ASC`,
                [plan.id]
            )
            plan.opciones = opciones
        }

        connection.release()

        return { success: true, planes }
    } catch (error) {
        console.error('Error al obtener planes de financiamiento:', error)
        if (connection) connection.release()
        return { success: false, planes: [], mensaje: 'Error al cargar planes de financiamiento' }
    }
}

export async function crearVenta(datosVenta) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId    = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo  = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        // Validaciones que NO necesitan BD — se hacen antes de abrir conexión
        const esFinanciamientoDirecto = !!datosVenta.financiamiento

        if (!datosVenta.metodo_pago) {
            return { success: false, mensaje: 'Método de pago requerido' }
        }
        if (datosVenta.metodo_pago === 'efectivo' && datosVenta.efectivo_recibido < datosVenta.total) {
            return { success: false, mensaje: 'Efectivo insuficiente' }
        }
        if (datosVenta.metodo_pago === 'credito' && !datosVenta.cliente_id) {
            return { success: false, mensaje: 'Venta a crédito requiere un cliente seleccionado' }
        }
        if (datosVenta.metodo_pago === 'mixto' && datosVenta.pagos_mixtos?.some(p => p.metodo_pago === 'credito') && !datosVenta.cliente_id) {
            return { success: false, mensaje: 'Pago mixto con crédito requiere cliente' }
        }
        if (esFinanciamientoDirecto && !datosVenta.cliente_id) {
            return { success: false, mensaje: 'El financiamiento requiere un cliente seleccionado' }
        }

        connection = await db.getConnection()

        if (esFinanciamientoDirecto) {
            const posHabilitado = await moduloHabilitado(connection, empresaId, 'pos')
            const financiamientoHabilitado = await moduloHabilitado(connection, empresaId, 'financiamiento')
            if (!posHabilitado || !financiamientoHabilitado) {
                connection.release()
                return { success: false, mensaje: 'Financiamiento no habilitado para esta empresa' }
            }
        }

        // Perfil de crédito se crea automáticamente dentro de la transacción si no existe

        await connection.beginTransaction()

        let creditoCliente = null
        const esCreditoDirecto = datosVenta.metodo_pago === 'credito' && !esFinanciamientoDirecto
        const esCreditoEnMixto = datosVenta.metodo_pago === 'mixto' && datosVenta.pagos_mixtos?.some(p => p.metodo_pago === 'credito')

        if (esCreditoDirecto || esCreditoEnMixto) {
            let [credito] = await connection.execute(
                `SELECT * FROM credito_clientes WHERE cliente_id = ? AND empresa_id = ?`,
                [datosVenta.cliente_id, empresaId]
            )
            creditoCliente = credito[0]

            if (!creditoCliente) {
                const clasificacion = 'C'
                const score = await calcularScoreInicial(clasificacion, 0)
                const limiteInicial = Math.max(datosVenta.total, 1000)
                const [res] = await connection.execute(
                    `INSERT INTO credito_clientes (cliente_id, empresa_id, limite_credito, saldo_utilizado, frecuencia_pago, dias_plazo, estado_credito, clasificacion, score_crediticio, activo, creado_por)
                     VALUES (?, ?, ?, 0, 'mensual', 30, 'normal', ?, ?, 1, ?)`,
                    [datosVenta.cliente_id, empresaId, limiteInicial, clasificacion, score, userId]
                )
                const [nuevoCredito] = await connection.execute(
                    `SELECT * FROM credito_clientes WHERE id = ?`, [res.insertId]
                )
                creditoCliente = nuevoCredito[0]
            }
        }

        const [tipoComprobante] = await connection.execute(
            `SELECT id, codigo, prefijo_ncf, secuencia_actual, secuencia_hasta FROM tipos_comprobante WHERE id = ?`,
            [datosVenta.tipo_comprobante_id]
        )
        if (tipoComprobante.length === 0) {
            await connection.rollback(); connection.release()
            return { success: false, mensaje: 'Tipo de comprobante no encontrado' }
        }

        const secuenciaActual = tipoComprobante[0].secuencia_actual
        if (secuenciaActual > tipoComprobante[0].secuencia_hasta) {
            await connection.rollback(); connection.release()
            return { success: false, mensaje: 'Se agotaron los NCF disponibles para este tipo de comprobante' }
        }

        const ncf = `${tipoComprobante[0].prefijo_ncf}${String(secuenciaActual).padStart(8, '0')}`
        await connection.execute(`UPDATE tipos_comprobante SET secuencia_actual = secuencia_actual + 1 WHERE id = ?`, [datosVenta.tipo_comprobante_id])

        const [ultimaVenta] = await connection.execute(
            `SELECT MAX(CAST(SUBSTRING(numero_interno, 6) AS UNSIGNED)) as ultimo_numero FROM ventas WHERE empresa_id = ?`,
            [empresaId]
        )
        const numeroInterno = `VENTA${String((ultimaVenta[0].ultimo_numero || 0) + 1).padStart(6, '0')}`

        for (const producto of datosVenta.productos) {
            const [stock] = await connection.execute(`SELECT stock FROM productos WHERE id = ? AND empresa_id = ?`, [producto.producto_id, empresaId])
            if (stock.length === 0) { await connection.rollback(); connection.release(); return { success: false, mensaje: 'Producto no encontrado' } }
            if (stock[0].stock < producto.cantidad_despachar) { await connection.rollback(); connection.release(); return { success: false, mensaje: `Stock insuficiente para producto ID ${producto.producto_id}` } }
        }

        const cajaId = await obtenerCajaAbierta(connection, empresaId, userId)
        if (!cajaId) { await connection.rollback(); connection.release(); return { success: false, mensaje: 'No tienes una caja abierta. Abre una caja antes de realizar ventas.' } }

        const hayDespachoParcial = datosVenta.tipo_entrega === 'parcial'

        const [resultadoVenta] = await connection.execute(
            `INSERT INTO ventas (empresa_id, tipo_comprobante_id, ncf, numero_interno, usuario_id, cliente_id, caja_id, subtotal, descuento, monto_gravado, itbis, total, metodo_pago, tipo_entrega, despacho_completo, efectivo_recibido, cambio, estado, notas)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'emitida', ?)`,
            [empresaId, datosVenta.tipo_comprobante_id, ncf, numeroInterno, userId, datosVenta.cliente_id, cajaId, datosVenta.subtotal, datosVenta.descuento, datosVenta.monto_gravado, datosVenta.itbis, datosVenta.total, datosVenta.metodo_pago, datosVenta.tipo_entrega, !hayDespachoParcial, datosVenta.efectivo_recibido, datosVenta.cambio, datosVenta.notas]
        )
        const ventaId = resultadoVenta.insertId

        if (datosVenta.metodo_pago === 'mixto' && datosVenta.pagos_mixtos?.length) {
            for (const pago of datosVenta.pagos_mixtos) {
                await connection.execute(
                    `INSERT INTO ventas_pagos_mixtos (venta_id, metodo_pago, monto) VALUES (?, ?, ?)`,
                    [ventaId, pago.metodo_pago, pago.monto]
                )
            }
        }

        if (creditoCliente) {
            const montoCredito = esCreditoDirecto
                ? datosVenta.total
                : (datosVenta.pagos_mixtos.find(p => p.metodo_pago === 'credito')?.monto || 0)

            const diasPlazo = creditoCliente.dias_plazo || 30
            const fechaVenc = new Date()
            fechaVenc.setDate(fechaVenc.getDate() + diasPlazo)
            const fechaVencStr = fechaVenc.toISOString().split('T')[0]

            await connection.execute(
                `INSERT INTO cuentas_por_cobrar (credito_cliente_id, empresa_id, cliente_id, venta_id, origen, numero_documento, monto_total, fecha_emision, fecha_vencimiento, fecha_vencimiento_original, creado_por)
                 VALUES (?, ?, ?, ?, 'venta', ?, ?, CURDATE(), ?, ?, ?)`,
                [creditoCliente.id, empresaId, datosVenta.cliente_id, ventaId, ncf, montoCredito, fechaVencStr, fechaVencStr, userId]
            )
        }

        if (esFinanciamientoDirecto) {
            const datosFin = datosVenta.financiamiento || {}
            const planId = parseInt(datosFin.plan_id)
            const opcionId = datosFin.opcion_id ? parseInt(datosFin.opcion_id) : null

            if (!planId) {
                await connection.rollback(); connection.release()
                return { success: false, mensaje: 'Debe seleccionar un plan de financiamiento' }
            }

            const [planes] = await connection.execute(
                `SELECT id, tasa_interes, frecuencia, monto_minimo, monto_maximo
                 FROM fin_planes
                 WHERE id = ? AND empresa_id = ? AND activo = 1`,
                [planId, empresaId]
            )

            if (!planes.length) {
                await connection.rollback(); connection.release()
                return { success: false, mensaje: 'Plan de financiamiento no encontrado o inactivo' }
            }

            const plan = planes[0]
            let numeroCuotas = null

            if (datosFin.meses_manual && parseInt(datosFin.meses_manual) > 0) {
                numeroCuotas = parseInt(datosFin.meses_manual)
            } else if (opcionId) {
                const [opciones] = await connection.execute(
                    `SELECT id, meses FROM fin_plan_opciones WHERE id = ? AND plan_id = ?`,
                    [opcionId, planId]
                )
                if (!opciones.length) {
                    await connection.rollback(); connection.release()
                    return { success: false, mensaje: 'Opción de plazo no encontrada para el plan seleccionado' }
                }
                numeroCuotas = parseInt(opciones[0].meses)
            }

            if (!numeroCuotas || numeroCuotas <= 0) {
                await connection.rollback(); connection.release()
                return { success: false, mensaje: 'Debes definir el número de cuotas del financiamiento' }
            }

            const montoTotal = parseFloat(datosVenta.total || 0)
            const montoAdelantado = parseFloat(datosFin.monto_adelantado || 0)
            const montoFinanciado = montoTotal
            const montoInicial = montoAdelantado

            if (montoFinanciado <= 0) {
                await connection.rollback(); connection.release()
                return { success: false, mensaje: 'El monto financiado debe ser mayor que cero' }
            }

            if (plan.monto_minimo && montoFinanciado < parseFloat(plan.monto_minimo)) {
                await connection.rollback(); connection.release()
                return { success: false, mensaje: `El monto mínimo financiable para el plan es ${plan.monto_minimo}` }
            }
            if (plan.monto_maximo && montoFinanciado > parseFloat(plan.monto_maximo)) {
                await connection.rollback(); connection.release()
                return { success: false, mensaje: `El monto máximo financiable para el plan es ${plan.monto_maximo}` }
            }

            const tasaInteres = parseFloat(plan.tasa_interes || 0)
            const totalPagar = montoFinanciado * (1 + tasaInteres / 100)
            const totalIntereses = totalPagar - montoFinanciado
            const cuotaMensual = totalPagar / numeroCuotas
            const interesPorCuota = totalIntereses / numeroCuotas
            const capitalPorCuota = montoFinanciado / numeroCuotas

            if (montoAdelantado < 0) {
                await connection.rollback(); connection.release()
                return { success: false, mensaje: 'El adelanto no puede ser negativo' }
            }
            if (montoAdelantado >= totalPagar) {
                await connection.rollback(); connection.release()
                return { success: false, mensaje: 'El adelanto debe ser menor al total a pagar' }
            }

            const { cuotas: cuotasAdelanto, totalCapital: adelantoCapital, totalInteres: adelantoInteres } =
                distribuirAdelanto(numeroCuotas, cuotaMensual, capitalPorCuota, interesPorCuota, montoAdelantado)

            const saldoPendiente = totalPagar - montoAdelantado

            const fechaInicio = fechaHoyISO()
            const fechaPrimerPago = datosFin.fecha_primer_pago || sumarPeriodos(fechaInicio, 1, plan.frecuencia)
            const fechaFin = sumarPeriodos(fechaPrimerPago, Math.max(0, numeroCuotas - 1), plan.frecuencia)

            let secuencia = 0
            let numeroContrato
            while (true) {
                secuencia++
                numeroContrato = `FIN-${empresaId}-${String(secuencia).padStart(6, '0')}`
                const [[{ cnt }]] = await connection.execute(
                    `SELECT COUNT(*) as cnt FROM fin_contratos WHERE numero = ?`,
                    [numeroContrato]
                )
                if (cnt === 0) break
            }

            const productosRef = (datosVenta.productos || [])
                .map((p) => p.nombre_producto)
                .filter(Boolean)
            const textoProductos = productosRef.length > 0
                ? `Productos: ${productosRef.join(', ')}`
                : ''

            const notasFin = [
                `Generado desde venta ${numeroInterno} (${ncf})`,
                textoProductos,
                datosFin.notas || ''
            ].filter(Boolean).join(' | ')

            let sqlContrato
            let paramsContrato

            if (opcionId) {
                sqlContrato = `INSERT INTO fin_contratos
                    (empresa_id, usuario_id, cliente_id, plan_id, opcion_id, numero,
                     monto_total, monto_inicial, monto_financiado, total_intereses, total_pagar,
                     saldo_pendiente, meses, frecuencia, tasa_interes, cuota_mensual,
                     fecha_inicio, fecha_fin, notas, estado)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
                paramsContrato = [
                    empresaId, userId, datosVenta.cliente_id, planId, opcionId,
                    numeroContrato,
                    montoTotal, montoInicial, montoFinanciado, totalIntereses, totalPagar,
                    saldoPendiente, numeroCuotas, plan.frecuencia, tasaInteres, cuotaMensual,
                    fechaInicio, fechaFin, notasFin, 'activo'
                ]
            } else {
                sqlContrato = `INSERT INTO fin_contratos
                    (empresa_id, usuario_id, cliente_id, plan_id, numero,
                     monto_total, monto_inicial, monto_financiado, total_intereses, total_pagar,
                     saldo_pendiente, meses, frecuencia, tasa_interes, cuota_mensual,
                     fecha_inicio, fecha_fin, notas, estado)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
                paramsContrato = [
                    empresaId, userId, datosVenta.cliente_id, planId,
                    numeroContrato,
                    montoTotal, montoInicial, montoFinanciado, totalIntereses, totalPagar,
                    saldoPendiente, numeroCuotas, plan.frecuencia, tasaInteres, cuotaMensual,
                    fechaInicio, fechaFin, notasFin, 'activo'
                ]
            }

            const [resContrato] = await connection.execute(sqlContrato, paramsContrato)
            const contratoId = resContrato.insertId

            const cuotasInsertadas = []
            for (let i = 1; i <= numeroCuotas; i++) {
                const fechaVenc = sumarPeriodos(fechaPrimerPago, i - 1, plan.frecuencia)
                const infoAdelanto = cuotasAdelanto[i - 1]
                const estadoCuota = infoAdelanto.estado
                const fechaPago = estadoCuota !== 'pendiente' ? fechaInicio : null

                const [cuotaRes] = await connection.execute(
                    `INSERT INTO fin_cuotas
                        (contrato_id, empresa_id, numero, monto, capital, interes, mora, fecha_vencimiento, fecha_pago, estado)
                     VALUES (?,?,?,?,?,?,0,?,?,?)`,
                    [contratoId, empresaId, i, cuotaMensual, capitalPorCuota, interesPorCuota, fechaVenc, fechaPago, estadoCuota]
                )
                cuotasInsertadas.push({ id: cuotaRes.insertId, ...infoAdelanto })
            }

            if (montoAdelantado > 0) {
                const [pagoRes] = await connection.execute(
                    `INSERT INTO fin_pagos
                        (contrato_id, empresa_id, usuario_id, monto, monto_capital, monto_interes, monto_mora, metodo_pago_id, referencia, notas, fecha)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                    [
                        contratoId, empresaId, userId,
                        montoAdelantado, adelantoCapital, adelantoInteres, 0,
                        null, null,
                        `Pago adelantado desde venta ${numeroInterno}`,
                        fechaInicio
                    ]
                )
                const pagoId = pagoRes.insertId
                for (const c of cuotasInsertadas) {
                    if (c.montoPagado > 0) {
                        await connection.execute(
                            `INSERT INTO fin_pago_cuotas (pago_id, cuota_id, monto) VALUES (?,?,?)`,
                            [pagoId, c.id, c.montoPagado]
                        )
                    }
                }
            }
        }

        const grafoCache = await obtenerGrafoCache(connection, empresaId)

        for (const producto of datosVenta.productos) {
            const [productoInfo] = await connection.execute(
                `SELECT unidad_medida_id, precio_por_unidad, unidad_venta_default_id FROM productos WHERE id = ?`,
                [producto.producto_id]
            )
            if (productoInfo.length === 0) throw new Error(`Producto ${producto.producto_id} no encontrado`)

            const unidadBaseId    = productoInfo[0].unidad_medida_id
            const precioPorUnidad = parseFloat(producto.precio_unitario_usado || productoInfo[0].precio_por_unidad) || parseFloat(producto.precio_unitario)
            const unidadUsadaId   = producto.unidad_medida_id || productoInfo[0].unidad_venta_default_id || unidadBaseId
            const cantidadIngresada = parseFloat(producto.cantidad) || 0

            let cantidadBase = cantidadIngresada
            if (unidadUsadaId !== unidadBaseId) {
                try {
                    const factor = await obtenerFactorConversionGrafo(unidadUsadaId, unidadBaseId, connection, empresaId, grafoCache)
                    if (factor && factor > 0) {
                        cantidadBase = await convertirCantidadGrafo(cantidadIngresada, unidadUsadaId, unidadBaseId, connection, empresaId, grafoCache)
                    }
                } catch (e) { console.error('Error conversión:', e) }
            }

            const subtotalProducto = calcularPrecioTotal(cantidadBase, precioPorUnidad)
            const [empresa] = await connection.execute(`SELECT impuesto_porcentaje FROM empresas WHERE id = ?`, [empresaId])
            const itbisProducto = (subtotalProducto * parseFloat(empresa[0].impuesto_porcentaje)) / 100
            const totalProducto  = subtotalProducto + itbisProducto
            const cantidadDespachada = parseFloat(producto.cantidad_despachar || producto.cantidad) || cantidadIngresada
            const cantidadPendiente  = cantidadIngresada - cantidadDespachada

            await connection.execute(
                `INSERT INTO detalle_ventas (venta_id, producto_id, unidad_medida_id, cantidad, cantidad_base, cantidad_despachada, cantidad_pendiente, precio_unitario, subtotal, descuento, monto_gravado, itbis, total)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
                [ventaId, producto.producto_id, unidadUsadaId, cantidadIngresada, cantidadBase, cantidadDespachada, cantidadPendiente, precioPorUnidad, subtotalProducto, subtotalProducto, itbisProducto, totalProducto]
            )

            let cantidadBaseDespachada = cantidadDespachada
            if (unidadUsadaId !== unidadBaseId && cantidadIngresada > 0) {
                cantidadBaseDespachada = cantidadBase * (cantidadDespachada / cantidadIngresada)
            }

            await connection.execute(`UPDATE productos SET stock = stock - ? WHERE id = ? AND empresa_id = ?`, [cantidadBaseDespachada, producto.producto_id, empresaId])

            const [prodActualizado] = await connection.execute(`SELECT stock FROM productos WHERE id = ?`, [producto.producto_id])
            await connection.execute(
                `INSERT INTO movimientos_inventario (empresa_id, producto_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia, usuario_id, notas) VALUES (?, ?, 'salida', ?, ?, ?, ?, ?, ?)`,
                [empresaId, producto.producto_id, cantidadBaseDespachada, parseFloat(prodActualizado[0].stock) + cantidadBaseDespachada, parseFloat(prodActualizado[0].stock), ncf, userId, `Venta ${numeroInterno}`]
            )
        }

        if (datosVenta.extras?.length > 0) {
            const [empresa] = await connection.execute(`SELECT impuesto_porcentaje FROM empresas WHERE id = ?`, [empresaId])
            const pct = parseFloat(empresa[0].impuesto_porcentaje)
            for (const extra of datosVenta.extras) {
                const cant    = parseFloat(extra.cantidad) || 1
                const precio  = parseFloat(extra.precio_unitario) || 0
                const base    = cant * precio
                const impuesto = extra.aplica_itbis ? (base * pct) / 100 : 0
                await connection.execute(
                    `INSERT INTO venta_extras (venta_id, empresa_id, usuario_id, tipo, nombre, cantidad, precio_unitario, aplica_itbis, impuesto_porcentaje, monto_base, monto_impuesto, monto_total, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [ventaId, empresaId, userId, extra.tipo || 'otro', extra.nombre, cant, precio, extra.aplica_itbis ? 1 : 0, pct, base, impuesto, base + impuesto, extra.notas]
                )
            }
        }

        if (hayDespachoParcial) {
            const [resDespacho] = await connection.execute(
                `INSERT INTO despachos (venta_id, numero_despacho, usuario_id, observaciones, estado) VALUES (?, 1, ?, 'Despacho inicial parcial', 'activo')`,
                [ventaId, userId]
            )
            const despachoId = resDespacho.insertId
            const [detallesVenta] = await connection.execute(`SELECT id, cantidad_despachada FROM detalle_ventas WHERE venta_id = ?`, [ventaId])
            for (const d of detallesVenta) {
                if (d.cantidad_despachada > 0) {
                    await connection.execute(`INSERT INTO detalle_despachos (despacho_id, detalle_venta_id, cantidad_despachada) VALUES (?, ?, ?)`, [despachoId, d.id, d.cantidad_despachada])
                }
            }
        }

        if (datosVenta.metodo_pago === 'mixto' && datosVenta.pagos_mixtos?.length) {
            await connection.execute(`UPDATE cajas SET total_ventas = total_ventas + ? WHERE id = ?`, [datosVenta.total, cajaId])
            for (const pago of datosVenta.pagos_mixtos) {
                if (pago.metodo_pago === 'credito') continue
                const col = {
                    efectivo:        'total_efectivo',
                    tarjeta_debito:  'total_tarjeta_debito',
                    tarjeta_credito: 'total_tarjeta_credito',
                    transferencia:   'total_transferencia',
                    cheque:          'total_cheque',
                }[pago.metodo_pago]
                if (col) {
                    await connection.execute(`UPDATE cajas SET ${col} = ${col} + ? WHERE id = ?`, [pago.monto, cajaId])
                }
            }
        } else if (datosVenta.metodo_pago === 'credito') {
            await connection.execute(`UPDATE cajas SET total_ventas = total_ventas + ? WHERE id = ?`, [datosVenta.total, cajaId])
        } else {
            await connection.execute(
                `UPDATE cajas SET total_ventas = total_ventas + ?,
                    total_efectivo        = total_efectivo        + IF(? = 'efectivo',        ?, 0),
                    total_tarjeta_debito  = total_tarjeta_debito  + IF(? = 'tarjeta_debito',  ?, 0),
                    total_tarjeta_credito = total_tarjeta_credito + IF(? = 'tarjeta_credito', ?, 0),
                    total_transferencia   = total_transferencia   + IF(? = 'transferencia',   ?, 0),
                    total_cheque          = total_cheque          + IF(? = 'cheque',          ?, 0)
                 WHERE id = ?`,
                [datosVenta.total, datosVenta.metodo_pago, datosVenta.total, datosVenta.metodo_pago, datosVenta.total, datosVenta.metodo_pago, datosVenta.total, datosVenta.metodo_pago, datosVenta.total, datosVenta.metodo_pago, datosVenta.total, cajaId]
            )
        }

        if (creditoCliente) {
            const montoCredito = esCreditoDirecto
                ? datosVenta.total
                : (datosVenta.pagos_mixtos.find(p => p.metodo_pago === 'credito')?.monto || 0)

            const diasPlazo = creditoCliente.dias_plazo || 30
            const fechaVenc = new Date()
            fechaVenc.setDate(fechaVenc.getDate() + diasPlazo)

            await connection.execute(
                `INSERT INTO historial_credito (credito_cliente_id, empresa_id, cliente_id, tipo_evento, descripcion, datos_anteriores, datos_nuevos, clasificacion_momento, score_momento, generado_por, usuario_id)
                 VALUES (?, ?, ?, 'creacion_credito', ?, ?, ?, ?, ?, 'usuario', ?)`,
                [
                    creditoCliente.id, empresaId, datosVenta.cliente_id,
                    `Venta ${esCreditoEnMixto ? 'mixta con' : 'a'} crédito ${numeroInterno} - NCF: ${ncf}`,
                    JSON.stringify({ saldo_utilizado: creditoCliente.saldo_utilizado, saldo_disponible: creditoCliente.saldo_disponible }),
                    JSON.stringify({ venta_id: ventaId, ncf, monto: montoCredito, vence: fechaVenc.toISOString().split('T')[0] }),
                    creditoCliente.clasificacion, creditoCliente.score_crediticio, userId
                ]
            )
        }

        if (datosVenta.cliente_id) {
            await connection.execute(`UPDATE clientes SET total_compras = total_compras + ? WHERE id = ? AND empresa_id = ?`, [datosVenta.total, datosVenta.cliente_id, empresaId])
        }

        await connection.commit()
        connection.release()

        return { success: true, mensaje: 'Venta creada exitosamente', venta: { id: ventaId, ncf, numero_interno: numeroInterno } }

    } catch (error) {
        console.error('Error al crear venta:', error)
        if (connection) { await connection.rollback(); connection.release() }
        return { success: false, mensaje: 'Error al crear la venta' }
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
               AND empresa_id = ?`,
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

/**
 * ===============================================================
 * FUNCIONES DE FIRMA ELECTRÓNICA ECF (API-EECF EFRENIS SOFT)
 * ===============================================================
 */

/**
 * ECF apunta al servidor EFRENIS — definido en lib/ecf/apiEecf.js
 */
export async function obtenerConfiguracionECF() {
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        return {
            success: true,
            configurado: true,
            configuracion: {
                servidor_api: ECF_SERVIDOR_API,
                ambiente: ECF_AMBIENTE_DEFAULT,
                activo: true
            }
        }

    } catch (error) {
        console.error('Error al obtener configuración ECF:', error)
        return { success: false, mensaje: 'Error al obtener configuración' }
    }
}

/**
 * Firma electrónicamente una venta usando la API-EECF (EFRENIS SOFT)
 */
export async function firmarVentaECF(ventaId, ambienteOverride = null) {
    return ejecutarFirmaVentaECF(ventaId, ambienteOverride)
}

/**
 * Obtiene el estado de firma de una venta
 */
export async function obtenerEstadoFirmaECF(ventaId) {
    return obtenerEstadoFirmaECFLib(ventaId)
}
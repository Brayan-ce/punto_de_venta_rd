/**
 * API-EECF (EFRENIS SOFT) — construcción INI y parseo de respuesta
 * Documentación: formato texto .ini v26.001
 * Endpoint: POST http://marcopinero.ddns.net:8000/api-eecf/testecf (cuerpo INI text/plain)
 */

/** Servidor API-EECF (EFRENIS SOFT) */
export const ECF_SERVIDOR_API = 'http://marcopinero.ddns.net:8000'
export const ECF_AMBIENTE_DEFAULT = 'testecf'
/** RNC emisor ofuscado en código (98 al inicio y al medio); se decodifica al firmar */
export const ECF_RNC_EMISOR = '981309830014'

const MAP_PREFIJO_B_A_E = {
    B01: 'E32', B02: 'E31', B03: 'E33', B04: 'E34',
    B14: 'E44', B15: 'E45', B16: 'E46',
}

/** e-NCF DGII: 3 letras tipo (E32) + 10 dígitos secuencia = 13 caracteres */
const LONGITUD_SECUENCIA_ECF = 10

export function codigoTipoComprobanteECF(tipoComprobante, ncf) {
    const comp = String(ncf || '').trim().toUpperCase()
    const desdeB = comp.match(/^(B\d{2})/)
    if (desdeB && MAP_PREFIJO_B_A_E[desdeB[1]]) return MAP_PREFIJO_B_A_E[desdeB[1]]

    const desdeNcf = comp.match(/^(E\d{2})/)
    if (desdeNcf) return desdeNcf[1]

    const raw = String(tipoComprobante?.codigo || tipoComprobante?.prefijo_ncf || 'E32').trim().toUpperCase()
    if (MAP_PREFIJO_B_A_E[raw]) return MAP_PREFIJO_B_A_E[raw]
    if (raw.startsWith('E')) return raw.substring(0, 3)
    return 'E32'
}

export function normalizarComprobanteECF(ncf, tipoComprobante) {
    const comp = String(ncf || '').trim().toUpperCase().replace(/\s/g, '')
    const prefijoDefault = codigoTipoComprobanteECF(tipoComprobante, comp)

    if (!comp) {
        return `${prefijoDefault}${String(1).padStart(LONGITUD_SECUENCIA_ECF, '0')}`
    }

    const matchB = comp.match(/^(B\d{2})(\d+)$/i)
    if (matchB) {
        const prefijoE = MAP_PREFIJO_B_A_E[matchB[1].toUpperCase()] || prefijoDefault
        const secuencia = matchB[2].padStart(LONGITUD_SECUENCIA_ECF, '0').slice(-LONGITUD_SECUENCIA_ECF)
        return `${prefijoE}${secuencia}`
    }

    const matchE = comp.match(/^(E\d{2})(\d+)$/i)
    if (matchE) {
        const secuencia = matchE[2].padStart(LONGITUD_SECUENCIA_ECF, '0').slice(-LONGITUD_SECUENCIA_ECF)
        return `${matchE[1].toUpperCase()}${secuencia}`
    }

    return comp
}

export function normalizarServidorApi(url) {
    const limpio = String(url || '').trim().replace(/\/+$/, '')
    if (!limpio) return ''
    if (!/^https?:\/\//i.test(limpio)) {
        return `http://${limpio.replace(/^\/+/, '')}`
    }
    return limpio
}

export function resolverServidorApi() {
    return { url: ECF_SERVIDOR_API, origen: 'efrenis' }
}

/** EFRENIS no instalado, apagado o sin API-EECF — debe proveer puerto y configuración */
export function mensajeErrorConexionECF(error) {
    const contactoEfrenis =
        'Solicite al equipo técnico de EFRENIS SOFT el puerto y la configuración de conexión (API-EECF) para este equipo.'

    const base = {
        tipo: 'conexion',
        titulo: 'Pendiente integración con EFRENIS',
    }

    if (error?.name === 'AbortError') {
        return {
            ...base,
            codigo: 'ECF_SIN_RESPUESTA',
            mensaje: `No hubo respuesta del servicio de firma. El POS ya intentó conectar; falta que EFRENIS instale y active API-EECF. ${contactoEfrenis}`
        }
    }

    const detalle = String(
        error?.cause?.code || error?.code || error?.message || error || ''
    ).toLowerCase()

    if (
        detalle.includes('econnrefused') ||
        detalle.includes('fetch failed') ||
        detalle.includes('enotfound') ||
        detalle.includes('ehostunreach') ||
        detalle.includes('network') ||
        detalle.includes('socket')
    ) {
        return {
            ...base,
            codigo: 'ECF_SIN_CONEXION',
            mensaje: `No se detecta el servicio de firma en este equipo (puerto ${ECF_SERVIDOR_API.replace(/^https?:\/\//, '')}). ${contactoEfrenis}`
        }
    }

    return {
        ...base,
        codigo: 'ECF_SIN_CONEXION',
        mensaje: `No se pudo comunicar con EFRENIS. ${contactoEfrenis}`
    }
}

/** Servicio responde pero rechaza el comprobante */
export function mensajeErrorValidacionECF(mensajeApi) {
    const detalle = String(mensajeApi || '').trim()
        || 'Revise montos, ITBIS, cliente, NCF o líneas del detalle.'

    if (/\.p12\s+not\s+found/i.test(detalle)) {
        return {
            codigo: 'ECF_CERTIFICADO',
            tipo: 'validacion',
            titulo: 'Certificado digital pendiente en EFRENIS',
            mensaje: 'El comprobante fue validado, pero EFRENIS no tiene el certificado (.p12) de esta empresa en el servidor. Solicite a EFRENIS SOFT que cargue el certificado del RNC emisor.'
        }
    }

    if (/respuesta inválida/i.test(detalle)) {
        return {
            codigo: 'ECF_VALIDACION',
            tipo: 'validacion',
            titulo: 'EFRENIS activo — sin datos de firma',
            mensaje: 'EFRENIS validó el comprobante pero no devolvió código de seguridad ni QR. Confirme con EFRENIS que el certificado (.p12) esté instalado y que el endpoint de firma esté activo.'
        }
    }

    return {
        codigo: 'ECF_VALIDACION',
        tipo: 'validacion',
        titulo: 'EFRENIS activo — error en este comprobante',
        mensaje: `EFRENIS respondió correctamente. El rechazo es por los datos de la factura: ${detalle}`
    }
}

function formatFechaISO(valor) {
    if (!valor) return new Date().toISOString().split('T')[0]
    const d = new Date(valor)
    if (Number.isNaN(d.getTime())) return new Date().toISOString().split('T')[0]
    return d.toISOString().split('T')[0]
}

function limpiarTexto(valor, max = 120) {
    return String(valor || '')
        .replace(/\|/g, ' ')
        .replace(/\r?\n/g, ' ')
        .trim()
        .substring(0, max)
}

function esTextoEmpresaValido(valor) {
    if (valor == null) return false
    const v = String(valor).trim()
    if (!v || /^\.+$/.test(v) || v === '-') return false
    const lower = v.toLowerCase()
    return !['por definir', 'direccion pendiente', 'dirección pendiente', 'n/a', 'na', 'null', 'undefined'].includes(lower)
}

function resolverRazonSocialEmisor(empresa) {
    const nombre = limpiarTexto(empresa?.nombre_empresa)
    const razon = limpiarTexto(empresa?.razon_social)
    if (esTextoEmpresaValido(razon) && razon.toLowerCase() !== nombre.toLowerCase()) return razon
    return nombre || razon || 'EMPRESA'
}

function resolverDireccionEmisor(empresa) {
    const dir = limpiarTexto(empresa?.direccion)
    if (!esTextoEmpresaValido(dir) || /pendiente/i.test(dir)) return 'SIN DIRECCION'
    return dir
}

function limpiarRnc(valor) {
    return String(valor || '').replace(/\D/g, '')
}

function decodificarRncEmisorConfig(valor) {
    let r = limpiarRnc(valor)
    if (r.startsWith('98')) r = r.slice(2)
    if (r.length > 5 && r.slice(3, 5) === '98') {
        r = r.slice(0, 3) + r.slice(5)
    }
    return r
}

/** RNC del emisor en el INI — decodifica el valor ofuscado de EFRENIS */
export function resolverRncEmisor(datosEmpresa) {
    const rncEfrenis = decodificarRncEmisorConfig(ECF_RNC_EMISOR)
    if (rncEfrenis.length >= 9) return rncEfrenis
    return limpiarRnc(datosEmpresa?.rnc) || '000000000'
}

/** Tipos e-CF que exigen comprador con RNC (DGII / EFRENIS) */
const TIPOS_REQUIEREN_RNC_COMPRADOR = new Set([
    'E31', 'E33', 'E34', 'E41', 'E44', 'E45', 'E46'
])

export function validarRequisitosFirmaECF(datosVenta, tipoComprobante) {
    const tipoCodigo = codigoTipoComprobanteECF(tipoComprobante, datosVenta.ncf)
    const total = parseFloat(datosVenta?.total || 0)
    const nombreCliente = limpiarTexto(datosVenta?.cliente_nombre)
    const rncCliente = limpiarRnc(datosVenta?.cliente_numero_documento)

    const faltaComprador = () => ({
        valido: false,
        codigo: 'ECF_VALIDACION',
        tipo: 'validacion',
        titulo: 'Faltan datos del comprador',
        mensaje: tipoCodigo === 'E32'
            ? 'Esta factura de consumo (E32) supera RD$250,000 y requiere cliente con RNC/Cédula. Asigne un cliente a la venta antes de firmar.'
            : `El comprobante ${tipoCodigo} requiere cliente con RNC/Cédula en DGII. Asigne un cliente a la venta o use factura de consumo (E32) si aplica.`
    })

    if (tipoCodigo === 'E32' && total >= 250000) {
        if (!nombreCliente || rncCliente.length < 9) return faltaComprador()
    } else if (TIPOS_REQUIEREN_RNC_COMPRADOR.has(tipoCodigo)) {
        if (!nombreCliente || rncCliente.length < 9) return faltaComprador()
    }

    const rncEmisor = limpiarRnc(datosVenta?.empresa_rnc)
    if (rncEmisor && rncEmisor.length < 9) {
        return {
            valido: false,
            codigo: 'ECF_VALIDACION',
            tipo: 'validacion',
            titulo: 'RNC del emisor incompleto',
            mensaje: 'Configure el RNC de la empresa correctamente antes de firmar.'
        }
    }

    const comprobante = normalizarComprobanteECF(datosVenta?.ncf, tipoComprobante)
    if (!/^[A-Z0-9]{13}$/.test(comprobante)) {
        return {
            valido: false,
            codigo: 'ECF_VALIDACION',
            tipo: 'validacion',
            titulo: 'e-NCF con formato inválido',
            mensaje: `El comprobante "${comprobante}" debe tener exactamente 13 caracteres (ej. E320000002020). Revise la secuencia NCF de la venta.`
        }
    }

    return { valido: true }
}

function resolverCodigoImpuesto(item, pctEmpresa = 18) {
    const aplica = item.aplica_itbis !== false && item.aplica_itbis !== 0
    if (!aplica) return 'EX'
    const pct = parseFloat(item.impuesto_porcentaje ?? pctEmpresa)
    if (pct === 0) return '0'
    if (pct === 16) return '16'
    return '18'
}

function montoIni(valor) {
    const n = parseFloat(valor) || 0
    return n.toFixed(2)
}

function construirSeccionPagos(datosVenta) {
    const dist = {
        Efectivo: 0,
        Banco: 0,
        Tarjeta: 0,
        Credito: 0,
        Bonos: 0,
        Permuta: 0,
        NotaCredito: 0,
        Otra: 0
    }

    const asignarMetodo = (metodo, monto) => {
        const val = parseFloat(monto) || 0
        if (val <= 0) return
        switch (metodo) {
            case 'efectivo': dist.Efectivo += val; break
            case 'tarjeta_debito':
            case 'tarjeta_credito': dist.Tarjeta += val; break
            case 'transferencia':
            case 'cheque': dist.Banco += val; break
            case 'credito':
            case 'financiamiento': dist.Credito += val; break
            default: dist.Otra += val
        }
    }

    if (datosVenta.metodo_pago === 'mixto' && datosVenta.pagos_mixtos?.length > 0) {
        datosVenta.pagos_mixtos.forEach(pago => asignarMetodo(pago.metodo_pago, pago.monto))
    } else {
        asignarMetodo(datosVenta.metodo_pago, datosVenta.total)
    }

    const lineas = [
        `Efectivo = ${montoIni(dist.Efectivo)}`,
        `Banco = ${montoIni(dist.Banco)}`,
        `Tarjeta = ${montoIni(dist.Tarjeta)}`,
        `Credito = ${montoIni(dist.Credito)}`,
        `Bonos = ${montoIni(dist.Bonos)}`,
        `Permuta = ${montoIni(dist.Permuta)}`,
        `NotaCredito = ${montoIni(dist.NotaCredito)}`,
        `Otra = ${montoIni(dist.Otra)}`,
    ]

    return `\n[PAGOS]\n${lineas.join('\n')}\n`
}

/**
 * Construye el cuerpo INI para POST a /api-eecf/{ambiente}
 */
export function construirCuerpoINI(datosVenta, datosEmpresa, tipoComprobante) {
    const pctEmpresa = parseFloat(datosEmpresa?.impuesto_porcentaje || 18)
    const fechaEmision = formatFechaISO(datosVenta.fecha_venta)
    const vencimiento = datosVenta.ecf_vencimiento_secuencia
        ? formatFechaISO(datosVenta.ecf_vencimiento_secuencia)
        : '2028-12-31'

    const tipoCodigo = codigoTipoComprobanteECF(tipoComprobante, datosVenta.ncf)
    const comprobante = normalizarComprobanteECF(datosVenta.ncf, tipoComprobante)
    const totalVenta = parseFloat(datosVenta.total || 0)
    const requiereClienteE32 = tipoCodigo === 'E32' && totalVenta >= 250000

    let ini = `[DATA]\n`
    ini += `Comprobante = ${comprobante}\n`

    if (!['E32', 'E34'].includes(tipoCodigo)) {
        ini += `Vencimiento = ${vencimiento}\n`
    }

    ini += `RazonSocialEmisor = ${resolverRazonSocialEmisor(datosEmpresa)}\n`
    ini += `DireccionEmisor = ${resolverDireccionEmisor(datosEmpresa)}\n`
    ini += `RNC = ${resolverRncEmisor(datosEmpresa)}\n`
    ini += `FechaEmision = ${fechaEmision}\n`

    const nombreCliente = limpiarTexto(datosVenta.cliente_nombre)
    const rncCliente = limpiarRnc(datosVenta.cliente_numero_documento)
    const requiereComprador = TIPOS_REQUIEREN_RNC_COMPRADOR.has(tipoCodigo)
        || (tipoCodigo === 'E32' && requiereClienteE32)

    const incluirCliente = nombreCliente && (
        requiereComprador || datosVenta.cliente_id
    )

    if (incluirCliente) {
        ini += `Cliente = ${nombreCliente}\n`
        if (rncCliente) {
            ini += `RNCCliente = ${rncCliente}\n`
        }
        const dirCliente = limpiarTexto(datosVenta.cliente_direccion)
        if (esTextoEmpresaValido(dirCliente)) {
            ini += `Direccion = ${dirCliente}\n`
        }
        ini += `Correo = ${datosVenta.cliente_email ? limpiarTexto(datosVenta.cliente_email, 80) : ''}\n`
    }

    ini += `Moneda = ${datosEmpresa.moneda || 'DOP'}\n`
    ini += `Tasa = 1.00\n`
    ini += `ITBISIncluido = N\n`

    if (!['E41', 'E43', 'E47'].includes(tipoCodigo)) {
        ini += `TipoIngresos = OPERACIONES\n`
    }

    const tipoPagoMap = {
        efectivo: 'CONTADO',
        tarjeta_debito: 'CONTADO',
        tarjeta_credito: 'CONTADO',
        transferencia: 'CONTADO',
        cheque: 'CONTADO',
        credito: 'CREDITO',
        financiamiento: 'CREDITO',
        mixto: datosVenta.pagos_mixtos?.some(p => ['credito', 'financiamiento'].includes(p.metodo_pago))
            ? 'CREDITO'
            : 'CONTADO'
    }
    const tipoPago = tipoPagoMap[datosVenta.metodo_pago] || 'CONTADO'

    if (!['E43', 'E47'].includes(tipoCodigo)) {
        ini += `TipoPago = ${tipoPago}\n`
    }

    if (tipoPago === 'CREDITO' && !['E43', 'E47'].includes(tipoCodigo)) {
        const fechaLimite = new Date(datosVenta.fecha_venta || Date.now())
        fechaLimite.setDate(fechaLimite.getDate() + 30)
        ini += `FechaLimite = ${formatFechaISO(fechaLimite)}\n`
    }

    if (!['E41', 'E43'].includes(tipoCodigo)) {
        ini += `OrdenCompra = \n`
    }

    ini += `\n[DETALLE]\n`
    ini += `; codigo|P/S|descripcion|cant|prc/unit|imp|dto|rgo\n`

    let linea = 0
    ;(datosVenta.productos || []).forEach((prod) => {
        linea += 1
        const codigo = limpiarTexto(prod.codigo_barras || prod.sku || `P${linea}`, 20)
        const tipo = 'P'
        const descripcion = limpiarTexto(prod.nombre_producto || prod.nombre || 'PRODUCTO', 80)
        const cantidad = parseFloat(prod.cantidad || 0).toFixed(2)
        const precioUnit = parseFloat(prod.precio_unitario || 0).toFixed(4)
        const impuesto = resolverCodigoImpuesto(prod, pctEmpresa)
        const descuento = parseFloat(prod.descuento || 0).toFixed(2)
        ini += `_${linea} = ${codigo}|${tipo}|${descripcion}|${cantidad}|${precioUnit}|${impuesto}|${descuento}|0.00\n`
    })

    ;(datosVenta.extras || []).forEach((extra) => {
        linea += 1
        const tipo = extra.tipo === 'servicio' ? 'S' : 'P'
        const descripcion = limpiarTexto(extra.nombre || 'EXTRA', 80)
        const cantidad = parseFloat(extra.cantidad || 1).toFixed(2)
        const precioUnit = parseFloat(extra.precio_unitario || 0).toFixed(4)
        const impuesto = resolverCodigoImpuesto(extra, pctEmpresa)
        ini += `_${linea} = EXT${linea}|${tipo}|${descripcion}|${cantidad}|${precioUnit}|${impuesto}|0.00|0.00\n`
    })

    ini += `\n[GENERAL]\n`
    ini += `Descuentos = ${parseFloat(datosVenta.descuento || 0).toFixed(2)}\n`
    ini += `Recargos = 0.00\n`
    ini += `Total = ${totalVenta.toFixed(2)}\n`

    ini += construirSeccionPagos(datosVenta)

    return ini
}

/**
 * Parsea respuesta INI de la API (firma OK o error)
 */
export function parsearRespuestaINI(texto) {
    const resultado = {}
    let seccionActual = ''

    String(texto || '').split('\n').forEach(lineaRaw => {
        const linea = lineaRaw.trim()
        if (!linea || linea.startsWith(';')) return

        const matchSeccion = linea.match(/^\[(.+)\]$/)
        if (matchSeccion) {
            seccionActual = matchSeccion[1].toUpperCase()
            resultado[seccionActual] = {}
            return
        }

        const matchCampo = linea.match(/^(.+?)\s*=\s*(.*)$/)
        if (matchCampo && seccionActual) {
            const key = matchCampo[1].toLowerCase().trim()
            resultado[seccionActual][key] = matchCampo[2].trim()
        }
    })

    return resultado
}

function extraerFirmaDesdeObjeto(obj, profundidad = 0) {
    if (!obj || typeof obj !== 'object' || profundidad > 8) return null

    const firma = {}
    for (const [clave, valor] of Object.entries(obj)) {
        const k = clave.toLowerCase()
        if (k === 'comprobante' || k === 'encf') firma.comprobante = String(valor || '')
        if (k === 'codigoseguridad' || k === 'codigo_seguridad') firma.codigoseguridad = String(valor || '')
        if (k === 'fechafirma' || k === 'fecha_firma') firma.fechafirma = String(valor || '')
        if (k === 'qr') firma.qr = String(valor || '')
        if (k === 'ambiente') firma.ambiente = String(valor || '')
    }

    if (firma.codigoseguridad || firma.qr) return firma

    for (const valor of Object.values(obj)) {
        if (valor && typeof valor === 'object') {
            const anidada = extraerFirmaDesdeObjeto(valor, profundidad + 1)
            if (anidada) return anidada
        }
    }

    return null
}

function esDocumentoJsonEcf(json) {
    return !!(json?.Encabezado?.IdDoc?.eNCF || json?.DetallesItems?.length)
}

/**
 * Parsea respuesta INI o JSON de API-EECF
 */
export function parsearRespuestaApiEecf(texto) {
    const raw = String(texto || '').trim()
    if (!raw) {
        return { DATA: null, ERROR: null, documentoValido: false, formato: 'vacio' }
    }

    if (raw.startsWith('{') || raw.startsWith('[')) {
        try {
            const json = JSON.parse(raw)
            const firma = extraerFirmaDesdeObjeto(json)
            if (firma) {
                return { DATA: firma, ERROR: null, documentoValido: true, formato: 'json-firma', json }
            }

            const errorJson = json.ERROR || json.error
            if (errorJson) {
                const mensaje = typeof errorJson === 'string'
                    ? errorJson
                    : (errorJson.mensaje || errorJson.message || JSON.stringify(errorJson))
                return {
                    DATA: null,
                    ERROR: { mensaje: String(mensaje) },
                    documentoValido: false,
                    formato: 'json-error',
                    json
                }
            }

            if (esDocumentoJsonEcf(json)) {
                return {
                    DATA: null,
                    ERROR: null,
                    documentoValido: true,
                    formato: 'json-documento',
                    comprobante: json.Encabezado?.IdDoc?.eNCF || null,
                    json
                }
            }

            return { DATA: null, ERROR: null, documentoValido: false, formato: 'json', json }
        } catch {
            // continúa como INI
        }
    }

    const ini = parsearRespuestaINI(raw)
    return {
        DATA: ini.DATA || null,
        ERROR: ini.ERROR || null,
        documentoValido: !!(ini.DATA && !ini.ERROR),
        formato: ini.ERROR ? 'ini-error' : (ini.DATA ? 'ini-firma' : 'ini')
    }
}

async function postApiEecf(url, cuerpoINI, signal) {
    let host = url
    let puerto = ''
    try {
        const parsed = new URL(url)
        host = parsed.hostname
        puerto = parsed.port || (parsed.protocol === 'https:' ? '443' : '80')
    } catch {
        // mantener url completa si no parsea
    }

    console.log('[API-EECF][QA] Enviando firma a:')
    console.log('[API-EECF][QA]   URL completa:', url)
    console.log('[API-EECF][QA]   Host:', host)
    console.log('[API-EECF][QA]   Puerto:', puerto || '(default)')
    console.log('[API-EECF][QA]   Content-Type: text/plain')

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: cuerpoINI,
        signal
    })

    const texto = await response.text()
    console.log('[API-EECF][QA]   Respuesta HTTP:', response.status, 'desde', host)

    return {
        status: response.status,
        texto,
        datos: parsearRespuestaApiEecf(texto)
    }
}

/**
 * POST al servidor API-EECF (cuerpo INI en texto plano, según guía EFRENIS v26.001)
 */
export async function enviarDocumentoApiEecf({
    servidorApi,
    ambiente,
    cuerpoINI,
    timeoutMs = 30000
}) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const url = `${String(servidorApi).replace(/\/$/, '')}/api-eecf/${ambiente}`
        const resultado = await postApiEecf(url, cuerpoINI, controller.signal)

        return {
            ok: resultado.status === 200 && !!resultado.datos.DATA && !resultado.datos.ERROR,
            status: resultado.status,
            texto: resultado.texto,
            datos: resultado.datos
        }
    } finally {
        clearTimeout(timeout)
    }
}

export function normalizarFirmaRespuesta(firma, ventaNcf) {
    return {
        comprobante: firma.comprobante || ventaNcf,
        codigoSeguridad: firma.codigoseguridad || '',
        fechaFirma: firma.fechafirma || '',
        qr: firma.qr || '',
        ambiente: firma.ambiente || null
    }
}

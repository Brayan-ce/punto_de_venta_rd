import net from 'node:net'
import { buildEscPos, buildPrinterTest } from './escpos'

function printerConfig() {
    return {
        connection: process.env.THERMAL_PRINTER_CONNECTION || 'network',
        ip: process.env.THERMAL_PRINTER_IP,
        port: Number(process.env.THERMAL_PRINTER_PORT || 9100),
        timeout: Number(process.env.THERMAL_PRINTER_TIMEOUT_MS || 5000),
        codePage: process.env.THERMAL_PRINTER_CODEPAGE || 'cp850',
        width: Number(process.env.THERMAL_PRINTER_PAPER_WIDTH || 80),
        cut: process.env.THERMAL_PRINTER_CUT !== 'false',
        cashDrawer: process.env.THERMAL_PRINTER_CASH_DRAWER === 'true'
    }
}

export function getPrinterConfig() {
    const config = printerConfig()
    return { ...config, ip: config.ip ? '[configured]' : null }
}

export function sendToNetwork(payload, overrides = {}) {
    const config = { ...printerConfig(), ...overrides }
    if (!config.ip) throw new Error('THERMAL_PRINTER_IP no está configurada')

    return new Promise((resolve, reject) => {
        const socket = net.createConnection({ host: config.ip, port: config.port })
        let settled = false
        const finish = (error) => {
            if (settled) return
            settled = true
            socket.destroy()
            if (error) reject(error)
            else resolve(true)
        }
        socket.setTimeout(config.timeout, () => finish(new Error(`La impresora no respondió en ${config.timeout} ms`)))
        socket.once('error', error => finish(new Error(`No se pudo conectar a la impresora ${config.ip}:${config.port}: ${error.message}`)))
        socket.once('connect', () => socket.end(payload, () => finish()))
    })
}

export async function printReceipt(receipt, options = {}) {
    const config = { ...printerConfig(), ...options }
    const payload = buildEscPos(receipt, config)
    if (config.connection !== 'network') throw new Error(`Transporte ${config.connection} requiere su adaptador específico`)
    await sendToNetwork(payload, config)
    return { success: true, bytes: payload.length, codePage: config.codePage }
}

export async function printInvoice(invoice, options = {}) {
    return printReceipt(invoice, options)
}

export async function printTest(options = {}) {
    const config = { ...printerConfig(), ...options }
    const payload = buildPrinterTest(config)
    await sendToNetwork(payload, config)
    return { success: true, bytes: payload.length, codePage: config.codePage }
}

export async function testPrinter(options = {}) {
    return printTest(options)
}

export async function openCashDrawer(options = {}) {
    const config = { ...printerConfig(), ...options }
    await sendToNetwork(Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]), config)
    return { success: true }
}

export async function cutPaper(options = {}) {
    const config = { ...printerConfig(), ...options }
    await sendToNetwork(Buffer.from([0x1d, 0x56, 0x41, 0x03]), config)
    return { success: true }
}
const mysql = require('mysql2/promise')
const fs = require('fs')

for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match || process.env[match[1]] !== undefined) continue
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
}

const empresaId = Number(process.argv[2])

if (!Number.isInteger(empresaId) || empresaId <= 0) {
    throw new Error('Uso: node scripts/reparar-cuotas-faltantes.js <empresa_id>')
}

function fechaVencimiento(fechaInicio, numero, frecuencia) {
    const fechaBase = fechaInicio instanceof Date
        ? fechaInicio.toISOString().slice(0, 10)
        : String(fechaInicio).slice(0, 10)
    const fecha = new Date(`${fechaBase}T12:00:00Z`)
    if (frecuencia === 'mensual') fecha.setUTCMonth(fecha.getUTCMonth() + numero)
    if (frecuencia === 'quincenal') fecha.setUTCDate(fecha.getUTCDate() + numero * 15)
    if (frecuencia === 'semanal') fecha.setUTCDate(fecha.getUTCDate() + numero * 7)
    return fecha.toISOString().slice(0, 10)
}

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    })

    try {
        await connection.beginTransaction()
        const [contratos] = await connection.execute(`
            SELECT c.id, c.empresa_id, c.meses, c.frecuencia, c.fecha_inicio,
                   c.monto_financiado, c.total_intereses, c.cuota_mensual
            FROM fin_contratos c
            WHERE c.empresa_id = ?
              AND c.estado = 'activo'
              AND c.saldo_pendiente > 0
              AND NOT EXISTS (
                  SELECT 1 FROM fin_cuotas cu WHERE cu.contrato_id = c.id
              )
            FOR UPDATE
        `, [empresaId])

        const hoy = new Date().toISOString().slice(0, 10)
        let cuotasCreadas = 0

        for (const contrato of contratos) {
            const totalCuotas = Number(contrato.meses)
            const capital = Number(contrato.monto_financiado) / totalCuotas
            const interes = Number(contrato.total_intereses) / totalCuotas
            const cuota = Number(contrato.cuota_mensual)

            for (let numero = 1; numero <= totalCuotas; numero++) {
                const vencimiento = fechaVencimiento(contrato.fecha_inicio, numero, contrato.frecuencia)
                const esUltimaCuota = numero === totalCuotas
                const montoCuota = esUltimaCuota
                    ? Number((Number(contrato.monto_financiado) + Number(contrato.total_intereses) - cuota * (totalCuotas - 1)).toFixed(2))
                    : cuota
                const capitalCuota = esUltimaCuota
                    ? Number((Number(contrato.monto_financiado) - capital * (totalCuotas - 1)).toFixed(2))
                    : capital
                const interesCuota = esUltimaCuota
                    ? Number((Number(contrato.total_intereses) - interes * (totalCuotas - 1)).toFixed(2))
                    : interes
                await connection.execute(`
                    INSERT INTO fin_cuotas
                        (contrato_id, empresa_id, numero, monto, capital, interes, mora, fecha_vencimiento, estado)
                    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
                `, [
                    contrato.id,
                    contrato.empresa_id,
                    numero,
                    montoCuota,
                    capitalCuota,
                    interesCuota,
                    vencimiento,
                    vencimiento < hoy ? 'vencida' : 'pendiente'
                ])
                cuotasCreadas++
            }
        }

        await connection.commit()
        console.log(JSON.stringify({ empresaId, contratosReparados: contratos.length, cuotasCreadas }))
    } catch (error) {
        await connection.rollback()
        throw error
    } finally {
        await connection.end()
    }
}

main().catch(error => {
    console.error(error.message)
    process.exit(1)
})
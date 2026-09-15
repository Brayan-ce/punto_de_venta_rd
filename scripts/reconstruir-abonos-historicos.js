const fs = require('fs')
const mysql = require('mysql2/promise')

for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match || process.env[match[1]] !== undefined) continue
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
}

const empresaId = Number(process.argv[2])
if (!Number.isInteger(empresaId) || empresaId <= 0) {
    throw new Error('Uso: node scripts/reconstruir-abonos-historicos.js <empresa_id>')
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
            SELECT c.id, c.empresa_id, c.usuario_id, c.numero, c.fecha_inicio,
                   c.monto_financiado, c.total_intereses, c.total_pagar, c.saldo_pendiente
            FROM fin_contratos c
            WHERE c.empresa_id = ?
              AND c.estado = 'activo'
              AND c.saldo_pendiente > 0
              AND c.total_pagar - c.saldo_pendiente > 0.005
              AND NOT EXISTS (SELECT 1 FROM fin_pagos p WHERE p.contrato_id = c.id)
              AND NOT EXISTS (
                  SELECT 1 FROM fin_pago_cuotas pc
                  JOIN fin_cuotas cu ON cu.id = pc.cuota_id
                  WHERE cu.contrato_id = c.id
              )
            FOR UPDATE
        `, [empresaId])

        let pagosReconstruidos = 0
        let cuotasPagadas = 0
        let cuotasParciales = 0

        for (const contrato of contratos) {
            let restante = Number((Number(contrato.total_pagar) - Number(contrato.saldo_pendiente)).toFixed(2))
            const [cuotas] = await connection.execute(`
                SELECT id, numero, monto, capital, interes, fecha_vencimiento
                FROM fin_cuotas
                WHERE contrato_id = ?
                ORDER BY numero ASC
                FOR UPDATE
            `, [contrato.id])

            if (!cuotas.length) throw new Error(`Contrato ${contrato.numero} no tiene cuotas`)

            const aplicaciones = []
            let capitalAplicado = 0
            let interesAplicado = 0

            for (const cuota of cuotas) {
                if (restante <= 0) break
                const montoCuota = Number(cuota.monto)
                const aplicado = Math.min(restante, montoCuota)
                const ratio = aplicado / montoCuota
                const capital = Number((Number(cuota.capital) * ratio).toFixed(2))
                const interes = Number((Number(cuota.interes) * ratio).toFixed(2))
                const estado = aplicado >= montoCuota ? 'pagada' : 'parcial'

                aplicaciones.push({ cuotaId: cuota.id, aplicado, estado })
                capitalAplicado += capital
                interesAplicado += interes
                restante = Number((restante - aplicado).toFixed(2))

                await connection.execute(
                    `UPDATE fin_cuotas SET estado = ?, fecha_pago = ?, mora = 0 WHERE id = ?`,
                    [estado, contrato.fecha_inicio, cuota.id]
                )

                if (estado === 'pagada') cuotasPagadas++
                else cuotasParciales++
            }

            const montoReconstruido = Number((Number(contrato.total_pagar) - Number(contrato.saldo_pendiente)).toFixed(2))
            const [pago] = await connection.execute(`
                INSERT INTO fin_pagos
                    (contrato_id, empresa_id, usuario_id, monto, monto_capital, monto_interes,
                     monto_mora, metodo_pago_id, referencia, notas, fecha)
                VALUES (?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?, ?)
            `, [
                contrato.id,
                contrato.empresa_id,
                contrato.usuario_id,
                montoReconstruido,
                Number(capitalAplicado.toFixed(2)),
                Number(interesAplicado.toFixed(2)),
                'Migración de saldo preexistente: abono reconstruido desde el saldo contractual original.',
                contrato.fecha_inicio
            ])

            for (const aplicacion of aplicaciones) {
                await connection.execute(
                    `INSERT INTO fin_pago_cuotas (pago_id, cuota_id, monto) VALUES (?, ?, ?)`,
                    [pago.insertId, aplicacion.cuotaId, aplicacion.aplicado]
                )
            }
            pagosReconstruidos++
        }

        await connection.commit()
        console.log(JSON.stringify({ empresaId, pagosReconstruidos, cuotasPagadas, cuotasParciales }))
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
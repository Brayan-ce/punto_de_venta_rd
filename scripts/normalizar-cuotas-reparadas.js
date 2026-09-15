const mysql = require('mysql2/promise')
const fs = require('fs')

for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match || process.env[match[1]] !== undefined) continue
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
}

const empresaId = Number(process.argv[2])
if (!Number.isInteger(empresaId) || empresaId <= 0) {
    throw new Error('Uso: node scripts/normalizar-cuotas-reparadas.js <empresa_id>')
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
            SELECT c.id, c.total_pagar, c.monto_financiado, c.total_intereses
            FROM fin_contratos c
            WHERE c.empresa_id = ?
              AND c.estado = 'activo'
              AND c.saldo_pendiente > 0
              AND NOT EXISTS (SELECT 1 FROM fin_pagos p WHERE p.contrato_id = c.id)
              AND NOT EXISTS (
                  SELECT 1 FROM fin_pago_cuotas pc
                  JOIN fin_cuotas cu ON cu.id = pc.cuota_id
                  WHERE cu.contrato_id = c.id
              )
              AND (SELECT COUNT(*) FROM fin_cuotas cu WHERE cu.contrato_id = c.id) = c.meses
              AND ABS((SELECT COALESCE(SUM(cu.monto), 0) FROM fin_cuotas cu WHERE cu.contrato_id = c.id) - c.total_pagar) > 0.005
            FOR UPDATE
        `, [empresaId])

        for (const contrato of contratos) {
            const [[acumulado]] = await connection.execute(`
                SELECT COALESCE(SUM(monto), 0) AS monto,
                       COALESCE(SUM(capital), 0) AS capital,
                       COALESCE(SUM(interes), 0) AS interes
                FROM fin_cuotas
                WHERE contrato_id = ? AND numero < (
                    SELECT MAX(numero) FROM fin_cuotas WHERE contrato_id = ?
                )
            `, [contrato.id, contrato.id])

            await connection.execute(`
                UPDATE fin_cuotas
                SET monto = ?, capital = ?, interes = ?
                WHERE contrato_id = ?
                  AND numero = (SELECT MAX(numero) FROM (
                      SELECT numero FROM fin_cuotas WHERE contrato_id = ?
                  ) AS ultima)
            `, [
                Number((Number(contrato.total_pagar) - Number(acumulado.monto)).toFixed(2)),
                Number((Number(contrato.monto_financiado) - Number(acumulado.capital)).toFixed(2)),
                Number((Number(contrato.total_intereses) - Number(acumulado.interes)).toFixed(2)),
                contrato.id,
                contrato.id
            ])
        }

        await connection.commit()
        console.log(JSON.stringify({ empresaId, contratosNormalizados: contratos.length }))
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
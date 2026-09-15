const fs = require('fs')
const mysql = require('mysql2/promise')

for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match || process.env[match[1]] !== undefined) continue
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
}

const empresaId = Number(process.argv[2])
if (!Number.isInteger(empresaId) || empresaId <= 0) {
    throw new Error('Uso: node scripts/cerrar-contratos-saldados.js <empresa_id>')
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
        const [resultado] = await connection.execute(`
            UPDATE fin_contratos c
            SET c.estado = 'pagado'
            WHERE c.empresa_id = ?
              AND c.estado = 'activo'
              AND c.saldo_pendiente <= 0
              AND NOT EXISTS (SELECT 1 FROM fin_cuotas cu WHERE cu.contrato_id = c.id)
              AND NOT EXISTS (SELECT 1 FROM fin_pagos p WHERE p.contrato_id = c.id)
        `, [empresaId])
        await connection.commit()
        console.log(JSON.stringify({ empresaId, contratosCerrados: resultado.affectedRows }))
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
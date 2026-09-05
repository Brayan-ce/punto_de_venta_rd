"use server"
import db from "@/_DB/db"
import { cookies } from 'next/headers'

async function getEmpresaId() {
    const cookieStore = await cookies()
    return cookieStore.get('empresaId')?.value
}

function generarCodigo(nombre, frecuencia) {
    const prefijos = { mensual: 'M', quincenal: 'Q', semanal: 'S' }
    const pref  = prefijos[frecuencia] || 'P'
    const slug  = nombre.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4).padEnd(2, 'X')
    const rand  = Math.floor(Math.random() * 900 + 100)
    return `${pref}${slug}-${rand}`
}

export async function crearPlan(datos) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        if (!datos.nombre?.trim()) return { success: false, mensaje: 'El nombre es requerido' }
        if (!datos.frecuencia)     return { success: false, mensaje: 'La frecuencia es requerida' }
        if (parseFloat(datos.tasa_interes || 0) > 999.99) return { success: false, mensaje: 'La tasa de interés no puede superar 999.99%' }
        if (parseFloat(datos.mora_pct || 0) > 999.99)     return { success: false, mensaje: 'La mora no puede superar 999.99%' }

        const codigo = generarCodigo(datos.nombre, datos.frecuencia)

        connection = await db.getConnection()

        const [res] = await connection.execute(
            `INSERT INTO fin_planes
                (empresa_id, nombre, codigo, descripcion, frecuencia,
                 tasa_interes, mora_pct, dias_gracia,
                 monto_minimo, monto_maximo,
                 requiere_fiador, permite_anticipado, activo)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1)`,
            [
                empresaId,
                datos.nombre.trim(),
                codigo,
                datos.descripcion?.trim() || null,
                datos.frecuencia,
                parseFloat(datos.tasa_interes || 0),
                parseFloat(datos.mora_pct     || 5),
                parseInt(datos.dias_gracia    || 5),
                0,
                null,
                datos.requiere_fiador    ? 1 : 0,
                datos.permite_anticipado ? 1 : 0,
            ]
        )

        connection.release()
        return { success: true, plan_id: res.insertId, mensaje: 'Plan creado' }

    } catch (error) {
        console.error('crearPlan:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}
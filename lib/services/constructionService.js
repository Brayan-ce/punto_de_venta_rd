"use server"

import db from "@/_DB/db"

/**
 * SERVICIOS DE CONSTRUCCIÓN - Lógica de Base de Datos
 * Este archivo contiene las consultas core que serán usadas por los Server Actions.
 */

// --- OBRAS ---

export async function dbObtenerObras(connection, empresaId, filtros = {}) {
    let query = `SELECT * FROM obras WHERE empresa_id = ?`
    const params = [empresaId]

    if (filtros.estado) {
        query += ` AND estado = ?`
        params.push(filtros.estado)
    }

    query += ` ORDER BY fecha_creacion DESC`
    const [rows] = await connection.execute(query, params)
    return rows
}

export async function dbCrearObra(connection, data) {
    const { 
        nombre, 
        ubicacion, 
        presupuesto_aprobado, 
        fecha_inicio, 
        fecha_fin_estimada,
        empresa_id,
        codigo_obra,
        estado,
        creado_por,
        descripcion,
        tipo_obra,
        zona,
        municipio,
        provincia,
        cliente_id,
        usuario_responsable_id
    } = data
    
    const [result] = await connection.execute(
        `INSERT INTO obras (
            nombre, 
            ubicacion, 
            presupuesto_aprobado, 
            fecha_inicio, 
            fecha_fin_estimada,
            empresa_id,
            codigo_obra,
            estado,
            creado_por,
            descripcion,
            tipo_obra,
            zona,
            municipio,
            provincia,
            cliente_id,
            usuario_responsable_id
        )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            nombre, 
            ubicacion, 
            presupuesto_aprobado, 
            fecha_inicio, 
            fecha_fin_estimada,
            empresa_id,
            codigo_obra,
            estado || 'activa',
            creado_por,
            descripcion || null,
            tipo_obra || 'construccion',
            zona || null,
            municipio || null,
            provincia || null,
            cliente_id || null,
            usuario_responsable_id || null
        ]
    )
    return result.insertId
}

// --- TRABAJADORES ---

export async function dbObtenerTrabajadores(connection, empresaId, filtros = {}) {
    let query = `SELECT * FROM trabajadores WHERE 1=1`
    const params = []

    if (filtros.estado) {
        query += ` AND estado = ?`
        params.push(filtros.estado)
    }

    const [rows] = await connection.execute(query, params)
    return rows
}

export async function dbCrearTrabajador(connection, data) {
    const { nombre, documento, rol } = data
    const [result] = await connection.execute(
        `INSERT INTO trabajadores (nombre, documento, rol) VALUES (?, ?, ?)`,
        [nombre, documento, rol]
    )
    return result.insertId
}

// --- ASIGNACIONES ---

export async function dbAsignarTrabajadorAObra(connection, data) {
    const { obra_id, trabajador_id, fecha_asignacion } = data
    const [result] = await connection.execute(
        `INSERT INTO asignaciones_obra (obra_id, trabajador_id, fecha_asignacion)
         VALUES (?, ?, ?)`,
        [obra_id, trabajador_id, fecha_asignacion]
    )
    return result.insertId
}

export async function dbObtenerTrabajadoresAsignados(connection, obraId) {
    const [rows] = await connection.execute(
        `SELECT t.* FROM trabajadores t
         INNER JOIN asignaciones_obra a ON t.id = a.trabajador_id
         WHERE a.obra_id = ? AND t.estado = 'ACTIVO'`,
        [obraId]
    )
    return rows
}

// --- BITÁCORAS ---

export async function dbCrearBitacora(connection, data) {
    const { obra_id, fecha, zona, trabajo_realizado, observaciones, trabajadores } = data

    // 1. Insertar Bitácora
    const [result] = await connection.execute(
        `INSERT INTO bitacoras_diarias (obra_id, fecha, zona, trabajo_realizado, observaciones)
         VALUES (?, ?, ?, ?, ?)`,
        [obra_id, fecha, zona, trabajo_realizado, observaciones]
    )
    const bitacoraId = result.insertId

    // 2. Insertar asistencias
    if (trabajadores && trabajadores.length > 0) {
        for (const t of trabajadores) {
            await connection.execute(
                `INSERT INTO asistencias_bitacora (bitacora_id, trabajador_id, hora_inicio, hora_fin, horas_trabajadas)
                 VALUES (?, ?, ?, ?, ?)`,
                [bitacoraId, t.id, t.hora_inicio || null, t.hora_fin || null, t.horas_trabajadas || 0]
            )
        }
    }

    return bitacoraId
}

// --- COSTOS Y PRESUPUESTO ---

export async function dbObtenerResumenPresupuesto(connection, obraId) {
    // 1. Obtener presupuesto base de la obra
    const [obra] = await connection.execute(`SELECT presupuesto_aprobado FROM obras WHERE id = ?`, [obraId])
    if (obra.length === 0) return null

    // 2. Sumar compras
    const [compras] = await connection.execute(
        `SELECT SUM(monto) as total_compras FROM compras_obra WHERE obra_id = ?`,
        [obraId]
    )

    // 3. Sumar mano de obra (aquí se necesitaría una tarifa por trabajador o rol, por ahora sumamos horas)
    // Para simplificar, asumiremos que el costo se registra en la compra o tenemos una tarifa base
    // En una implementación real, calcularíamos horas x tarifa.

    const totalGastado = (compras[0].total_compras || 0)
    const presupuesto = obra[0].presupuesto_aprobado
    const saldo = presupuesto - totalGastado
    const porcentaje = presupuesto > 0 ? (totalGastado / presupuesto) * 100 : 0

    return {
        presupuesto,
        totalGastado,
        saldo,
        porcentaje
    }
}

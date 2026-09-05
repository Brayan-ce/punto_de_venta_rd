"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { obtenerObras } from '../obras/servidor'

export async function obtenerConducesObra(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        
        let query = `
            SELECT co.*,
                   o.nombre AS obra_nombre,
                   o.codigo_obra,
                   COUNT(cod.id) as cantidad_items
            FROM conduces_obra co
            LEFT JOIN obras o ON co.tipo_destino = 'obra' AND co.destino_id = o.id
            LEFT JOIN conduces_obra_detalle cod ON co.id = cod.conduce_id
            WHERE co.empresa_id = ?
        `
        const params = [empresaId]
        
        if (filtros.obra_id) {
            query += ' AND co.tipo_destino = \'obra\' AND co.destino_id = ?'
            params.push(filtros.obra_id)
        }
        
        if (filtros.estado) {
            query += ' AND co.estado = ?'
            params.push(filtros.estado)
        }
        
        if (filtros.fecha_desde) {
            query += ' AND co.fecha_conduce >= ?'
            params.push(filtros.fecha_desde)
        }
        
        if (filtros.fecha_hasta) {
            query += ' AND co.fecha_conduce <= ?'
            params.push(filtros.fecha_hasta)
        }
        
        query += ' GROUP BY co.id ORDER BY co.fecha_conduce DESC'
        
        const [conduces] = await connection.query(query, params)
        connection.release()
        
        return { success: true, conduces }
    } catch (error) {
        console.error('Error al obtener conduces de obra:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar conduces' }
    }
}

export async function crearConduceObra(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        // Validaciones básicas
        if (!datos.obra_id) {
            return { success: false, mensaje: 'Debe seleccionar una obra' }
        }
        
        if (!datos.detalle || datos.detalle.length === 0) {
            return { success: false, mensaje: 'Debe agregar al menos un material' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            // Generar número de conduce
            const [ultimoConduce] = await connection.query(
                'SELECT numero_conduce FROM conduces_obra WHERE empresa_id = ? ORDER BY id DESC LIMIT 1',
                [empresaId]
            )
            
            let numero = 1
            if (ultimoConduce.length > 0 && ultimoConduce[0].numero_conduce) {
                const match = ultimoConduce[0].numero_conduce.match(/\d+$/)
                if (match) numero = parseInt(match[0]) + 1
            }
            
            const numeroConduce = `COND-OB-${new Date().getFullYear()}-${String(numero).padStart(3, '0')}`
            
            // Insertar conduce
            const [result] = await connection.query(
                `INSERT INTO conduces_obra (
                    empresa_id, obra_id, numero_conduce, receptor,
                    chofer, vehiculo, placa, observaciones,
                    estado, creado_por
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'emitido', ?)`,
                [
                    empresaId,
                    datos.obra_id,
                    numeroConduce,
                    datos.receptor || null,
                    datos.chofer || null,
                    datos.vehiculo || null,
                    datos.placa || null,
                    datos.observaciones || null,
                    userId
                ]
            )
            
            const conduceId = result.insertId
            
            // Insertar detalle
            for (const item of datos.detalle) {
                await connection.query(
                    `INSERT INTO conduces_obra_detalle (
                        conduce_id, compra_detalle_id, material_nombre,
                        cantidad_despachada, unidad_medida
                    ) VALUES (?, ?, ?, ?, ?)`,
                    [
                        conduceId,
                        item.compra_detalle_id || null,
                        item.material_nombre,
                        item.cantidad_despachada,
                        item.unidad_medida || null
                    ]
                )
            }
            
            await connection.commit()
            connection.release()
            
            return { success: true, mensaje: 'Conduce creado exitosamente', id: conduceId }
        } catch (innerError) {
            await connection.rollback()
            throw innerError
        }
    } catch (error) {
        console.error('Error al crear conduce:', error)
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        return { success: false, mensaje: 'Error al crear conduce' }
    }
}

export async function obtenerConduceObraPorId(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        
        const [conduces] = await connection.query(
            `SELECT co.*,
                    o.nombre AS obra_nombre,
                    o.codigo_obra
             FROM conduces_obra co
             LEFT JOIN obras o ON co.obra_id = o.id
             WHERE co.id = ? AND co.empresa_id = ?`,
            [id, empresaId]
        )
        
        if (conduces.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Conduce no encontrado' }
        }
        
        // Obtener detalle
        const [detalle] = await connection.query(
            'SELECT * FROM conduces_obra_detalle WHERE conduce_id = ?',
            [id]
        )
        
        connection.release()
        
        return { 
            success: true, 
            conduce: { ...conduces[0], detalle } 
        }
    } catch (error) {
        console.error('Error al obtener conduce:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar conduce' }
    }
}

export async function obtenerObrasParaConduce() {
    const res = await obtenerObras({ estado: 'activa' })
    return res
}


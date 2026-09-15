"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * Crear nueva plantilla de servicio
 */
export async function crearPlantillaServicio(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            // Generar código único de plantilla
            const [ultimaPlantilla] = await connection.query(
                'SELECT codigo_plantilla FROM servicios_plantillas WHERE empresa_id = ? ORDER BY id DESC LIMIT 1',
                [empresaId]
            )
            
            let numero = 1
            if (ultimaPlantilla.length > 0 && ultimaPlantilla[0].codigo_plantilla) {
                const match = ultimaPlantilla[0].codigo_plantilla.match(/\d+$/)
                if (match) numero = parseInt(match[0]) + 1
            }
            
            const codigoPlantilla = `PLANT-${String(numero).padStart(3, '0')}`
            
            // Crear plantilla
            const [result] = await connection.query(
                `INSERT INTO servicios_plantillas (
                    empresa_id, codigo_plantilla, nombre, descripcion, tipo_servicio,
                    duracion_estimada_dias, costo_base_estimado, activa, creado_por
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    empresaId,
                    codigoPlantilla,
                    datos.nombre,
                    datos.descripcion || null,
                    datos.tipo_servicio,
                    datos.duracion_estimada_dias || 1,
                    datos.costo_base_estimado || 0,
                    1, // activa por defecto
                    userId
                ]
            )
            
            const plantillaId = result.insertId
            
            // Si hay recursos, agregarlos
            if (datos.recursos && Array.isArray(datos.recursos) && datos.recursos.length > 0) {
                for (let i = 0; i < datos.recursos.length; i++) {
                    const recurso = datos.recursos[i]
                    await connection.query(
                        `INSERT INTO servicios_plantillas_recursos (
                            servicio_plantilla_id, tipo_recurso, nombre, descripcion,
                            cantidad_estimada, unidad, costo_unitario_estimado, orden
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            plantillaId,
                            recurso.tipo_recurso || 'material',
                            recurso.nombre,
                            recurso.descripcion || null,
                            recurso.cantidad_estimada || 1,
                            recurso.unidad || 'unidades',
                            recurso.costo_unitario_estimado || 0,
                            i
                        ]
                    )
                }
            }
            
            await connection.commit()
            connection.release()
            
            return { 
                success: true, 
                mensaje: 'Plantilla creada exitosamente', 
                id: plantillaId,
                codigo: codigoPlantilla
            }
        } catch (error) {
            await connection.rollback()
            throw error
        }
    } catch (error) {
        console.error('Error al crear plantilla:', error)
        if (connection) {
            try {
                await connection.rollback()
            } catch (rollbackError) {
                console.error('Error en rollback:', rollbackError)
            }
            connection.release()
        }
        return { success: false, mensaje: 'Error al crear plantilla: ' + error.message }
    }
}


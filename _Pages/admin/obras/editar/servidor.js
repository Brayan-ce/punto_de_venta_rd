"use server"

import db from "@/_DB/db"
import { validarObra } from '../../core/construction/validaciones'
import { obtenerUsuarioActual, validarPermisoObras, mapearDatosFormularioABD } from '../lib'

/**
 * Obtener obra por ID para edición
 */
export async function obtenerObraPorId(obraId) {
    let connection
    try {
        // Validar que obraId no sea undefined o null
        if (!obraId) {
            return {
                success: false,
                mensaje: 'ID de obra no proporcionado'
            }
        }

        const usuario = await obtenerUsuarioActual()
        validarPermisoObras(usuario)

        // Convertir obraId a número si es string
        const obraIdNum = parseInt(obraId)
        if (isNaN(obraIdNum)) {
            return {
                success: false,
                mensaje: 'ID de obra inválido'
            }
        }

        connection = await db.getConnection()

        const [obras] = await connection.execute(
            `SELECT o.*, 
                    c.nombre AS cliente_nombre,
                    u.nombre AS responsable_nombre
             FROM obras o
             LEFT JOIN clientes c ON o.cliente_id = c.id
             LEFT JOIN usuarios u ON o.usuario_responsable_id = u.id
             WHERE o.id = ? AND o.empresa_id = ?`,
            [obraIdNum, usuario.empresaId]
        )

        connection.release()

        if (obras.length === 0) {
            return {
                success: false,
                mensaje: 'Obra no encontrada'
            }
        }

        return {
            success: true,
            obra: obras[0]
        }
    } catch (error) {
        console.error('Error al obtener obra:', error)
        if (connection) connection.release()
        return {
            success: false,
            mensaje: error.message || 'Error al cargar obra'
        }
    }
}

/**
 * Actualizar obra existente
 */
export async function actualizarObra(obraId, datos) {
    let connection
    try {
        const usuario = await obtenerUsuarioActual()
        validarPermisoObras(usuario)

        // Validar datos usando reglas del dominio
        const validacion = validarObra(datos)
        if (!validacion.valido) {
            return {
                success: false,
                mensaje: Object.values(validacion.errores)[0],
                errores: validacion.errores
            }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        // Verificar que la obra existe y pertenece a la empresa
        const [obraExistente] = await connection.execute(
            `SELECT * FROM obras WHERE id = ? AND empresa_id = ?`,
            [obraId, usuario.empresaId]
        )

        if (obraExistente.length === 0) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Obra no encontrada'
            }
        }

        // Mapear datos del formulario a formato BD
        const datosBD = mapearDatosFormularioABD(datos)

        // Actualizar obra
        await connection.execute(
            `UPDATE obras SET
                nombre = ?,
                descripcion = ?,
                tipo_obra = ?,
                ubicacion = ?,
                zona = ?,
                municipio = ?,
                provincia = ?,
                presupuesto_aprobado = ?,
                fecha_inicio = ?,
                fecha_fin_estimada = ?,
                cliente_id = ?,
                usuario_responsable_id = ?,
                observaciones = ?,
                actualizado_por = ?,
                fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE id = ? AND empresa_id = ?`,
            [
                datosBD.nombre,
                datosBD.descripcion,
                datosBD.tipo_obra,
                datosBD.ubicacion,
                datosBD.zona,
                datosBD.municipio,
                datosBD.provincia,
                datosBD.presupuesto_aprobado,
                datosBD.fecha_inicio,
                datosBD.fecha_fin_estimada,
                datosBD.cliente_id,
                datosBD.usuario_responsable_id,
                datosBD.observaciones,
                usuario.id,
                obraId,
                usuario.empresaId
            ]
        )

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Obra actualizada exitosamente'
        }
    } catch (error) {
        console.error('Error al actualizar obra:', error)
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        return {
            success: false,
            mensaje: error.message || 'Error al actualizar obra'
        }
    }
}

export async function obtenerRegionesEmpresa() {
    let connection
    try {
        const usuario = await obtenerUsuarioActual()
        validarPermisoObras(usuario)

        connection = await db.getConnection()

        const [empresa] = await connection.execute(
            'SELECT pais_id FROM empresas WHERE id = ?',
            [usuario.empresaId]
        )

        const paisId = empresa[0]?.pais_id
        if (!paisId) {
            connection.release()
            return { success: true, regiones: [] }
        }

        const [regiones] = await connection.execute(
            `SELECT id, nombre, tipo
             FROM regiones
             WHERE pais_id = ? AND activo = TRUE
             ORDER BY nombre ASC`,
            [paisId]
        )

        connection.release()

        return { success: true, regiones }
    } catch (error) {
        console.error('Error al obtener regiones:', error)
        if (connection) {
            connection.release()
        }
        return {
            success: false,
            mensaje: 'Error al cargar regiones',
            regiones: []
        }
    }
}


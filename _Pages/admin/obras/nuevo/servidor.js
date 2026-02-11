"use server"

import db from "@/_DB/db"
import { dbCrearObra } from "@/lib/services/constructionService"
import { validarObra } from '../../core/construction/validaciones'
import { ESTADOS_OBRA } from '../../core/construction/estados'
import { obtenerUsuarioActual, validarPermisoObras, mapearDatosFormularioABD } from '../lib'
import { guardarImagenObra, guardarDocumentoObra } from '@/services/imageService'

/**
 * Crear nueva obra
 */
export async function crearObra(datos) {
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

        // Generar código automático si no existe
        let codigoObra = datos.codigo || datos.codigo_obra
        if (!codigoObra) {
            const [ultimaObra] = await connection.execute(
                'SELECT codigo_obra FROM obras WHERE empresa_id = ? ORDER BY id DESC LIMIT 1',
                [usuario.empresaId]
            )

            let numero = 1
            if (ultimaObra.length > 0 && ultimaObra[0].codigo_obra) {
                const match = ultimaObra[0].codigo_obra.match(/\d+$/)
                if (match) numero = parseInt(match[0]) + 1
            }

            codigoObra = `OB-${new Date().getFullYear()}-${String(numero).padStart(3, '0')}`
        }

        // Mapear datos del formulario a formato BD
        const datosBD = mapearDatosFormularioABD(datos)

        // Crear obra usando el servicio
        const obraId = await dbCrearObra(connection, {
            ...datosBD,
            empresa_id: usuario.empresaId,
            codigo_obra: codigoObra,
            estado: ESTADOS_OBRA.ACTIVA,
            creado_por: usuario.id
        })

        // Procesar imágenes si existen
        if (datos.imagenes && Array.isArray(datos.imagenes) && datos.imagenes.length > 0) {
            for (const imagen of datos.imagenes) {
                if (imagen.base64) {
                    try {
                        const rutaImagen = await guardarImagenObra(imagen.base64, obraId)
                        
                        await connection.execute(
                            `INSERT INTO obra_imagenes (
                                obra_id, categoria, descripcion, ruta_imagen, fecha_toma, subido_por
                            ) VALUES (?, ?, ?, ?, ?, ?)`,
                            [
                                obraId,
                                imagen.categoria || 'avance',
                                imagen.descripcion || null,
                                rutaImagen,
                                imagen.fecha_toma || null,
                                usuario.id
                            ]
                        )
                    } catch (error) {
                        console.error('Error al guardar imagen de obra:', error)
                        // Continuar con las demás imágenes aunque una falle
                    }
                }
            }
        }

        // Procesar documentos si existen
        if (datos.documentos && Array.isArray(datos.documentos) && datos.documentos.length > 0) {
            for (const documento of datos.documentos) {
                if (documento.base64 && documento.nombre && documento.tipo) {
                    try {
                        const docInfo = await guardarDocumentoObra(
                            documento.base64,
                            obraId,
                            documento.tipo,
                            documento.nombre
                        )
                        
                        await connection.execute(
                            `INSERT INTO obra_documentos (
                                obra_id, tipo, nombre, descripcion, ruta_archivo, extension, tamaño_kb, visible_cliente, subido_por
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                obraId,
                                documento.tipo,
                                documento.nombre,
                                documento.descripcion || null,
                                docInfo.ruta,
                                docInfo.extension,
                                docInfo.tamaño_kb,
                                documento.visible_cliente || 0,
                                usuario.id
                            ]
                        )
                    } catch (error) {
                        console.error('Error al guardar documento de obra:', error)
                        // Continuar con los demás documentos aunque uno falle
                    }
                }
            }
        }

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Obra creada exitosamente',
            obraId,
            codigo: codigoObra
        }
    } catch (error) {
        console.error('Error al crear obra:', error)
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        return {
            success: false,
            mensaje: error.message || 'Error al crear obra'
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


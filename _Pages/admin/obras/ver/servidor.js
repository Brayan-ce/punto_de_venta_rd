"use server"

import db from "@/_DB/db"
import { obtenerUsuarioActual, validarPermisoObras, formatearObra } from '../lib'

/**
 * Obtener obra por ID con detalle completo
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

        connection = await db.getConnection()

        // Convertir obraId a número si es string
        const obraIdNum = parseInt(obraId)
        if (isNaN(obraIdNum)) {
            connection.release()
            return {
                success: false,
                mensaje: 'ID de obra inválido'
            }
        }

        // Obtener obra con relaciones
        const [obras] = await connection.execute(
            `SELECT 
                o.*,
                p.nombre AS proyecto_nombre,
                p.codigo_proyecto AS proyecto_codigo,
                c.nombre AS cliente_nombre,
                c.telefono AS cliente_telefono,
                c.email AS cliente_email,
                u.nombre AS creador_nombre,
                (
                    SELECT COUNT(DISTINCT at.trabajador_id)
                    FROM asignaciones_trabajadores at
                    WHERE at.tipo_destino = 'obra'
                    AND at.destino_id = o.id
                    AND at.estado = 'activa'
                ) AS trabajadores_activos
             FROM obras o
             LEFT JOIN proyectos p ON o.proyecto_id = p.id
             LEFT JOIN clientes c ON o.cliente_id = c.id
             LEFT JOIN usuarios u ON o.creado_por = u.id
             WHERE o.id = ? AND o.empresa_id = ?`,
            [obraIdNum, usuario.empresaId]
        )

        if (obras.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Obra no encontrada'
            }
        }

        // Obtener trabajadores asignados (si existe la tabla)
        let trabajadores = []
        try {
            const [trabajadoresRaw] = await connection.execute(
                `SELECT 
                    t.id,
                    t.nombre,
                    t.apellidos,
                    t.tarifa_hora,
                    a.fecha_asignacion,
                    a.estado AS estado_asignacion
                 FROM asignaciones_trabajadores a
                 INNER JOIN trabajadores_obra t ON a.trabajador_id = t.id
                 WHERE a.tipo_destino = 'obra'
                 AND a.destino_id = ?
                 AND a.estado = 'activa'`,
                [obraIdNum]
            )
            trabajadores = trabajadoresRaw
        } catch (err) {
            // Tabla puede no existir aún, continuar sin trabajadores
            console.warn('No se pudieron cargar trabajadores:', err)
        }

        // Obtener compras recientes (si existe la tabla)
        let compras = []
        try {
            const [comprasRaw] = await connection.execute(
                `SELECT 
                    id,
                    numero_factura,
                    notas AS descripcion,
                    total AS monto_total,
                    forma_pago AS metodo_pago,
                    fecha_compra,
                    estado
                 FROM compras_obra
                 WHERE tipo_destino = 'obra'
                 AND destino_id = ?
                 AND estado != 'anulada'
                 ORDER BY fecha_compra DESC
                 LIMIT 10`,
                [obraIdNum]
            )
            compras = comprasRaw
        } catch (err) {
            // Tabla puede no existir aún, continuar sin compras
            console.warn('No se pudieron cargar compras:', err)
        }

        // Obtener bitácoras recientes (si existe la tabla)
        let bitacoras = []
        try {
            const [bitacorasRaw] = await connection.execute(
                `SELECT 
                    id,
                    fecha_bitacora AS fecha,
                    trabajo_realizado,
                    observaciones,
                    fecha_creacion AS fecha_registro
                 FROM bitacora_diaria
                 WHERE tipo_destino = 'obra'
                 AND destino_id = ?
                 ORDER BY fecha_bitacora DESC
                 LIMIT 10`,
                [obraIdNum]
            )
            bitacoras = bitacorasRaw
        } catch (err) {
            // Tabla puede no existir aún, continuar sin bitácoras
            console.warn('No se pudieron cargar bitácoras:', err)
        }

        connection.release()

        const obraFormateada = formatearObra({
            ...obras[0],
            trabajadores,
            compras,
            bitacoras
        })

        return {
            success: true,
            obra: obraFormateada
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


"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerActivosListado() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesión inválida'
            }
        }

        connection = await db.getConnection()

        const [activos] = await connection.execute(
            `SELECT 
                a.id,
                a.numero_serie,
                a.vin,
                a.numero_placa,
                a.codigo_activo,
                a.estado,
                a.color,
                a.anio_fabricacion,
                a.precio_compra,
                a.precio_venta,
                a.fecha_compra,
                a.fecha_venta,
                a.ubicacion,
                p.id as producto_id,
                p.nombre as producto_nombre,
                p.sku as producto_sku,
                p.imagen_url as producto_imagen_url,
                p.tipo_activo,
                c.nombre as categoria_nombre,
                m.nombre as marca_nombre,
                cl.nombre as cliente_nombre,
                cl.apellidos as cliente_apellidos,
                cf.numero_contrato
            FROM activos_productos a
            LEFT JOIN productos p ON a.producto_id = p.id
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN marcas m ON p.marca_id = m.id
            LEFT JOIN clientes cl ON a.cliente_id = cl.id
            LEFT JOIN contratos_financiamiento cf ON a.contrato_financiamiento_id = cf.id
            WHERE a.empresa_id = ?
            ORDER BY a.fecha_creacion DESC`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            activos: activos,
            userTipo: userTipo
        }

    } catch (error) {
        console.error('Error al obtener activos:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar activos'
        }
    }
}


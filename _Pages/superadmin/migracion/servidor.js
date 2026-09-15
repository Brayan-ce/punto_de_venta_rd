"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function analizarInconsistencias() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        const [usuariosSinEmpresa] = await connection.execute(
            `SELECT 
                u.id,
                u.nombre,
                u.cedula,
                u.email,
                u.tipo,
                u.empresa_id as empresa_id_actual,
                (SELECT COUNT(DISTINCT dv.producto_id) 
                 FROM detalle_ventas dv
                 INNER JOIN ventas v ON dv.venta_id = v.id
                 INNER JOIN productos p ON dv.producto_id = p.id
                 WHERE v.usuario_id = u.id AND p.empresa_id = 1) as total_productos,
                (SELECT COUNT(*) FROM ventas WHERE usuario_id = u.id) as total_ventas,
                (SELECT COUNT(DISTINCT cliente_id) 
                 FROM ventas 
                 WHERE usuario_id = u.id AND cliente_id IS NOT NULL) as total_clientes,
                (SELECT COUNT(*) FROM cajas WHERE usuario_id = u.id) as total_cajas,
                (SELECT COUNT(*) FROM compras WHERE usuario_id = u.id) as total_compras
            FROM usuarios u
            WHERE u.tipo IN ('admin', 'vendedor')
            AND u.empresa_id = 1
            AND u.activo = TRUE
            AND NOT EXISTS (
                SELECT 1 FROM empresas e2 
                WHERE e2.nombre_empresa = u.nombre 
                AND e2.id != 1
            )
            ORDER BY u.fecha_creacion DESC`
        )

        connection.release()

        return {
            success: true,
            usuarios: usuariosSinEmpresa
        }

    } catch (error) {
        console.error('Error al analizar inconsistencias:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al analizar la base de datos'
        }
    }
}

export async function ejecutarMigracion() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        const [usuariosSinEmpresa] = await connection.execute(
            `SELECT 
                u.id,
                u.nombre,
                u.cedula,
                u.email,
                u.tipo
            FROM usuarios u
            WHERE u.tipo IN ('admin', 'vendedor')
            AND u.empresa_id = 1
            AND u.activo = TRUE
            AND NOT EXISTS (
                SELECT 1 FROM empresas e2 
                WHERE e2.nombre_empresa = u.nombre 
                AND e2.id != 1
            )`
        )

        if (usuariosSinEmpresa.length === 0) {
            await connection.rollback()
            connection.release()
            return {
                success: true,
                mensaje: 'No hay usuarios para migrar',
                exitosos: 0,
                actualizados: 0,
                fallidos: 0,
                detalles: []
            }
        }

        let exitosos = 0
        let actualizados = 0
        let fallidos = 0
        const detalles = []

        for (const usuario of usuariosSinEmpresa) {
            try {
                let rncGenerado = usuario.cedula
                
                if (usuario.cedula.length > 11) {
                    const timestamp = Date.now().toString().slice(-6)
                    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
                    rncGenerado = `PEND${timestamp}${random}`.substring(0, 11)
                }

                const [empresaExistente] = await connection.execute(
                    `SELECT id FROM empresas WHERE rnc = ?`,
                    [rncGenerado]
                )

                let empresaId

                if (empresaExistente.length > 0) {
                    empresaId = empresaExistente[0].id
                } else {
                    const [resultadoEmpresa] = await connection.execute(
                        `INSERT INTO empresas (
                            nombre_empresa,
                            rnc,
                            razon_social,
                            nombre_comercial,
                            actividad_economica,
                            direccion,
                            sector,
                            municipio,
                            provincia,
                            telefono,
                            email,
                            moneda,
                            simbolo_moneda,
                            impuesto_nombre,
                            impuesto_porcentaje,
                            activo
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
                        [
                            usuario.nombre,
                            rncGenerado,
                            usuario.nombre,
                            usuario.nombre,
                            'Comercio al por menor',
                            'Direccion pendiente',
                            'Sector pendiente',
                            'Municipio pendiente',
                            'Provincia pendiente',
                            null,
                            usuario.email,
                            'DOP',
                            'RD$',
                            'ITBIS',
                            '18.00'
                        ]
                    )

                    empresaId = resultadoEmpresa.insertId
                    exitosos++
                }

                await connection.execute(
                    `UPDATE usuarios SET empresa_id = ? WHERE id = ?`,
                    [empresaId, usuario.id]
                )

                const [productosUsuario] = await connection.execute(
                    `SELECT DISTINCT p.id, p.categoria_id, p.marca_id
                    FROM productos p
                    INNER JOIN detalle_ventas dv ON p.id = dv.producto_id
                    INNER JOIN ventas v ON dv.venta_id = v.id
                    WHERE v.usuario_id = ? AND p.empresa_id = 1`,
                    [usuario.id]
                )

                let productosCount = 0
                let categoriasIds = new Set()
                let marcasIds = new Set()

                if (productosUsuario.length > 0) {
                    const productosIds = productosUsuario.map(p => {
                        if (p.categoria_id) categoriasIds.add(p.categoria_id)
                        if (p.marca_id) marcasIds.add(p.marca_id)
                        return p.id
                    })
                    
                    const placeholders = productosIds.map(() => '?').join(',')
                    
                    await connection.execute(
                        `UPDATE productos SET empresa_id = ? WHERE id IN (${placeholders})`,
                        [empresaId, ...productosIds]
                    )

                    await connection.execute(
                        `UPDATE movimientos_inventario SET empresa_id = ? WHERE producto_id IN (${placeholders})`,
                        [empresaId, ...productosIds]
                    )

                    productosCount = productosIds.length
                }

                if (categoriasIds.size > 0) {
                    const categoriasArray = Array.from(categoriasIds)
                    const placeholders = categoriasArray.map(() => '?').join(',')
                    await connection.execute(
                        `UPDATE categorias SET empresa_id = ? WHERE id IN (${placeholders}) AND empresa_id = 1`,
                        [empresaId, ...categoriasArray]
                    )
                }

                if (marcasIds.size > 0) {
                    const marcasArray = Array.from(marcasIds)
                    const placeholders = marcasArray.map(() => '?').join(',')
                    await connection.execute(
                        `UPDATE marcas SET empresa_id = ? WHERE id IN (${placeholders}) AND empresa_id = 1`,
                        [empresaId, ...marcasArray]
                    )
                }

                const [ventasResult] = await connection.execute(
                    `UPDATE ventas SET empresa_id = ? WHERE usuario_id = ?`,
                    [empresaId, usuario.id]
                )

                await connection.execute(
                    `UPDATE venta_extras SET empresa_id = ? WHERE usuario_id = ?`,
                    [empresaId, usuario.id]
                )

                const [clientesVentas] = await connection.execute(
                    `SELECT DISTINCT cliente_id 
                    FROM ventas 
                    WHERE usuario_id = ? AND cliente_id IS NOT NULL`,
                    [usuario.id]
                )

                let clientesCount = 0
                if (clientesVentas.length > 0) {
                    const clientesIds = clientesVentas.map(c => c.cliente_id)
                    const placeholders = clientesIds.map(() => '?').join(',')
                    const [clientesResult] = await connection.execute(
                        `UPDATE clientes SET empresa_id = ? WHERE id IN (${placeholders}) AND empresa_id = 1`,
                        [empresaId, ...clientesIds]
                    )
                    clientesCount = clientesResult.affectedRows
                }

                const [comprasUsuario] = await connection.execute(
                    `SELECT DISTINCT proveedor_id 
                    FROM compras 
                    WHERE usuario_id = ? AND empresa_id = 1`,
                    [usuario.id]
                )

                const [comprasResult] = await connection.execute(
                    `UPDATE compras SET empresa_id = ? WHERE usuario_id = ?`,
                    [empresaId, usuario.id]
                )

                if (comprasUsuario.length > 0) {
                    const proveedoresIds = comprasUsuario.map(c => c.proveedor_id)
                    const placeholders = proveedoresIds.map(() => '?').join(',')
                    await connection.execute(
                        `UPDATE proveedores SET empresa_id = ? WHERE id IN (${placeholders}) AND empresa_id = 1`,
                        [empresaId, ...proveedoresIds]
                    )
                }

                const [cajasResult] = await connection.execute(
                    `UPDATE cajas SET empresa_id = ? WHERE usuario_id = ?`,
                    [empresaId, usuario.id]
                )

                await connection.execute(
                    `UPDATE gastos SET empresa_id = ? WHERE usuario_id = ?`,
                    [empresaId, usuario.id]
                )

                const [despachos] = await connection.execute(
                    `SELECT id FROM despachos WHERE venta_id IN (
                        SELECT id FROM ventas WHERE usuario_id = ?
                    )`,
                    [usuario.id]
                )

                let despachosCount = despachos.length

                actualizados++

                detalles.push({
                    usuario: usuario.nombre,
                    empresa_nombre: usuario.nombre,
                    rnc: rncGenerado,
                    empresa_id: empresaId,
                    productos_migrados: productosCount,
                    ventas_migradas: ventasResult.affectedRows || 0,
                    clientes_migrados: clientesCount,
                    categorias_migradas: categoriasIds.size,
                    marcas_migradas: marcasIds.size,
                    compras_migradas: comprasResult.affectedRows || 0,
                    cajas_migradas: cajasResult.affectedRows || 0,
                    estado: 'success'
                })

            } catch (errorUsuario) {
                console.error(`Error al migrar usuario ${usuario.id}:`, errorUsuario)
                fallidos++
                detalles.push({
                    usuario: usuario.nombre,
                    empresa_nombre: 'Error',
                    rnc: usuario.cedula.substring(0, 11),
                    estado: 'error',
                    mensaje: errorUsuario.message
                })
            }
        }

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Migracion completada exitosamente',
            exitosos,
            actualizados,
            fallidos,
            detalles
        }

    } catch (error) {
        console.error('Error en migracion:', error)
        
        if (connection) {
            await connection.rollback()
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al ejecutar la migracion',
            exitosos: 0,
            actualizados: 0,
            fallidos: 0
        }
    }
}

export async function recargarAnalisis() {
    return await analizarInconsistencias()
}
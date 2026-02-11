import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/_DB/db';

export async function POST(request) {
    const connection = await db.getConnection();

    try {
        const cookieStore = cookies();
        const userId = cookieStore.get('userId')?.value;
        const empresaId = cookieStore.get('empresaId')?.value;

        if (!userId || !empresaId) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            );
        }

        const ventaData = await request.json();

        // Iniciar transacción
        await connection.beginTransaction();

        try {
            // 1. Crear venta
            const [result] = await connection.execute(
                `INSERT INTO ventas (
                    empresa_id, usuario_id, cliente_id, numero_interno,
                    fecha_venta, subtotal, descuento, itbis, total,
                    metodo_pago, estado, notas
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    empresaId,
                    userId,
                    ventaData.cliente_id || null,
                    ventaData.numero_interno,
                    ventaData.fecha_venta,
                    ventaData.subtotal,
                    ventaData.descuento || 0,
                    ventaData.itbis || 0,
                    ventaData.total,
                    ventaData.metodo_pago,
                    'completado',
                    'Sincronizado desde offline',
                ]
            );

            const ventaId = result.insertId;

            // 2. Insertar detalles
            if (ventaData.detalles && ventaData.detalles.length > 0) {
                for (const detalle of ventaData.detalles) {
                    await connection.execute(
                        `INSERT INTO detalle_ventas (
                            venta_id, producto_id, cantidad, precio_unitario, subtotal
                        ) VALUES (?, ?, ?, ?, ?)`,
                        [
                            ventaId,
                            detalle.producto_id,
                            detalle.cantidad,
                            detalle.precio_unitario,
                            detalle.subtotal,
                        ]
                    );

                    // 3. Actualizar stock (si no se actualizó ya)
                    await connection.execute(
                        `UPDATE productos 
                         SET stock = stock - ? 
                         WHERE id = ? AND empresa_id = ?`,
                        [detalle.cantidad, detalle.producto_id, empresaId]
                    );

                    // 4. Registrar movimiento de inventario
                    await connection.execute(
                        `INSERT INTO movimientos_inventario (
                            producto_id, tipo, cantidad, usuario_id, motivo, fecha_movimiento
                        ) VALUES (?, 'salida', ?, ?, 'Venta sincronizada desde offline', NOW())`,
                        [detalle.producto_id, detalle.cantidad, userId]
                    );
                }
            }

            // Commit
            await connection.commit();

            return NextResponse.json({
                success: true,
                id: ventaId,
                message: 'Venta sincronizada correctamente',
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error sincronizando venta:', error);
        return NextResponse.json(
            { error: 'Error sincronizando venta: ' + error.message },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

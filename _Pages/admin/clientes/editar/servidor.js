"use server"

import db from "@/_DB/db";
import { cookies } from "next/headers";
import { guardarImagenCliente, eliminarImagenCliente } from "@/services/imageService"
import { calcularScoreInicial, registrarHistorialCredito } from "../lib";

export async function actualizarClienteYCredito(datos) {
    let connection;
    let imagenGuardada = null;

    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;
        const empresaId = cookieStore.get("empresaId")?.value;
        const userTipo = cookieStore.get("userTipo")?.value;

        if (!userId || !empresaId || (userTipo !== "admin" && userTipo !== "vendedor" && userTipo !== "financiamiento")) {
            return { success: false, mensaje: "No tienes permisos para realizar esta acción" };
        }

        if (!datos?.cliente_id) {
            return { success: false, mensaje: "ID de cliente es requerido" };
        }

        if (!datos?.cliente?.nombre || !datos?.cliente?.numero_documento) {
            return { success: false, mensaje: "Nombre y número de documento son requeridos" };
        }

        if (datos.cliente.imagen_base64) {
            try {
                imagenGuardada = await guardarImagenCliente(datos.cliente.imagen_base64, datos.cliente_id);
            } catch (imgError) {
                console.error("Error al guardar imagen:", imgError);
            }
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [clienteExiste] = await connection.execute(
            `SELECT id, foto_url FROM clientes WHERE id = ? AND empresa_id = ?`,
            [datos.cliente_id, empresaId]
        );

        if (!clienteExiste || clienteExiste.length === 0) {
            await connection.rollback();
            connection.release();
            return { success: false, mensaje: "Cliente no encontrado" };
        }

        const imagenAnterior = clienteExiste[0].foto_url;

        const [existeDocumento] = await connection.execute(
            `SELECT id FROM clientes WHERE numero_documento = ? AND empresa_id = ? AND id != ?`,
            [datos.cliente.numero_documento, empresaId, datos.cliente_id]
        );

        if (existeDocumento && existeDocumento.length > 0) {
            await connection.rollback();
            connection.release();
            return { success: false, mensaje: "Ya existe otro cliente con ese número de documento" };
        }

        await connection.execute(
            `UPDATE clientes
             SET tipo_documento_id = ?,
                 numero_documento  = ?,
                 nombre            = ?,
                 apellidos         = ?,
                 telefono          = ?,
                 email             = ?,
                 direccion         = ?,
                 sector            = ?,
                 municipio         = ?,
                 provincia         = ?,
                 fecha_nacimiento  = ?,
                 genero            = ?,
                 estado            = ?
             WHERE id = ? AND empresa_id = ?`,
            [
                datos.cliente.tipo_documento_id || 1,
                datos.cliente.numero_documento,
                datos.cliente.nombre,
                datos.cliente.apellidos || null,
                datos.cliente.telefono || null,
                datos.cliente.email || null,
                datos.cliente.direccion || null,
                datos.cliente.sector || null,
                datos.cliente.municipio || null,
                datos.cliente.provincia || null,
                datos.cliente.fecha_nacimiento || null,
                datos.cliente.genero || null,
                datos.cliente.activo ? 'activo' : 'inactivo',
                datos.cliente_id,
                empresaId
            ]
        );

        if (imagenGuardada) {
            try {
                await connection.execute(
                    `UPDATE clientes SET foto_url = ? WHERE id = ? AND empresa_id = ?`,
                    [imagenGuardada, datos.cliente_id, empresaId]
                );
                if (imagenAnterior && imagenAnterior.startsWith('/images/')) {
                    await eliminarImagenCliente(imagenAnterior);
                }
            } catch (imgDbError) {
                console.error("Error al actualizar foto_url en BD:", imgDbError);
            }
        }

        if (datos.credito && userTipo === 'admin') {
            const creditoActivo = datos.credito.activo === true;
            const limiteNuevo = parseFloat(datos.credito.limite) || 0;
            const frecuenciaPago = datos.credito.frecuencia_pago || 'mensual';
            const diasPlazo = parseInt(datos.credito.dias_plazo) || 30;

            const [creditoActual] = await connection.execute(
                `SELECT id, limite_credito, clasificacion, frecuencia_pago, dias_plazo, activo
                 FROM credito_clientes
                 WHERE cliente_id = ? AND empresa_id = ?`,
                [datos.cliente_id, empresaId]
            );

            if (creditoActual && creditoActual.length > 0) {
                const cActual = creditoActual[0];
                const creditoId = cActual.id;
                const clasificacionNueva = datos.credito.clasificacion || cActual.clasificacion || 'C';

                await connection.execute(
                    `UPDATE credito_clientes
                     SET limite_credito  = ?,
                         frecuencia_pago = ?,
                         dias_plazo      = ?,
                         clasificacion   = ?,
                         activo          = ?,
                         modificado_por  = ?
                     WHERE id = ? AND empresa_id = ?`,
                    [
                        limiteNuevo,
                        frecuenciaPago,
                        diasPlazo,
                        clasificacionNueva,
                        creditoActivo,
                        userId,
                        creditoId,
                        empresaId
                    ]
                );

                const huboCambios =
                    parseFloat(cActual.limite_credito) !== limiteNuevo ||
                    cActual.clasificacion !== clasificacionNueva ||
                    cActual.frecuencia_pago !== frecuenciaPago ||
                    parseInt(cActual.dias_plazo) !== diasPlazo ||
                    Boolean(cActual.activo) !== creditoActivo;

                if (huboCambios) {
                    try {
                        const scoreCalculado = await calcularScoreInicial(clasificacionNueva, 0);
                        await registrarHistorialCredito(connection, {
                            credito_cliente_id: creditoId,
                            cliente_id: datos.cliente_id,
                            empresa_id: parseInt(empresaId),
                            tipo_evento: 'ajuste_manual',
                            datos_anteriores: {
                                limite_credito: parseFloat(cActual.limite_credito),
                                clasificacion: cActual.clasificacion,
                                frecuencia_pago: cActual.frecuencia_pago,
                                dias_plazo: parseInt(cActual.dias_plazo),
                                activo: Boolean(cActual.activo)
                            },
                            datos_nuevos: {
                                limite_credito: limiteNuevo,
                                clasificacion: clasificacionNueva,
                                frecuencia_pago: frecuenciaPago,
                                dias_plazo: diasPlazo,
                                activo: creditoActivo
                            },
                            clasificacion_momento: clasificacionNueva,
                            score_momento: scoreCalculado,
                            observaciones: datos.credito.observacion || 'Ajuste manual realizado',
                            usuario_id: parseInt(userId)
                        });
                    } catch (historialError) {
                        console.error("Error al registrar historial de crédito:", historialError);
                    }
                }

            } else if (creditoActivo) {
                const clasificacionNueva = 'C';
                const scoreInicial = await calcularScoreInicial(clasificacionNueva, 0);

                const [resultCredito] = await connection.execute(
                    `INSERT INTO credito_clientes (
                        cliente_id, empresa_id, limite_credito, saldo_utilizado,
                        estado_credito, clasificacion, score_crediticio,
                        frecuencia_pago, dias_plazo, activo, creado_por
                    ) VALUES (?, ?, ?, 0, 'normal', ?, ?, ?, ?, TRUE, ?)`,
                    [
                        datos.cliente_id,
                        parseInt(empresaId),
                        limiteNuevo,
                        clasificacionNueva,
                        scoreInicial,
                        frecuenciaPago,
                        diasPlazo,
                        parseInt(userId)
                    ]
                );

                const creditoId = resultCredito.insertId;

                try {
                    await registrarHistorialCredito(connection, {
                        credito_cliente_id: creditoId,
                        cliente_id: datos.cliente_id,
                        empresa_id: parseInt(empresaId),
                        tipo_evento: 'creacion',
                        datos_anteriores: null,
                        datos_nuevos: {
                            limite_credito: limiteNuevo,
                            clasificacion: clasificacionNueva,
                            frecuencia_pago: frecuenciaPago,
                            dias_plazo: diasPlazo,
                            activo: true
                        },
                        clasificacion_momento: clasificacionNueva,
                        score_momento: scoreInicial,
                        observaciones: datos.credito.observacion || 'Perfil de crédito creado desde edición',
                        usuario_id: parseInt(userId)
                    });
                } catch (historialError) {
                    console.error("Error al registrar historial de crédito nuevo:", historialError);
                }
            }
        }

        await connection.commit();
        connection.release();

        return {
            success: true,
            mensaje: "Cliente actualizado exitosamente" + (imagenGuardada ? " (imagen actualizada)" : "")
        };

    } catch (error) {
        console.error("Error al actualizar cliente y crédito:", error);

        if (connection) {
            try {
                await connection.rollback();
                connection.release();
            } catch (releaseError) {
                console.error("Error al liberar conexión:", releaseError);
            }
        }

        let mensajeError = "Error al actualizar el cliente";
        if (error.code === 'ER_DUP_ENTRY') {
            mensajeError = "Ya existe un registro con estos datos";
        } else if (error.code === 'ER_NO_REFERENCED_ROW') {
            mensajeError = "Referencia inválida en los datos";
        } else if (error.message) {
            mensajeError = error.message;
        }

        return { success: false, mensaje: mensajeError };
    }
}
"use server"

import db from "@/_DB/db";
import { cookies } from "next/headers";
import { guardarImagenCliente, eliminarImagenCliente } from "@/services/imageService"
import { calcularScoreInicial, registrarHistorialCredito } from "../lib";

// ============================================
// ACTUALIZAR CLIENTE Y CRÉDITO
// ============================================

export async function actualizarClienteYCredito(datos) {
    let connection;
    let imagenGuardada = null;
    
    try {
        // 1️⃣ Validar sesión y permisos
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;
        const empresaId = cookieStore.get("empresaId")?.value;
        const userTipo = cookieStore.get("userTipo")?.value;

        if (!userId || !empresaId || (userTipo !== "admin" && userTipo !== "vendedor")) {
            return { success: false, mensaje: "No tienes permisos para realizar esta acción" };
        }

        // Validar datos requeridos
        if (!datos?.cliente_id) {
            return { success: false, mensaje: "ID de cliente es requerido" };
        }

        if (!datos?.cliente?.nombre || !datos?.cliente?.numero_documento) {
            return { success: false, mensaje: "Nombre y número de documento son requeridos" };
        }

        // 2️⃣ Procesar imagen ANTES de la transacción (si existe)
        if (datos.cliente.imagen_base64) {
            try {
                imagenGuardada = await guardarImagenCliente(datos.cliente.imagen_base64, datos.cliente_id);
            } catch (imgError) {
                console.error("Error al guardar imagen:", imgError);
                // No fallar toda la operación por la imagen
                // Continuar sin actualizar la imagen
            }
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 3️⃣ Validar existencia del cliente y obtener imagen actual
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

        // 4️⃣ Validar duplicado de documento (excepto este cliente)
        const [existeDocumento] = await connection.execute(
            `SELECT id FROM clientes WHERE numero_documento = ? AND empresa_id = ? AND id != ?`,
            [datos.cliente.numero_documento, empresaId, datos.cliente_id]
        );

        if (existeDocumento && existeDocumento.length > 0) {
            await connection.rollback();
            connection.release();
            return { success: false, mensaje: "Ya existe otro cliente con ese número de documento" };
        }

        // 5️⃣ Actualizar datos del cliente
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

        // 6️⃣ Actualizar imagen si se guardó exitosamente
        if (imagenGuardada) {
            try {
                await connection.execute(
                    `UPDATE clientes SET foto_url = ? WHERE id = ? AND empresa_id = ?`,
                    [imagenGuardada, datos.cliente_id, empresaId]
                );
                
                // Eliminar imagen anterior si existe y es local (igual que productos)
                if (imagenAnterior && imagenAnterior.startsWith('/images/')) {
                    await eliminarImagenCliente(imagenAnterior);
                }
            } catch (imgDbError) {
                console.error("Error al actualizar foto_url en BD:", imgDbError);
                // No fallar por esto
            }
        }

        // 7️⃣ Actualizar o crear crédito (solo admin)
        if (datos.credito && userTipo === 'admin') {
            try {
                // Obtener crédito actual
                const [creditoActual] = await connection.execute(
                    `SELECT id, limite_credito, clasificacion, frecuencia_pago, dias_plazo, activo
                     FROM credito_clientes
                     WHERE cliente_id = ? AND empresa_id = ?`,
                    [datos.cliente_id, empresaId]
                );

                if (creditoActual && creditoActual.length > 0) {
                    // ACTUALIZAR crédito existente
                    const cActual = creditoActual[0];
                    const creditoId = cActual.id;

                    // Nuevos valores (con fallbacks seguros)
                    const limiteNuevo = parseFloat(datos.credito.limite) || parseFloat(cActual.limite_credito) || 0;
                    const clasificacionNueva = datos.credito.clasificacion || cActual.clasificacion || 'C';
                    const frecuenciaPago = datos.credito.frecuencia_pago || cActual.frecuencia_pago || 'mensual';
                    const diasPlazo = parseInt(datos.credito.dias_plazo) || parseInt(cActual.dias_plazo) || 30;
                    const activoNuevo = datos.credito.activo !== false;

                    // Actualizar crédito
                    await connection.execute(
                        `UPDATE credito_clientes
                         SET limite_credito  = ?,
                             frecuencia_pago = ?,
                             dias_plazo      = ?,
                             clasificacion   = ?,
                             activo          = ?,
                             modificado_por  = ?
                         WHERE id = ?`,
                        [
                            limiteNuevo,
                            frecuenciaPago,
                            diasPlazo,
                            clasificacionNueva,
                            activoNuevo,
                            userId,
                            creditoId
                        ]
                    );

                    // Registrar historial si hubo cambios significativos
                    const huboCambios =
                        parseFloat(cActual.limite_credito) !== limiteNuevo ||
                        cActual.clasificacion !== clasificacionNueva ||
                        cActual.frecuencia_pago !== frecuenciaPago ||
                        parseInt(cActual.dias_plazo) !== diasPlazo ||
                        Boolean(cActual.activo) !== activoNuevo;

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
                                    activo: activoNuevo
                                },
                                clasificacion_momento: clasificacionNueva,
                                score_momento: scoreCalculado,
                                observaciones: datos.credito.observacion || 'Ajuste manual realizado',
                                usuario_id: parseInt(userId)
                            });
                        } catch (historialError) {
                            console.error("Error al registrar historial de crédito:", historialError);
                            // No fallar por historial
                        }
                    }
                } else if (datos.credito.activo) {
                    // CREAR nuevo crédito
                    try {
                        const limiteNuevo = parseFloat(datos.credito.limite) || 0;
                        const clasificacionNueva = 'C';
                        const frecuenciaPago = datos.credito.frecuencia_pago || 'mensual';
                        const diasPlazo = parseInt(datos.credito.dias_plazo) || 30;
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

                        // Registrar en historial la creación
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
                    } catch (createError) {
                        console.error("Error al crear perfil de crédito:", createError);
                        // No fallar toda la operación por el crédito
                    }
                }
            } catch (creditoError) {
                console.error("Error en operaciones de crédito:", creditoError);
                // No fallar toda la operación por crédito
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
        
        // Mensaje de error más descriptivo
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

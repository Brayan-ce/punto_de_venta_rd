"use server"

import db from "@/_DB/db";
import { cookies } from "next/headers";
import { guardarImagenCliente } from "@/services/imageService"
import { obtenerReglasCreditoPorEmpresa, calcularScoreInicial, registrarHistorialCredito } from "../lib";

// ============================================
// 1. CREAR CLIENTE (SIN CRÉDITO)
// Transacción Simple: Cliente + Imagen
// ============================================

export async function crearCliente(datosCliente) {
    let connection;
    try {
        // 1️⃣ Validar sesión y permisos
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;
        const empresaId = cookieStore.get("empresaId")?.value;
        const userTipo = cookieStore.get("userTipo")?.value;

        if (!userId || !empresaId || (userTipo !== "admin" && userTipo !== "vendedor")) {
            return { success: false, mensaje: "No tienes permisos para crear clientes" };
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 2️⃣ Validar duplicado por número de documento
        const [existeDocumento] = await connection.execute(
            `SELECT id FROM clientes WHERE numero_documento = ? AND empresa_id = ?`,
            [datosCliente.numero_documento, empresaId]
        );

        if (existeDocumento.length > 0) {
            await connection.rollback();
            connection.release();
            return { success: false, mensaje: "Ya existe un cliente con ese número de documento" };
        }

        // 3️⃣ Insertar cliente
        const [resultadoCliente] = await connection.execute(
            `INSERT INTO clientes (
                empresa_id,
                tipo_documento_id,
                numero_documento,
                nombre,
                apellidos,
                telefono,
                email,
                direccion,
                sector,
                municipio,
                provincia,
                fecha_nacimiento,
                genero,
                foto_url,
                estado,
                activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', 1)`,
            [
                empresaId,
                datosCliente.tipo_documento_id,
                datosCliente.numero_documento,
                datosCliente.nombre,
                datosCliente.apellidos || null,
                datosCliente.telefono || null,
                datosCliente.email || null,
                datosCliente.direccion || null,
                datosCliente.sector || null,
                datosCliente.municipio || null,
                datosCliente.provincia || null,
                datosCliente.fecha_nacimiento || null,
                datosCliente.genero || null,
                null
            ]
        );

        const clienteId = resultadoCliente.insertId;

        // 4️⃣ Procesar imagen si existe
        let imagenFinal = null;
        if (datosCliente.imagen_base64) {
            try {
                imagenFinal = await guardarImagenCliente(datosCliente.imagen_base64, clienteId);
                await connection.execute(
                    `UPDATE clientes SET foto_url = ? WHERE id = ? AND empresa_id = ?`,
                    [imagenFinal, clienteId, empresaId]
                );
            } catch (error) {
                await connection.rollback();
                connection.release();
                return { success: false, mensaje: "Error al guardar la imagen: " + error.message };
            }
        }

        await connection.commit();
        connection.release();

        return {
            success: true,
            mensaje: "Cliente creado exitosamente",
            clienteId,
            cliente: {
                id: clienteId,
                nombre: datosCliente.nombre,
                apellidos: datosCliente.apellidos,
                numero_documento: datosCliente.numero_documento,
                foto_url: imagenFinal
            }
        };

    } catch (error) {
        console.error("Error al crear cliente:", error);
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        return { success: false, mensaje: "Error al crear el cliente" };
    }
}

// ============================================
// 2. ASIGNAR CRÉDITO A CLIENTE EXISTENTE
// Transacción Obligatoria: Crédito + Historial
// ============================================

export async function asignarCreditoCliente(datos) {
    let connection;
    try {
        // 1️⃣ Validar sesión y permisos
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;
        const empresaId = cookieStore.get("empresaId")?.value;
        const userTipo = cookieStore.get("userTipo")?.value;

        if (!userId || !empresaId || (userTipo !== "admin" && userTipo !== "vendedor")) {
            return { success: false, mensaje: "No tienes permisos para asignar crédito" };
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 2️⃣ Validar que el cliente existe y no tiene crédito
        const [cliente] = await connection.execute(
            `SELECT c.id, c.nombre, c.apellidos, cc.id as credito_id
             FROM clientes c
             LEFT JOIN credito_clientes cc ON c.id = cc.cliente_id AND cc.empresa_id = ?
             WHERE c.id = ? AND c.empresa_id = ?`,
            [empresaId, datos.clienteId, empresaId]
        );

        if (cliente.length === 0) {
            await connection.rollback();
            connection.release();
            return { success: false, mensaje: "Cliente no encontrado" };
        }

        if (cliente[0].credito_id) {
            await connection.rollback();
            connection.release();
            return { success: false, mensaje: "Este cliente ya tiene un crédito asignado" };
        }

        // 3️⃣ Obtener reglas de crédito
        const reglas = await obtenerReglasCreditoPorEmpresa(empresaId, connection);

        // 4️⃣ Preparar datos de crédito
        const limiteCredito = datos.credito?.limite ?? reglas.LIMITE_DEFAULT ?? 0;
        const frecuenciaPago = datos.credito?.frecuencia_pago ?? reglas.FRECUENCIA_DEFAULT ?? 'mensual';
        const diasPlazo = datos.credito?.dias_plazo ?? reglas.DIAS_PLAZO_DEFAULT ?? 30;
        const clasificacion = datos.credito?.clasificacion ?? 'C';
        const scoreInicial = await calcularScoreInicial(clasificacion, 0);

        // 5️⃣ Crear crédito
        const [resultadoCredito] = await connection.execute(
            `INSERT INTO credito_clientes (
                cliente_id,
                empresa_id,
                limite_credito,
                saldo_utilizado,
                frecuencia_pago,
                dias_plazo,
                estado_credito,
                clasificacion,
                score_crediticio,
                creado_por
            ) VALUES (?, ?, ?, 0, ?, ?, 'normal', ?, ?, ?)`,
            [
                datos.clienteId,
                empresaId,
                limiteCredito,
                frecuenciaPago,
                diasPlazo,
                clasificacion,
                scoreInicial,
                userId
            ]
        );

        const creditoId = resultadoCredito.insertId;

        // 6️⃣ Registrar historial de crédito (OBLIGATORIO - sagrado para auditoría)
        await registrarHistorialCredito(connection, {
            credito_cliente_id: creditoId,
            cliente_id: datos.clienteId,
            empresa_id: empresaId,
            tipo_evento: 'creacion_credito',
            datos_anteriores: null,
            datos_nuevos: {
                limite_credito: limiteCredito,
                saldo_utilizado: 0,
                saldo_disponible: limiteCredito,
                frecuencia_pago: frecuenciaPago,
                dias_plazo: diasPlazo,
                estado_credito: 'normal',
                clasificacion: clasificacion,
                score_crediticio: scoreInicial,
                activo: true
            },
            clasificacion_momento: clasificacion,
            score_momento: scoreInicial,
            observaciones: datos.credito?.observacion ?? 'Crédito asignado a cliente existente',
            usuario_id: userId
        });

        await connection.commit();
        connection.release();

        return {
            success: true,
            mensaje: "Crédito asignado exitosamente",
            creditoId,
            credito: {
                id: creditoId,
                cliente_id: datos.clienteId,
                limite: limiteCredito,
                clasificacion,
                score: scoreInicial
            }
        };

    } catch (error) {
        console.error("Error al asignar crédito:", error);
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        return { success: false, mensaje: "Error al asignar el crédito" };
    }
}

// ============================================
// 3. CREAR CLIENTE CON CRÉDITO (BACKWARD COMPATIBLE)
// Ahora implementado como dos operaciones separadas
// ============================================

export async function crearClienteConCredito(datos) {
    try {
        // 1️⃣ Crear cliente primero
        const resultadoCliente = await crearCliente(datos.cliente);

        if (!resultadoCliente.success) {
            return resultadoCliente;
        }

        // 2️⃣ Asignar crédito (en transacción separada)
        const resultadoCredito = await asignarCreditoCliente({
            clienteId: resultadoCliente.clienteId,
            credito: datos.credito
        });

        // 3️⃣ Manejar resultado mixto
        if (!resultadoCredito.success) {
            // Cliente creado pero crédito falló - esto está OK!
            return {
                success: false,
                mensaje: "Cliente creado pero no se pudo asignar crédito",
                clienteId: resultadoCliente.clienteId,
                creditoError: resultadoCredito.mensaje,
                cliente: resultadoCliente.cliente
            };
        }

        // 4️⃣ Éxito total
        return {
            success: true,
            mensaje: "Cliente y perfil crediticio creados exitosamente",
            clienteId: resultadoCliente.clienteId,
            creditoId: resultadoCredito.creditoId,
            cliente: {
                ...resultadoCliente.cliente,
                credito: resultadoCredito.credito
            }
        };

    } catch (error) {
        console.error("Error al crear cliente con crédito:", error);
        return { success: false, mensaje: "Error al crear el cliente" };
    }
}

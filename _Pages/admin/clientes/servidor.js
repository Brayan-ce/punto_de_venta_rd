"use server"

import db from "@/_DB/db";
import { cookies } from "next/headers";
import { eliminarImagenCliente } from "@/services/imageService"
import { obtenerReglasCreditoPorEmpresa } from "./lib";

// ============================================
// OBTENER LISTA DE CLIENTES
// ============================================

export async function obtenerClientes() {
    let connection;
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;
        const empresaId = cookieStore.get("empresaId")?.value;
        const userTipo = cookieStore.get("userTipo")?.value;

        if (!userId || !empresaId || (userTipo !== "admin" && userTipo !== "vendedor")) {
            return { success: false, mensaje: "Sesión inválida" };
        }

        connection = await db.getConnection();

        // -------------------------------
        // Consulta robusta con subconsulta de deudas por crédito
        // -------------------------------
        const [rows] = await connection.execute(
            `SELECT c.id,
                    c.nombre,
                    c.apellidos,
                    c.numero_documento,
                    c.telefono,
                    c.email,
                    c.direccion,
                    c.sector,
                    c.municipio,
                    c.provincia,
                    c.fecha_nacimiento,
                    c.genero,
                    c.foto_url,
                    c.estado                          AS cliente_estado,
                    c.total_compras,
                    c.puntos_fidelidad,

                    td.codigo                         AS tipo_documento_codigo,
                    td.nombre                         AS tipo_documento_nombre,

                    cc.id                             AS credito_id,
                    cc.limite_credito,
                    cc.saldo_utilizado,
                    cc.saldo_disponible,
                    cc.estado_credito,
                    cc.clasificacion,
                    cc.score_crediticio,
                    cc.frecuencia_pago,
                    cc.dias_plazo,
                    cc.activo                         AS credito_activo,

                    -- Subconsulta agregada de deudas
                    COALESCE(d.deuda_total, 0)        AS deuda_total,
                    COALESCE(d.deuda_vencida, 0)      AS deuda_vencida,
                    COALESCE(d.deudas_activas, 0)     AS deudas_activas,
                    COALESCE(d.dias_atraso_maximo, 0) AS dias_atraso_maximo

             FROM clientes c
                      INNER JOIN tipos_documento td ON c.tipo_documento_id = td.id
                      LEFT JOIN credito_clientes cc ON cc.cliente_id = c.id AND cc.empresa_id = c.empresa_id
                      LEFT JOIN (SELECT cxc.credito_cliente_id,
                                        SUM(CASE
                                                WHEN cxc.estado_cxc IN ('activa', 'vencida', 'parcial')
                                                    THEN cxc.saldo_pendiente
                                                ELSE 0 END)                                                            AS deuda_total,
                                        SUM(CASE WHEN cxc.estado_cxc = 'vencida' THEN cxc.saldo_pendiente ELSE 0 END)  AS deuda_vencida,
                                        COUNT(CASE WHEN cxc.estado_cxc IN ('activa', 'vencida', 'parcial') THEN 1 END) AS deudas_activas,
                                        MAX(cxc.dias_atraso)                                                           AS dias_atraso_maximo
                                 FROM cuentas_por_cobrar cxc
                                 GROUP BY cxc.credito_cliente_id) d ON d.credito_cliente_id = cc.id

             WHERE c.empresa_id = ?
             ORDER BY CASE
                          WHEN cc.estado_credito = 'bloqueado' THEN 1
                          WHEN cc.estado_credito = 'atrasado' THEN 2
                          WHEN cc.estado_credito = 'normal' THEN 3
                          ELSE 4
                          END,
                      c.nombre ASC`,
            [empresaId]
        );

        const clientesArray = Array.isArray(rows) ? rows : [];

        // Tipos de documento activos
        const [tiposRows] = await connection.execute(
            `SELECT id, codigo, nombre, longitud_min, longitud_max
             FROM tipos_documento
             WHERE activo = TRUE
             ORDER BY codigo ASC`
        );

        // Reglas de crédito por empresa
        const reglas = await obtenerReglasCreditoPorEmpresa(empresaId, connection);

        // -------------------------------
        // Formateo profesional
        // -------------------------------
        const clientesFormateados = clientesArray.map((c) => {
            const limite = Number(c.limite_credito) || 0;
            const utilizado = Number(c.saldo_utilizado) || 0;
            const porcentajeUso = limite > 0 ? Math.min((utilizado / limite) * 100, 100) : 0;

            return {
                id: c.id,
                nombreCompleto: `${c.nombre ?? ""} ${c.apellidos ?? ""}`.trim(),
                nombre: c.nombre,
                apellidos: c.apellidos,
                numeroDocumento: c.numero_documento ?? "",
                tipoDocumentoCodigo: c.tipo_documento_codigo,
                tipoDocumentoNombre: c.tipo_documento_nombre,
                telefono: c.telefono || null,
                email: c.email || null,
                direccion: c.direccion || null,
                sector: c.sector || null,
                municipio: c.municipio || null,
                provincia: c.provincia || null,
                fechaNacimiento: c.fecha_nacimiento || null,
                genero: c.genero || null,
                fotoUrl: c.foto_url || null,
                clienteActivo: c.cliente_estado === "activo",
                totalCompras: Number(c.total_compras) || 0,
                puntosFidelidad: Number(c.puntos_fidelidad) || 0,

                credito: {
                    id: c.credito_id,
                    tienePerfil: !!c.credito_id,
                    limite,
                    utilizado,
                    disponible: Number(c.saldo_disponible) || 0,
                    porcentajeUso: Math.round(porcentajeUso),
                    estadoCredito: c.estado_credito || "normal",
                    clasificacion: c.clasificacion || "C",
                    score: c.score_crediticio ?? 50,
                    frecuenciaPago: c.frecuencia_pago || "mensual",
                    diasPlazo: c.dias_plazo || 30,
                    activo: !!c.credito_activo,
                    badgeColor:
                        c.estado_credito === "normal"
                            ? "success"
                            : c.estado_credito === "atrasado"
                                ? "warning"
                                : c.estado_credito === "bloqueado"
                                    ? "danger"
                                    : "secondary",
                    puedeVender:
                        c.estado_credito === "normal" && Number(c.saldo_disponible) > 0 && !!c.credito_activo,
                },

                deuda: {
                    total: Number(c.deuda_total) || 0,
                    vencida: Number(c.deuda_vencida) || 0,
                    activas: Number(c.deudas_activas) || 0,
                    diasAtrasoMax: Number(c.dias_atraso_maximo) || 0,
                    tieneDeuda: Number(c.deuda_total) > 0,
                    tieneVencida: Number(c.deuda_vencida) > 0,
                },
            };
        });

        return {
            success: true,
            clientes: clientesFormateados,
            tiposDocumento: Array.isArray(tiposRows) ? tiposRows : [],
            reglas: reglas,
        };
    } catch (error) {
        console.error("Error al obtener clientes:", error);
        return { success: false, mensaje: "Error al cargar clientes" };
    } finally {
        if (connection) connection.release();
    }
}


// ============================================
// VALIDAR CLIENTE PARA VENTA (REGLA R-03)
// ============================================

export async function validarClienteParaVenta(clienteId, montoVenta) {
    let connection;
    try {
        const cookieStore = await cookies();
        const empresaId = cookieStore.get("empresaId")?.value;

        if (!empresaId) {
            return { success: false, mensaje: "Sesión inválida" };
        }

        connection = await db.getConnection();

        const [rows] = await connection.execute(
            `SELECT c.estado  AS cliente_estado,
                    cc.estado_credito,
                    cc.saldo_disponible,
                    cc.activo AS credito_activo
             FROM clientes c
                      LEFT JOIN credito_clientes cc ON cc.cliente_id = c.id AND cc.empresa_id = c.empresa_id
             WHERE c.id = ?
               AND c.empresa_id = ?`,
            [clienteId, empresaId]
        );

        connection.release();

        if (rows.length === 0) {
            return {
                success: false,
                valido: false,
                mensaje: "Cliente no encontrado"
            };
        }

        const cliente = rows[0];

        // Validaciones en orden de prioridad
        if (cliente.cliente_estado !== 'activo') {
            return {
                success: true,
                valido: false,
                mensaje: "El cliente está inactivo",
                codigo: 'CLIENTE_INACTIVO'
            };
        }

        if (cliente.estado_credito === 'bloqueado') {
            return {
                success: true,
                valido: false,
                mensaje: "El crédito del cliente está bloqueado",
                codigo: 'CREDITO_BLOQUEADO'
            };
        }

        if (!cliente.credito_activo) {
            return {
                success: true,
                valido: false,
                mensaje: "El cliente no tiene crédito habilitado",
                codigo: 'CREDITO_DESHABILITADO'
            };
        }

        if (cliente.saldo_disponible < montoVenta) {
            return {
                success: true,
                valido: false,
                mensaje: `Crédito insuficiente. Disponible: $${cliente.saldo_disponible.toFixed(2)}`,
                codigo: 'CREDITO_INSUFICIENTE',
                saldoDisponible: cliente.saldo_disponible
            };
        }

        return {
            success: true,
            valido: true,
            mensaje: "Cliente válido para venta a crédito",
            saldoDisponible: cliente.saldo_disponible
        };

    } catch (error) {
        console.error("Error al validar cliente:", error);
        if (connection) connection.release();
        return { success: false, mensaje: "Error al validar cliente" };
    }
}

// ============================================
// ELIMINAR CLIENTE
// ============================================

export async function eliminarCliente(clienteId) {
    let connection;
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;
        const empresaId = cookieStore.get("empresaId")?.value;
        const userTipo = cookieStore.get("userTipo")?.value;

        if (!userId || !empresaId || userTipo !== "admin") {
            return { success: false, mensaje: "No tienes permisos para eliminar clientes" };
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [cliente] = await connection.execute(
            `SELECT id, foto_url
             FROM clientes
             WHERE id = ?
               AND empresa_id = ?`,
            [clienteId, empresaId]
        );

        if (cliente.length === 0) {
            await connection.rollback();
            connection.release();
            return { success: false, mensaje: "Cliente no encontrado" };
        }

        const clienteInfo = cliente[0];

        // Verificar si tiene ventas asociadas
        const [tieneVentas] = await connection.execute(
            `SELECT COUNT(*) as total
             FROM ventas
             WHERE cliente_id = ?`,
            [clienteId]
        );

        if (tieneVentas[0].total > 0) {
            // Solo desactivar
            await connection.execute(
                `UPDATE clientes
                 SET estado = 'inactivo'
                 WHERE id = ?
                   AND empresa_id = ?`,
                [clienteId, empresaId]
            );

            await connection.execute(
                `UPDATE credito_clientes
                 SET activo = FALSE
                 WHERE cliente_id = ?
                   AND empresa_id = ?`,
                [clienteId, empresaId]
            );

            await connection.commit();
            connection.release();

            return {
                success: true,
                mensaje: "Cliente desactivado (tiene ventas asociadas)"
            };
        }

        // Eliminar físicamente
        await connection.execute(
            `DELETE
             FROM clientes
             WHERE id = ?
               AND empresa_id = ?`,
            [clienteId, empresaId]
        );

        if (clienteInfo.foto_url) {
            await eliminarImagenCliente(clienteInfo.foto_url);
        }

        await connection.commit();
        connection.release();

        return {
            success: true,
            mensaje: "Cliente eliminado exitosamente"
        };

    } catch (error) {
        console.error("Error al eliminar cliente:", error);
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        return { success: false, mensaje: "Error al eliminar el cliente" };
    }
}
"use server"

import db from "@/_DB/db";
import {cookies} from "next/headers";

// ============================================
// OBTENER CLIENTE POR ID (DETALLE COMPLETO)
// ============================================

export async function obtenerClientePorId(clienteId) {
    let connection;
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;
        const empresaId = cookieStore.get("empresaId")?.value;
        const userTipo = cookieStore.get("userTipo")?.value;

        if (!userId || !empresaId || (userTipo !== "admin" && userTipo !== "vendedor")) {
            return {success: false, mensaje: "Sesión inválida"};
        }

        connection = await db.getConnection();

        // ================================
        // Consulta principal con crédito y subconsulta de deudas
        // ================================
        const [rows] = await connection.execute(
            `SELECT c.id,
                    c.nombre,
                    c.apellidos,
                    c.numero_documento,
                    c.tipo_documento_id,
                    td.codigo                         AS tipo_documento_codigo,
                    td.nombre                         AS tipo_documento_nombre,
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

                    cc.id                             AS credito_id,
                    cc.limite_credito,
                    cc.saldo_utilizado,
                    cc.saldo_disponible,
                    cc.frecuencia_pago,
                    cc.dias_plazo,
                    cc.estado_credito,
                    cc.clasificacion,
                    cc.score_crediticio,
                    cc.activo                         AS credito_activo,
                    cc.fecha_creacion                 AS credito_fecha_creacion,
                    cc.fecha_actualizacion            AS credito_fecha_actualizacion,

                    -- Subconsulta de deudas
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

             WHERE c.id = ?
               AND c.empresa_id = ?`,
            [clienteId, empresaId]
        );

        if (!rows || rows.length === 0) {
            return {success: false, mensaje: "Cliente no encontrado"};
        }

        const c = rows[0];

        // ================================
        // Formateo de cliente
        // ================================
        const clienteFormateado = {
            id: c.id,
            nombreCompleto: `${c.nombre || ""} ${c.apellidos || ""}`.trim(),
            nombre: c.nombre,
            apellidos: c.apellidos || "",
            documento: {
                numero: c.numero_documento || "",
                tipoId: c.tipo_documento_id,
                tipoCodigo: c.tipo_documento_codigo || "",
                tipoNombre: c.tipo_documento_nombre || "",
            },
            contacto: {
                telefono: c.telefono || "",
                email: c.email || "",
                direccion: c.direccion || "",
                sector: c.sector || "",
                municipio: c.municipio || "",
                provincia: c.provincia || "",
            },
            datosPersonales: {
                fechaNacimiento: c.fecha_nacimiento || null,
                genero: c.genero || null,
            },
            fotoUrl: c.foto_url || null,
            clienteActivo: c.cliente_estado === "activo",
            totalCompras: Number(c.total_compras) || 0,
            puntosFidelidad: Number(c.puntos_fidelidad) || 0,

            credito: {
                id: c.credito_id,
                tienePerfil: !!c.credito_id,
                limite: Number(c.limite_credito) || 0,
                utilizado: Number(c.saldo_utilizado) || 0,
                disponible: Number(c.saldo_disponible) || 0,
                porcentajeUso: c.limite_credito > 0
                    ? Math.min((c.saldo_utilizado / c.limite_credito) * 100, 100)
                    : 0,
                frecuenciaPago: c.frecuencia_pago || "mensual",
                diasPlazo: c.dias_plazo || 30,
                estadoCredito: c.estado_credito || "normal",
                clasificacion: c.clasificacion || "C",
                score: c.score_crediticio ?? 50,
                activo: !!c.credito_activo,
                fechaCreacion: c.credito_fecha_creacion,
                fechaActualizacion: c.credito_fecha_actualizacion,
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

        // ================================
        // Devolver resultado
        // ================================
        return {success: true, cliente: clienteFormateado};
    } catch (error) {
        console.error("Error al obtener cliente:", error);
        return {success: false, mensaje: "Error al cargar el cliente"};
    } finally {
        if (connection) connection.release();
    }
}

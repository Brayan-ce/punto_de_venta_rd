"use server"

import db from "@/_DB/db";

/**
 * Obtener todas las reglas de crédito activas para una empresa,
 * incluyendo reglas globales del sistema.
 *
 * - Prioridad: primero reglas globales (empresa_id IS NULL), luego reglas de la empresa.
 * - Orden: según orden_ejecucion ascendente.
 *
 * @param {number} empresaId - ID de la empresa
 * @param {object} connection - Conexión a la base de datos
 * @returns {object} Mapa de reglas { codigo: configuracion }
 */
export async function obtenerReglasCreditoPorEmpresa(empresaId, connection) {
    try {
        // Obtener reglas activas globales y específicas de la empresa
        const [reglas] = await connection.execute(
            `SELECT codigo, configuracion, empresa_id, activo
             FROM reglas_credito
             WHERE activo = TRUE
               AND (empresa_id = ? OR empresa_id IS NULL)
             ORDER BY orden_ejecucion ASC, empresa_id DESC`, // reglas de la empresa sobreescriben globales
            [empresaId]
        );

        const reglasMap = {};

        reglas.forEach(r => {
            let config = r.configuracion;

            // Parsear JSON si viene como string
            if (typeof config === "string") {
                try {
                    config = JSON.parse(config);
                } catch (err) {
                    console.warn(`Error al parsear configuracion de la regla ${r.codigo}`, err);
                    config = {}; // fallback vacío
                }
            }

            // Sobreescribir reglas globales si existe versión específica de la empresa
            reglasMap[r.codigo] = config;
        });

        return reglasMap;
    } catch (error) {
        console.error("Error al obtener reglas de crédito:", error);
        return {};
    }
}

/**
 * Calcula el score inicial de un cliente según su clasificación y puntos de fidelidad.
 *
 * @param {string} clasificacion - Clasificación de riesgo del cliente (A, B, C, D)
 * @param {number} puntosFidelidad - Puntos de fidelidad del cliente
 * @param {object} [opciones] - Opciones adicionales (por ejemplo, maxScore o factorBonus)
 * @returns {number} Score calculado (0 - 100)
 */
export async  function calcularScoreInicial(clasificacion, puntosFidelidad = 0, opciones = {}) {
    const scoresBase = {
        'A': 100,
        'B': 75,
        'C': 50,
        'D': 25
    };

    // Score base según clasificación
    let score = scoresBase[clasificacion] ?? 50;

    // Configuración de opciones
    const factorBonus = opciones.factorBonus ?? 0.1; // 1 punto de fidelidad = +0.1 en score
    const maxBonus = opciones.maxBonus ?? 10;        // Bonus máximo por fidelidad
    const maxScore = opciones.maxScore ?? 100;       // Score máximo permitido

    // Calculamos bonus según puntos de fidelidad
    const bonus = Math.min(puntosFidelidad * factorBonus, maxBonus);

    // Score final
    const scoreFinal = Math.min(score + bonus, maxScore);

    return Math.round(scoreFinal); // redondeamos para mostrar número entero
}


// ============================================
// REGISTRAR HISTORIAL DE CRÉDITO
// ============================================
export async function registrarHistorialCredito(connection, datos) {
    await connection.execute(
        `INSERT INTO historial_credito (
            credito_cliente_id,
            cliente_id,
            empresa_id,
            tipo_evento,
            descripcion,
            datos_anteriores,
            datos_nuevos,
            clasificacion_momento,
            score_momento,
            generado_por,
            usuario_id,
            fecha_evento
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'usuario', ?, NOW())`,
        [
            datos.credito_cliente_id,
            datos.cliente_id,
            datos.empresa_id,
            datos.tipo_evento,
            datos.observaciones || null,
            datos.datos_anteriores ? JSON.stringify(datos.datos_anteriores) : null,
            datos.datos_nuevos ? JSON.stringify(datos.datos_nuevos) : null,
            datos.clasificacion_momento || null,
            datos.score_momento ?? null,
            datos.usuario_id
        ]
    );
}

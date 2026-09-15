/**
 * ============================================
 * SERVICIO DE IMPORTACIÓN DE PRODUCTOS DESDE EXCEL
 * ============================================
 * 
 * Procesa archivos Excel y los convierte en productos
 * con movimientos de inventario correspondientes.
 */

import * as XLSX from "xlsx";
import db from "@/_DB/db";
import {
    normalizarFila,
    validarFilas
} from "@/lib/utils/normalizadores";

/**
 * Configuración de la estructura del Excel
 * Basado en el formato proporcionado por el usuario
 */
const CONFIG_EXCEL = {
    COLUMNS: {
        REFERENCIA: 0,
        PRODUCTO: 1,
        EXISTENCIAS: 2,
        COSTO: 3,
        PRECIO_I: 4,
        PRECIO_II: 5,
        PRECIO_III: 6,
        PRECIO_IV: 7
    },
    // Palabras clave para detectar la fila de encabezados
    HEADER_KEYWORDS: ["REFERENCIA", "PRODUCTO", "EXISTENCIAS", "COSTO", "PRECIO"]
};

/**
 * Lee y parsea un archivo Excel
 * 
 * @param {Buffer} buffer - Buffer del archivo Excel
 * @returns {Array} - Array de filas (arrays de valores)
 */
function leerExcel(buffer) {
    const workbook = XLSX.read(buffer, { 
        type: "buffer",
        cellDates: false,
        cellNF: false,
        cellText: false
    });
    
    // Obtener la primera hoja
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convertir a array de arrays
    const rows = XLSX.utils.sheet_to_json(sheet, { 
        header: 1, // Usar arrays en lugar de objetos
        defval: "" // Valor por defecto para celdas vacías
    });
    
    return rows;
}

/**
 * Detecta automáticamente dónde empiezan los datos reales
 * Busca la fila que contiene "REFERENCIA" como encabezado
 * 
 * @param {Array} rows - Todas las filas del Excel
 * @returns {number} - Índice (0-based) donde empiezan los datos, o -1 si no se encuentra
 */
function detectarInicioDatos(rows) {
    // Buscar la fila que contiene "REFERENCIA" en la primera columna
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        
        // Convertir primera celda a string y limpiar
        const primeraCelda = String(row[0] || "").trim().toUpperCase();
        
        // Verificar si contiene alguna palabra clave de encabezado
        const esFilaEncabezado = CONFIG_EXCEL.HEADER_KEYWORDS.some(keyword => 
            primeraCelda.includes(keyword.toUpperCase())
        );
        
        // Si encontramos la fila de encabezados, los datos empiezan en la siguiente fila
        if (esFilaEncabezado && primeraCelda.includes("REFERENCIA")) {
            return i + 1; // La siguiente fila después del encabezado
        }
    }
    
    // Fallback: si no se encuentra, usar la fila 17 (índice 16) como predeterminado
    // Esto mantiene compatibilidad con el formato original
    return 16;
}

/**
 * Extrae solo las filas de datos (ignora encabezados automáticamente)
 * 
 * @param {Array} rows - Todas las filas del Excel
 * @returns {Object} - { filasDatos: Array, inicioDatos: number }
 */
function extraerFilasDatos(rows) {
    if (rows.length === 0) {
        return { filasDatos: [], inicioDatos: -1 };
    }
    
    // Detectar automáticamente dónde empiezan los datos
    const inicioDatos = detectarInicioDatos(rows);
    
    if (inicioDatos < 0 || inicioDatos >= rows.length) {
        return { filasDatos: [], inicioDatos: -1 };
    }
    
    // Extraer filas desde el inicio detectado
    const filasDatos = rows.slice(inicioDatos).filter(row => {
        // Filtrar filas completamente vacías
        return row && row.some(cell => {
            const valor = String(cell || "").trim();
            return valor !== "" && valor !== null && valor !== undefined;
        });
    });
    
    return { filasDatos, inicioDatos };
}

/**
 * Busca un producto existente por código
 * 
 * @param {Object} connection - Conexión a la BD
 * @param {number} empresaId - ID de la empresa
 * @param {string} codigo - Código del producto
 * @returns {Object|null} - Producto encontrado o null
 */
async function buscarProductoPorCodigo(connection, empresaId, codigo) {
    const [productos] = await connection.execute(
        `SELECT id, codigo_barras, sku, nombre, stock 
         FROM productos 
         WHERE empresa_id = ? 
         AND (codigo_barras = ? OR sku = ?)
         AND activo = TRUE
         LIMIT 1`,
        [empresaId, codigo, codigo]
    );
    
    return productos.length > 0 ? productos[0] : null;
}

/**
 * Crea un nuevo producto
 * 
 * @param {Object} connection - Conexión a la BD
 * @param {Object} datos - Datos del producto
 * @param {number} empresaId - ID de la empresa
 * @returns {number} - ID del producto creado
 */
async function crearProducto(connection, datos, empresaId) {
    // Para ventas sin asistencia, permitir precio <= 0 o precio < costo
    // Asegurar que precio_venta sea al menos 0.01 para evitar errores de BD
    const precioVentaFinal = datos.es_venta_sin_asistencia && datos.precio1 <= 0
        ? 0.01  // Mínimo permitido por BD, pero se marca como venta sin asistencia
        : datos.precio1;
    
    const [result] = await connection.execute(
        `INSERT INTO productos (
            empresa_id,
            codigo_barras,
            sku,
            nombre,
            precio_compra,
            precio_venta,
            precio_oferta,
            precio_mayorista,
            stock,
            activo,
            aplica_itbis
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            empresaId,
            datos.codigo,
            datos.codigo, // Usar el mismo código como SKU
            datos.nombre,
            datos.costo,
            precioVentaFinal,
            datos.precio3 || null, // Precio III como oferta
            datos.precio2 || null, // Precio II como mayorista
            0, // Stock inicial en 0, se ajustará con el movimiento (solo si no es venta sin asistencia)
            1, // activo
            1  // aplica_itbis
        ]
    );
    
    return result.insertId;
}

/**
 * Actualiza un producto existente
 * 
 * @param {Object} connection - Conexión a la BD
 * @param {number} productoId - ID del producto
 * @param {Object} datos - Nuevos datos
 * @param {number} empresaId - ID de la empresa
 */
async function actualizarProducto(connection, productoId, datos, empresaId) {
    // Para ventas sin asistencia, permitir precio <= 0 o precio < costo
    // Asegurar que precio_venta sea al menos 0.01 para evitar errores de BD
    const precioVentaFinal = datos.es_venta_sin_asistencia && datos.precio1 <= 0
        ? 0.01  // Mínimo permitido por BD, pero se marca como venta sin asistencia
        : datos.precio1;
    
    await connection.execute(
        `UPDATE productos 
         SET nombre = ?,
             precio_compra = ?,
             precio_venta = ?,
             precio_oferta = ?,
             precio_mayorista = ?,
             fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id = ? AND empresa_id = ?`,
        [
            datos.nombre,
            datos.costo,
            precioVentaFinal,
            datos.precio3 || null,
            datos.precio2 || null,
            productoId,
            empresaId
        ]
    );
}

/**
 * Registra un movimiento de inventario
 * 
 * @param {Object} connection - Conexión a la BD
 * @param {Object} datos - Datos del movimiento
 * @param {number} empresaId - ID de la empresa
 * @param {number} productoId - ID del producto
 * @param {number} usuarioId - ID del usuario
 */
async function registrarMovimiento(connection, datos, empresaId, productoId, usuarioId) {
    // Obtener stock actual
    const [productos] = await connection.execute(
        `SELECT stock FROM productos WHERE id = ? AND empresa_id = ?`,
        [productoId, empresaId]
    );
    
    if (productos.length === 0) {
        throw new Error(`Producto ${productoId} no encontrado`);
    }
    
    const stockAnterior = parseFloat(productos[0].stock) || 0;
    let stockNuevo;
    
    // Calcular nuevo stock según tipo de movimiento
    if (datos.tipo_movimiento === "entrada") {
        stockNuevo = stockAnterior + datos.cantidad_movimiento;
    } else if (datos.tipo_movimiento === "salida") {
        // Para salidas (ventas sin asistencia), no afectamos el stock físico
        // pero registramos el movimiento para auditoría
        stockNuevo = stockAnterior; // No cambia el stock
    } else {
        // Ajuste: establecer stock directamente
        stockNuevo = datos.existencia;
    }
    
    // Registrar movimiento
    await connection.execute(
        `INSERT INTO movimientos_inventario (
            empresa_id,
            producto_id,
            tipo,
            cantidad,
            stock_anterior,
            stock_nuevo,
            referencia,
            usuario_id,
            notas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            empresaId,
            productoId,
            datos.tipo_movimiento,
            datos.cantidad_movimiento,
            stockAnterior,
            stockNuevo,
            "IMPORTACION EXCEL",
            usuarioId,
            datos.es_venta_sin_asistencia 
                ? "Venta sin asistencia (importación Excel)" 
                : "Importación masiva desde Excel"
        ]
    );
    
    // Actualizar stock del producto (solo si no es venta sin asistencia)
    // MySQL manejará automáticamente el formato DECIMAL(13,3)
    if (!datos.es_venta_sin_asistencia) {
        await connection.execute(
            `UPDATE productos SET stock = ? WHERE id = ? AND empresa_id = ?`,
            [stockNuevo, productoId, empresaId]
        );
    }
}

/**
 * Procesa e importa productos desde un archivo Excel
 * 
 * @param {Buffer} buffer - Buffer del archivo Excel
 * @param {number} empresaId - ID de la empresa
 * @param {number} usuarioId - ID del usuario que realiza la importación
 * @param {Function} onProgreso - Callback opcional para reportar progreso: (procesados, total, estadisticas) => void
 * @returns {Object} - Resultado de la importación
 */
export async function importarProductosDesdeExcel(buffer, empresaId, usuarioId, onProgreso = null) {
    let connection;
    
    try {
        // Leer Excel
        const rows = leerExcel(buffer);
        const { filasDatos, inicioDatos } = extraerFilasDatos(rows);
        
        if (filasDatos.length === 0) {
            return {
                success: false,
                mensaje: inicioDatos === -1 
                    ? "No se pudo detectar dónde empiezan los datos. Asegúrate de que el archivo tenga la fila de encabezados con 'REFERENCIA'."
                    : "No se encontraron datos en el archivo Excel después de eliminar los encabezados",
                estadisticas: {
                    total: 0,
                    procesados: 0,
                    creados: 0,
                    actualizados: 0,
                    errores: 0
                },
                errores: []
            };
        }
        
        // Normalizar y validar filas
        // inicioDatos + 1 porque normalizarFila espera el número de fila real (1-based)
        const filasNormalizadas = filasDatos.map((row, index) => 
            normalizarFila(row, inicioDatos + 1 + index)
        );
        
        const { validas, errores: erroresValidacion } = validarFilas(filasNormalizadas);
        
        if (validas.length === 0) {
            return {
                success: false,
                mensaje: "No hay filas válidas para importar",
                estadisticas: {
                    total: filasNormalizadas.length,
                    procesados: 0,
                    creados: 0,
                    actualizados: 0,
                    errores: erroresValidacion.length
                },
                errores: erroresValidacion
            };
        }
        
        // Iniciar transacción
        connection = await db.getConnection();
        await connection.beginTransaction();
        
        const estadisticas = {
            total: filasNormalizadas.length,
            procesados: 0,
            creados: 0,
            actualizados: 0,
            errores: erroresValidacion.length
        };
        
        const erroresProcesamiento = [...erroresValidacion];
        
        // Callback para actualizar progreso (opcional)
        const onProgreso = arguments[3] || null; // Callback(opciona): (procesados, total) => void
        
        // Procesar cada fila válida
        for (let i = 0; i < validas.length; i++) {
            const fila = validas[i];
            try {
                // Buscar producto existente
                const productoExistente = await buscarProductoPorCodigo(
                    connection, 
                    empresaId, 
                    fila.codigo
                );
                
                let productoId;
                
                if (productoExistente) {
                    // Actualizar producto existente
                    await actualizarProducto(
                        connection,
                        productoExistente.id,
                        fila,
                        empresaId
                    );
                    productoId = productoExistente.id;
                    estadisticas.actualizados++;
                } else {
                    // Crear nuevo producto
                    productoId = await crearProducto(
                        connection,
                        fila,
                        empresaId
                    );
                    estadisticas.creados++;
                }
                
                // Registrar movimiento de inventario
                // Solo si hay existencia diferente de cero
                if (fila.existencia !== 0) {
                    await registrarMovimiento(
                        connection,
                        fila,
                        empresaId,
                        productoId,
                        usuarioId
                    );
                }
                
                estadisticas.procesados++;
                
                // Actualizar progreso cada 10 productos o al final
                if (onProgreso && (i % 10 === 0 || i === validas.length - 1)) {
                    onProgreso(estadisticas.procesados, validas.length, estadisticas);
                }
                
            } catch (error) {
                // Error al procesar esta fila
                erroresProcesamiento.push({
                    fila: fila.fila_excel,
                    codigo: fila.codigo,
                    nombre: fila.nombre,
                    error: error.message || "Error al procesar producto"
                });
                estadisticas.errores++;
                
                // Actualizar progreso incluso con errores
                if (onProgreso) {
                    onProgreso(estadisticas.procesados, validas.length, estadisticas);
                }
            }
        }
        
        // Si hay muchos errores, hacer rollback
        const tasaError = estadisticas.errores / estadisticas.total;
        if (tasaError > 0.5) { // Más del 50% de errores
            await connection.rollback();
            connection.release();
            
            return {
                success: false,
                mensaje: `Demasiados errores (${estadisticas.errores}/${estadisticas.total}). La importación fue cancelada.`,
                estadisticas,
                errores: erroresProcesamiento
            };
        }
        
        // Commit si todo está bien
        await connection.commit();
        connection.release();
        
        return {
            success: true,
            mensaje: `Importación completada: ${estadisticas.procesados} productos procesados (${estadisticas.creados} nuevos, ${estadisticas.actualizados} actualizados)`,
            estadisticas,
            errores: erroresProcesamiento.length > 0 ? erroresProcesamiento : null
        };
        
    } catch (error) {
        console.error("Error en importación de productos:", error);
        
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Error en rollback:", rollbackError);
            }
            connection.release();
        }
        
        return {
            success: false,
            mensaje: `Error al procesar el archivo: ${error.message}`,
            estadisticas: {
                total: 0,
                procesados: 0,
                creados: 0,
                actualizados: 0,
                errores: 0
            },
            errores: []
        };
    }
}


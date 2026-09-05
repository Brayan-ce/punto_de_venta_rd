/**
 * ============================================
 * UTILIDADES DE LIMPIEZA Y NORMALIZACIÓN
 * ============================================
 * 
 * Funciones para limpiar y normalizar datos provenientes de Excel
 * antes de insertarlos en la base de datos.
 * 
 * Principio: Limpiar antes de validar, validar antes de guardar
 */

/**
 * Limpia y normaliza texto
 * - Elimina espacios extras
 * - Convierte a mayúsculas
 * - Elimina caracteres especiales problemáticos
 * 
 * @param {any} valor - Valor a limpiar
 * @returns {string} - Texto limpio
 */
export function limpiarTexto(valor) {
    if (!valor) return "";
    
    return valor
        .toString()
        .trim()
        .replace(/\s+/g, " ") // Elimina espacios múltiples
        .replace(/[\r\n\t]/g, " ") // Elimina saltos de línea
        .toUpperCase();
}

/**
 * Limpia y convierte números
 * - Elimina símbolos de moneda (RD$, $)
 * - Elimina separadores de miles (comas)
 * - Mantiene decimales y negativos
 * 
 * @param {any} valor - Valor a limpiar
 * @returns {number} - Número limpio (0 si no es válido)
 */
export function limpiarNumero(valor) {
    if (valor === null || valor === undefined || valor === "") return 0;
    
    // Si ya es número, validar y retornar
    if (typeof valor === "number") {
        return isNaN(valor) ? 0 : valor;
    }
    
    // Convertir a string y limpiar
    const limpio = valor
        .toString()
        .replace(/[^\d.-]/g, "") // Elimina todo excepto dígitos, punto y guion
        .replace(/,/g, ""); // Elimina comas (separadores de miles)
    
    const numero = parseFloat(limpio);
    return isNaN(numero) ? 0 : numero;
}

/**
 * Limpia y normaliza códigos de producto
 * - Convierte a mayúsculas
 * - Elimina caracteres especiales
 * - Mantiene solo alfanuméricos
 * 
 * @param {any} valor - Código a limpiar
 * @returns {string} - Código normalizado
 */
export function limpiarCodigo(valor) {
    if (!valor) return "";
    
    return valor
        .toString()
        .toUpperCase()
        .trim()
        .replace(/[^A-Z0-9]/g, ""); // Solo alfanuméricos
}

/**
 * Determina el tipo de movimiento de inventario
 * según la existencia (stock)
 * 
 * Regla de negocio:
 * - Existencia negativa = venta sin asistencia (salida)
 * - Existencia positiva = ingreso (entrada)
 * - Existencia cero = ajuste
 * 
 * @param {number} existencia - Valor de existencia del Excel
 * @returns {Object} - { tipo: string, cantidad: number }
 */
export function resolverMovimiento(existencia) {
    const cantidad = Math.abs(existencia);
    
    if (existencia < 0) {
        return {
            tipo: "salida",
            cantidad: cantidad,
            esVentaSinAsistencia: true
        };
    } else if (existencia > 0) {
        return {
            tipo: "entrada",
            cantidad: cantidad,
            esVentaSinAsistencia: false
        };
    } else {
        return {
            tipo: "ajuste",
            cantidad: 0,
            esVentaSinAsistencia: false
        };
    }
}

/**
 * Normaliza una fila completa del Excel
 * Aplica todas las funciones de limpieza
 * 
 * @param {Array} row - Fila del Excel (array de valores)
 * @param {number} filaIndex - Índice de la fila (para reporte de errores)
 * @returns {Object} - Objeto normalizado
 */
export function normalizarFila(row, filaIndex = 0) {
    // Mapeo de columnas según estructura REAL del Excel (verificado con logs de runtime):
    // El Excel tiene columnas vacías que desplazan los datos:
    // REFERENCIA | (vacío) | PRODUCTO | (vacío) | (vacío) | (vacío) | EXISTENCIAS | COSTO | PRECIO I | PRECIO II | PRECIO III | PRECIO IV
    //    0           1         2          3         4         5         6             7       8          9           10          11
    // 
    // Estructura esperada original (sin columnas vacías):
    // REFERENCIA | PRODUCTO | EXISTENCIAS | COSTO | PRECIO I | PRECIO II | PRECIO III | PRECIO IV
    //    0           1           2          3        4          5           6           7
    
    const codigo = limpiarCodigo(row[0]);
    const nombre = limpiarTexto(row[2]); // El nombre está en la columna 2 (índice 2), no en la 1
    const existencia = limpiarNumero(row[6]); // EXISTENCIAS está en la columna 6 (índice 6)
    const costo = limpiarNumero(row[7]); // COSTO está en la columna 7 (índice 7)
    // Los precios están después del costo, en las siguientes columnas
    const precio1 = limpiarNumero(row[8] || 0); // PRECIO I está en la columna 8
    const precio2 = limpiarNumero(row[9] || 0); // PRECIO II está en la columna 9
    const precio3 = limpiarNumero(row[10] || 0); // PRECIO III está en la columna 10
    const precio4 = limpiarNumero(row[11] || 0); // PRECIO IV está en la columna 11
    
    const movimiento = resolverMovimiento(existencia);
    
    // Determinar si es venta sin asistencia por precio
    // Se marca como venta sin asistencia si:
    // 1. Existencia es negativa (ya manejado en resolverMovimiento)
    // 2. Precio <= 0
    // 3. Precio < costo (margen negativo)
    const esVentaSinAsistenciaPorPrecio = 
        precio1 <= 0 || 
        precio1 < costo;
    
    // Combinar ambas condiciones (existencia negativa O precio inválido)
    const esVentaSinAsistencia = movimiento.esVentaSinAsistencia || esVentaSinAsistenciaPorPrecio;
    
    return {
        codigo,
        nombre,
        existencia,
        costo,
        precio1,
        precio2,
        precio3,
        precio4,
        tipo_movimiento: movimiento.tipo,
        cantidad_movimiento: movimiento.cantidad,
        es_venta_sin_asistencia: esVentaSinAsistencia,
        fila_excel: filaIndex + 1 // Para reporte de errores (1-based)
    };
}

/**
 * Valida una fila normalizada
 * Retorna null si es válida, o mensaje de error si no
 * 
 * REGLAS DE VALIDACIÓN:
 * - Código y nombre son obligatorios
 * - Costo no puede ser negativo
 * - Si precio <= 0 o precio < costo, se marca como "venta sin asistencia" (se permite)
 * 
 * @param {Object} fila - Fila normalizada
 * @returns {string|null} - Mensaje de error o null si es válida
 */
export function validarFila(fila) {
    if (!fila.codigo || fila.codigo.trim() === "") {
        return "Código de producto vacío";
    }
    
    if (!fila.nombre || fila.nombre.trim() === "") {
        return "Nombre de producto vacío";
    }
    
    if (fila.costo < 0) {
        return "Costo no puede ser negativo";
    }
    
    // Precio <= 0 o precio < costo se permiten (venta sin asistencia)
    // No se valida aquí, se marca automáticamente en normalizarFila
    
    return null; // Fila válida
}

/**
 * Valida múltiples filas y separa válidas de inválidas
 * 
 * @param {Array} filas - Array de filas normalizadas
 * @returns {Object} - { validas: Array, errores: Array }
 */
export function validarFilas(filas) {
    const validas = [];
    const errores = [];
    
    for (const fila of filas) {
        const error = validarFila(fila);
        
        if (error) {
            errores.push({
                fila: fila.fila_excel,
                codigo: fila.codigo,
                nombre: fila.nombre,
                error: error
            });
        } else {
            validas.push(fila);
        }
    }
    
    return { validas, errores };
}


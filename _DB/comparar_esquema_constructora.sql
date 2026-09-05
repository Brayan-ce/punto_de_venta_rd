-- =====================================================
-- CONSULTA PARA COMPARAR ESQUEMA DE TABLAS DE CONSTRUCCIÓN
-- =====================================================
-- Ejecuta estas consultas en LOCAL y en PRODUCCIÓN
-- Compara los resultados para identificar diferencias
-- =====================================================

USE punto_venta_rd;

-- =====================================================
-- 1. LISTAR TODAS LAS TABLAS DE CONSTRUCCIÓN
-- =====================================================

SELECT 
    '=== TABLAS DE CONSTRUCCIÓN ===' AS info;

SELECT 
    TABLE_NAME AS tabla,
    TABLE_ROWS AS filas_estimadas,
    DATA_LENGTH AS tamaño_datos_bytes,
    INDEX_LENGTH AS tamaño_indices_bytes,
    CREATE_TIME AS fecha_creacion,
    UPDATE_TIME AS fecha_actualizacion
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND (
        TABLE_NAME LIKE '%proyecto%'
        OR TABLE_NAME LIKE '%obra%'
        OR TABLE_NAME LIKE '%servicio%'
        OR TABLE_NAME LIKE '%trabajador%'
        OR TABLE_NAME LIKE '%asignacion%'
        OR TABLE_NAME LIKE '%bitacora%'
        OR TABLE_NAME LIKE '%orden%trabajo%'
        OR TABLE_NAME LIKE '%compra%obra%'
        OR TABLE_NAME LIKE '%conduce%obra%'
        OR TABLE_NAME LIKE '%presupuesto%alerta%'
        OR TABLE_NAME LIKE '%regla%credito%'
    )
ORDER BY TABLE_NAME;

-- =====================================================
-- 2. COLUMNAS DE CADA TABLA DE CONSTRUCCIÓN
-- =====================================================

-- 2.1. proyectos
SELECT 
    '=== COLUMNAS: proyectos ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    COLUMN_TYPE AS tipo,
    IS_NULLABLE AS permite_null,
    COLUMN_DEFAULT AS valor_default,
    COLUMN_KEY AS clave,
    EXTRA AS extra,
    COLUMN_COMMENT AS comentario
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'proyectos'
ORDER BY ORDINAL_POSITION;

-- 2.2. obras
SELECT 
    '=== COLUMNAS: obras ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    COLUMN_TYPE AS tipo,
    IS_NULLABLE AS permite_null,
    COLUMN_DEFAULT AS valor_default,
    COLUMN_KEY AS clave,
    EXTRA AS extra,
    COLUMN_COMMENT AS comentario
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obras'
ORDER BY ORDINAL_POSITION;

-- 2.3. servicios
SELECT 
    '=== COLUMNAS: servicios ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    COLUMN_TYPE AS tipo,
    IS_NULLABLE AS permite_null,
    COLUMN_DEFAULT AS valor_default,
    COLUMN_KEY AS clave,
    EXTRA AS extra,
    COLUMN_COMMENT AS comentario
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'servicios'
ORDER BY ORDINAL_POSITION;

-- 2.4. trabajadores_obra
SELECT 
    '=== COLUMNAS: trabajadores_obra ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    COLUMN_TYPE AS tipo,
    IS_NULLABLE AS permite_null,
    COLUMN_DEFAULT AS valor_default,
    COLUMN_KEY AS clave,
    EXTRA AS extra,
    COLUMN_COMMENT AS comentario
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'trabajadores_obra'
ORDER BY ORDINAL_POSITION;

-- 2.5. asignaciones_trabajadores
SELECT 
    '=== COLUMNAS: asignaciones_trabajadores ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    COLUMN_TYPE AS tipo,
    IS_NULLABLE AS permite_null,
    COLUMN_DEFAULT AS valor_default,
    COLUMN_KEY AS clave,
    EXTRA AS extra,
    COLUMN_COMMENT AS comentario
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'asignaciones_trabajadores'
ORDER BY ORDINAL_POSITION;

-- 2.6. bitacora_diaria
SELECT 
    '=== COLUMNAS: bitacora_diaria ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    COLUMN_TYPE AS tipo,
    IS_NULLABLE AS permite_null,
    COLUMN_DEFAULT AS valor_default,
    COLUMN_KEY AS clave,
    EXTRA AS extra,
    COLUMN_COMMENT AS comentario
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bitacora_diaria'
ORDER BY ORDINAL_POSITION;

-- 2.7. ordenes_trabajo
SELECT 
    '=== COLUMNAS: ordenes_trabajo ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    COLUMN_TYPE AS tipo,
    IS_NULLABLE AS permite_null,
    COLUMN_DEFAULT AS valor_default,
    COLUMN_KEY AS clave,
    EXTRA AS extra,
    COLUMN_COMMENT AS comentario
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ordenes_trabajo'
ORDER BY ORDINAL_POSITION;

-- 2.8. compras_obra
SELECT 
    '=== COLUMNAS: compras_obra ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    COLUMN_TYPE AS tipo,
    IS_NULLABLE AS permite_null,
    COLUMN_DEFAULT AS valor_default,
    COLUMN_KEY AS clave,
    EXTRA AS extra,
    COLUMN_COMMENT AS comentario
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'compras_obra'
ORDER BY ORDINAL_POSITION;

-- 2.9. compras_obra_detalle
SELECT 
    '=== COLUMNAS: compras_obra_detalle ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    COLUMN_TYPE AS tipo,
    IS_NULLABLE AS permite_null,
    COLUMN_DEFAULT AS valor_default,
    COLUMN_KEY AS clave,
    EXTRA AS extra,
    COLUMN_COMMENT AS comentario
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'compras_obra_detalle'
ORDER BY ORDINAL_POSITION;

-- 2.10. conduces_obra
SELECT 
    '=== COLUMNAS: conduces_obra ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    COLUMN_TYPE AS tipo,
    IS_NULLABLE AS permite_null,
    COLUMN_DEFAULT AS valor_default,
    COLUMN_KEY AS clave,
    EXTRA AS extra,
    COLUMN_COMMENT AS comentario
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'conduces_obra'
ORDER BY ORDINAL_POSITION;

-- 2.11. conduces_obra_detalle
SELECT 
    '=== COLUMNAS: conduces_obra_detalle ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    COLUMN_TYPE AS tipo,
    IS_NULLABLE AS permite_null,
    COLUMN_DEFAULT AS valor_default,
    COLUMN_KEY AS clave,
    EXTRA AS extra,
    COLUMN_COMMENT AS comentario
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'conduces_obra_detalle'
ORDER BY ORDINAL_POSITION;

-- 2.12. presupuesto_alertas
SELECT 
    '=== COLUMNAS: presupuesto_alertas ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    COLUMN_TYPE AS tipo,
    IS_NULLABLE AS permite_null,
    COLUMN_DEFAULT AS valor_default,
    COLUMN_KEY AS clave,
    EXTRA AS extra,
    COLUMN_COMMENT AS comentario
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'presupuesto_alertas'
ORDER BY ORDINAL_POSITION;

-- 2.13. obra_documentos
SELECT 
    '=== COLUMNAS: obra_documentos ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    COLUMN_TYPE AS tipo,
    IS_NULLABLE AS permite_null,
    COLUMN_DEFAULT AS valor_default,
    COLUMN_KEY AS clave,
    EXTRA AS extra,
    COLUMN_COMMENT AS comentario
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obra_documentos'
ORDER BY ORDINAL_POSITION;

-- 2.14. obra_imagenes
SELECT 
    '=== COLUMNAS: obra_imagenes ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    COLUMN_TYPE AS tipo,
    IS_NULLABLE AS permite_null,
    COLUMN_DEFAULT AS valor_default,
    COLUMN_KEY AS clave,
    EXTRA AS extra,
    COLUMN_COMMENT AS comentario
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obra_imagenes'
ORDER BY ORDINAL_POSITION;

-- 2.15. reglas_credito (si existe)
SELECT 
    '=== COLUMNAS: reglas_credito ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    COLUMN_TYPE AS tipo,
    IS_NULLABLE AS permite_null,
    COLUMN_DEFAULT AS valor_default,
    COLUMN_KEY AS clave,
    EXTRA AS extra,
    COLUMN_COMMENT AS comentario
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reglas_credito'
ORDER BY ORDINAL_POSITION;

-- =====================================================
-- 3. ÍNDICES DE CADA TABLA
-- =====================================================

-- 3.1. Índices de proyectos
SELECT 
    '=== ÍNDICES: proyectos ===' AS info;

SELECT 
    INDEX_NAME AS nombre_indice,
    COLUMN_NAME AS columna,
    SEQ_IN_INDEX AS posicion,
    NON_UNIQUE AS no_unico,
    INDEX_TYPE AS tipo
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'proyectos'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- 3.2. Índices de obras
SELECT 
    '=== ÍNDICES: obras ===' AS info;

SELECT 
    INDEX_NAME AS nombre_indice,
    COLUMN_NAME AS columna,
    SEQ_IN_INDEX AS posicion,
    NON_UNIQUE AS no_unico,
    INDEX_TYPE AS tipo
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obras'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- 3.3. Índices de servicios
SELECT 
    '=== ÍNDICES: servicios ===' AS info;

SELECT 
    INDEX_NAME AS nombre_indice,
    COLUMN_NAME AS columna,
    SEQ_IN_INDEX AS posicion,
    NON_UNIQUE AS no_unico,
    INDEX_TYPE AS tipo
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'servicios'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- 3.4. Índices de compras_obra
SELECT 
    '=== ÍNDICES: compras_obra ===' AS info;

SELECT 
    INDEX_NAME AS nombre_indice,
    COLUMN_NAME AS columna,
    SEQ_IN_INDEX AS posicion,
    NON_UNIQUE AS no_unico,
    INDEX_TYPE AS tipo
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'compras_obra'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- =====================================================
-- 4. FOREIGN KEYS (CLAVES FORÁNEAS)
-- =====================================================

SELECT 
    '=== FOREIGN KEYS: TABLAS DE CONSTRUCCIÓN ===' AS info;

SELECT 
    TABLE_NAME AS tabla,
    CONSTRAINT_NAME AS nombre_constraint,
    COLUMN_NAME AS columna,
    REFERENCED_TABLE_NAME AS tabla_referenciada,
    REFERENCED_COLUMN_NAME AS columna_referenciada
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
    AND REFERENCED_TABLE_NAME IS NOT NULL
    AND (
        TABLE_NAME LIKE '%proyecto%'
        OR TABLE_NAME LIKE '%obra%'
        OR TABLE_NAME LIKE '%servicio%'
        OR TABLE_NAME LIKE '%trabajador%'
        OR TABLE_NAME LIKE '%asignacion%'
        OR TABLE_NAME LIKE '%bitacora%'
        OR TABLE_NAME LIKE '%orden%trabajo%'
        OR TABLE_NAME LIKE '%compra%obra%'
        OR TABLE_NAME LIKE '%conduce%obra%'
        OR TABLE_NAME LIKE '%presupuesto%alerta%'
        OR TABLE_NAME LIKE '%regla%credito%'
    )
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- =====================================================
-- 5. RESUMEN: COLUMNAS FALTANTES EN obras
-- =====================================================
-- Esta consulta lista las columnas que DEBERÍAN existir según migracion_constructora.sql
-- Compara con el resultado de la sección 2.2

SELECT 
    '=== COLUMNAS ESPERADAS EN obras ===' AS info;

SELECT 
    'id' AS columna_esperada UNION ALL
SELECT 'empresa_id' UNION ALL
SELECT 'proyecto_id' UNION ALL
SELECT 'codigo_obra' UNION ALL
SELECT 'nombre' UNION ALL
SELECT 'descripcion' UNION ALL
SELECT 'tipo_obra' UNION ALL
SELECT 'ubicacion' UNION ALL
SELECT 'zona' UNION ALL
SELECT 'municipio' UNION ALL
SELECT 'provincia' UNION ALL
SELECT 'coordenadas_gps' UNION ALL
SELECT 'presupuesto_aprobado' UNION ALL
SELECT 'costo_mano_obra' UNION ALL
SELECT 'costo_materiales' UNION ALL
SELECT 'costo_servicios' UNION ALL
SELECT 'costo_imprevistos' UNION ALL
SELECT 'costo_total' UNION ALL
SELECT 'costo_ejecutado' UNION ALL
SELECT 'fecha_inicio' UNION ALL
SELECT 'fecha_fin_estimada' UNION ALL
SELECT 'fecha_fin_real' UNION ALL
SELECT 'estado' UNION ALL
SELECT 'porcentaje_avance' UNION ALL
SELECT 'cliente_id' UNION ALL
SELECT 'usuario_responsable_id' UNION ALL
SELECT 'max_trabajadores' UNION ALL
SELECT 'requiere_bitacora_diaria' UNION ALL
SELECT 'creado_por' UNION ALL
SELECT 'fecha_creacion' UNION ALL
SELECT 'fecha_actualizacion'
ORDER BY columna_esperada;

-- =====================================================
-- 6. VERIFICACIÓN RÁPIDA: COLUMNAS CRÍTICAS
-- =====================================================

SELECT 
    '=== VERIFICACIÓN: COLUMNAS CRÍTICAS EN obras ===' AS info;

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END AS estado,
    'empresa_id' AS columna
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obras'
    AND COLUMN_NAME = 'empresa_id'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END,
    'codigo_obra'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obras'
    AND COLUMN_NAME = 'codigo_obra'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END,
    'proyecto_id'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obras'
    AND COLUMN_NAME = 'proyecto_id'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END,
    'creado_por'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obras'
    AND COLUMN_NAME = 'creado_por'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END,
    'empresa_id (compras_obra)'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'compras_obra'
    AND COLUMN_NAME = 'empresa_id';

-- =====================================================
-- FIN DE CONSULTAS
-- =====================================================
-- INSTRUCCIONES:
-- 1. Ejecuta este script en tu base de datos LOCAL
-- 2. Guarda los resultados en un archivo (ej: esquema_local.txt)
-- 3. Ejecuta este script en tu base de datos de PRODUCCIÓN
-- 4. Guarda los resultados en otro archivo (ej: esquema_produccion.txt)
-- 5. Compara ambos archivos para identificar diferencias
-- 
-- O usa herramientas como:
-- - mysqldiff (MySQL Utilities)
-- - dbdiff
-- - Comparación manual de los resultados
-- =====================================================


-- =====================================================
-- CONSULTA RÁPIDA: VERIFICAR COLUMNAS CRÍTICAS
-- =====================================================
-- Ejecuta esta consulta en LOCAL y PRODUCCIÓN
-- Compara los resultados para ver qué columnas faltan
-- =====================================================

USE punto_venta_rd;

-- =====================================================
-- RESUMEN COMPACTO: TODAS LAS COLUMNAS DE CONSTRUCCIÓN
-- =====================================================

SELECT 
    TABLE_NAME AS tabla,
    COLUMN_NAME AS columna,
    COLUMN_TYPE AS tipo,
    IS_NULLABLE AS permite_null,
    COLUMN_DEFAULT AS valor_default,
    COLUMN_KEY AS clave
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND (
        TABLE_NAME = 'proyectos'
        OR TABLE_NAME = 'obras'
        OR TABLE_NAME = 'servicios'
        OR TABLE_NAME = 'trabajadores_obra'
        OR TABLE_NAME = 'asignaciones_trabajadores'
        OR TABLE_NAME = 'bitacora_diaria'
        OR TABLE_NAME = 'ordenes_trabajo'
        OR TABLE_NAME = 'compras_obra'
        OR TABLE_NAME = 'compras_obra_detalle'
        OR TABLE_NAME = 'conduces_obra'
        OR TABLE_NAME = 'conduces_obra_detalle'
        OR TABLE_NAME = 'presupuesto_alertas'
        OR TABLE_NAME = 'obra_documentos'
        OR TABLE_NAME = 'obra_imagenes'
        OR TABLE_NAME = 'reglas_credito'
    )
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- =====================================================
-- VERIFICACIÓN ESPECÍFICA: obras
-- =====================================================

SELECT 
    '=== VERIFICACIÓN: obras ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    CASE 
        WHEN COLUMN_NAME IN (
            'empresa_id', 'codigo_obra', 'proyecto_id', 
            'creado_por', 'cliente_id', 'estado', 
            'fecha_creacion', 'nombre', 'ubicacion'
        ) THEN 'CRÍTICA'
        ELSE 'Normal'
    END AS importancia
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obras'
ORDER BY 
    CASE 
        WHEN COLUMN_NAME IN (
            'empresa_id', 'codigo_obra', 'proyecto_id', 
            'creado_por', 'cliente_id', 'estado', 
            'fecha_creacion', 'nombre', 'ubicacion'
        ) THEN 1
        ELSE 2
    END,
    COLUMN_NAME;

-- =====================================================
-- VERIFICACIÓN ESPECÍFICA: compras_obra
-- =====================================================

SELECT 
    '=== VERIFICACIÓN: compras_obra ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    CASE 
        WHEN COLUMN_NAME IN ('empresa_id', 'tipo_destino', 'destino_id') 
        THEN 'CRÍTICA'
        ELSE 'Normal'
    END AS importancia
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'compras_obra'
ORDER BY 
    CASE 
        WHEN COLUMN_NAME IN ('empresa_id', 'tipo_destino', 'destino_id') 
        THEN 1
        ELSE 2
    END,
    COLUMN_NAME;

-- =====================================================
-- TABLAS FALTANTES
-- =====================================================

SELECT 
    '=== TABLAS FALTANTES ===' AS info;

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END AS estado,
    'proyectos' AS tabla
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'proyectos'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END,
    'obras'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obras'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END,
    'servicios'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'servicios'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END,
    'trabajadores_obra'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'trabajadores_obra'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END,
    'asignaciones_trabajadores'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'asignaciones_trabajadores'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END,
    'bitacora_diaria'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bitacora_diaria'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END,
    'ordenes_trabajo'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ordenes_trabajo'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END,
    'compras_obra'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'compras_obra'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END,
    'compras_obra_detalle'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'compras_obra_detalle'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END,
    'conduces_obra'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'conduces_obra'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END,
    'conduces_obra_detalle'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'conduces_obra_detalle'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END,
    'presupuesto_alertas'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'presupuesto_alertas'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END,
    'obra_documentos'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obra_documentos'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END,
    'obra_imagenes'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obra_imagenes'

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Existe'
        ELSE '✗ FALTA'
    END,
    'reglas_credito'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reglas_credito';


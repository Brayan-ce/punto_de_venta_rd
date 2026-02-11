-- ============================================
-- DIAGNÓSTICO: Valores problemáticos en stock
-- Ejecutar ANTES de la migración para identificar problemas
-- ============================================

USE punto_venta_rd;

-- Verificar valores problemáticos en stock
SELECT 
    id,
    nombre,
    stock AS stock_actual,
    stock_minimo AS stock_min_actual,
    stock_maximo AS stock_max_actual,
    CASE 
        WHEN stock IS NULL THEN 'NULL'
        WHEN stock < -9999999.999 THEN 'FUERA DE RANGO (muy negativo)'
        WHEN stock > 9999999.999 THEN 'FUERA DE RANGO (muy grande)'
        ELSE 'OK'
    END AS estado_stock,
    CASE 
        WHEN stock_minimo IS NULL THEN 'NULL'
        WHEN stock_minimo < -9999999.999 THEN 'FUERA DE RANGO'
        WHEN stock_minimo > 9999999.999 THEN 'FUERA DE RANGO'
        ELSE 'OK'
    END AS estado_stock_min,
    CASE 
        WHEN stock_maximo IS NULL THEN 'NULL'
        WHEN stock_maximo < -9999999.999 THEN 'FUERA DE RANGO'
        WHEN stock_maximo > 9999999.999 THEN 'FUERA DE RANGO'
        ELSE 'OK'
    END AS estado_stock_max
FROM productos
WHERE stock IS NULL 
   OR stock < -9999999.999 
   OR stock > 9999999.999
   OR stock_minimo IS NULL
   OR stock_minimo < -9999999.999 
   OR stock_minimo > 9999999.999
   OR stock_maximo IS NULL
   OR stock_maximo < -9999999.999 
   OR stock_maximo > 9999999.999
ORDER BY id;

-- Contar registros problemáticos
SELECT 
    COUNT(*) as total_productos,
    COUNT(CASE WHEN stock IS NULL OR stock < -9999999.999 OR stock > 9999999.999 THEN 1 END) as stock_problematico,
    COUNT(CASE WHEN stock_minimo IS NULL OR stock_minimo < -9999999.999 OR stock_minimo > 9999999.999 THEN 1 END) as stock_min_problematico,
    COUNT(CASE WHEN stock_maximo IS NULL OR stock_maximo < -9999999.999 OR stock_maximo > 9999999.999 THEN 1 END) as stock_max_problematico
FROM productos;

-- Ver el tipo actual de las columnas
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    NUMERIC_PRECISION,
    NUMERIC_SCALE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'productos'
AND COLUMN_NAME IN ('stock', 'stock_minimo', 'stock_maximo');


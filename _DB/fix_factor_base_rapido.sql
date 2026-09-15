-- ============================================
-- CORRECCIÓN RÁPIDA: factor_base
-- Ejecutar ESTE script PRIMERO antes de insertar datos
-- ============================================

USE punto_venta_rd;

-- Modificar la columna directamente (sin verificaciones)
ALTER TABLE unidades_medida 
MODIFY COLUMN factor_base DECIMAL(18,6) DEFAULT 1.000000;

-- Verificar que se aplicó
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    NUMERIC_PRECISION,
    NUMERIC_SCALE
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'unidades_medida' 
AND COLUMN_NAME = 'factor_base';

SELECT '✓ Corrección aplicada. Ahora puedes ejecutar el INSERT de unidades.' as resultado;


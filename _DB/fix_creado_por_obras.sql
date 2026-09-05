-- =====================================================
-- FIX RÁPIDO: Agregar columna creado_por a tabla obras
-- =====================================================

USE punto_venta_rd;

-- Verificar si la columna existe
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'Columna creado_por ya existe'
        ELSE 'Columna creado_por NO existe - agregándola...'
    END AS estado
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'obras'
AND COLUMN_NAME = 'creado_por';

-- Agregar columna creado_por si no existe
SET @sql = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'obras' 
         AND COLUMN_NAME = 'creado_por') > 0,
        'SELECT 1 AS resultado',
        'ALTER TABLE obras ADD COLUMN creado_por INT(11) NOT NULL DEFAULT 1 COMMENT ''Usuario que creó la obra'' AFTER requiere_bitacora_diaria'
    )
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar que se agregó
SELECT 'Verificación:' AS info;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'obras'
AND COLUMN_NAME = 'creado_por';

SELECT 'Columna creado_por agregada exitosamente' AS resultado;


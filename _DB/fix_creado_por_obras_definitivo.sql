-- =====================================================
-- FIX DEFINITIVO: Agregar columna creado_por a tabla obras
-- =====================================================
-- Este script agrega la columna creado_por si no existe
-- y maneja correctamente los registros existentes
-- =====================================================

USE punto_venta_rd;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- =====================================================
-- PASO 1: Verificar si la columna existe
-- =====================================================

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Columna creado_por ya existe'
        ELSE '✗ Columna creado_por NO existe - agregándola...'
    END AS estado_inicial
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obras'
    AND COLUMN_NAME = 'creado_por';

-- =====================================================
-- PASO 2: Agregar columna creado_por si no existe
-- =====================================================

SET @columna_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND COLUMN_NAME = 'creado_por'
);

-- Si no existe, agregarla
SET @sql_agregar_columna = IF(
    @columna_existe = 0,
    'ALTER TABLE obras ADD COLUMN creado_por INT(11) NULL COMMENT ''Usuario que creó la obra'' AFTER requiere_bitacora_diaria',
    'SELECT 1 AS columna_ya_existe'
);

PREPARE stmt FROM @sql_agregar_columna;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 3: Actualizar registros existentes sin creado_por
-- =====================================================
-- Asignamos el primer usuario admin o el primer usuario disponible
-- como creador por defecto para registros existentes

UPDATE obras 
SET creado_por = (
    SELECT id FROM usuarios 
    WHERE empresa_id = obras.empresa_id 
    ORDER BY id ASC 
    LIMIT 1
)
WHERE creado_por IS NULL;

-- Si aún hay NULLs (empresa sin usuarios), usar el primer usuario del sistema
UPDATE obras 
SET creado_por = (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1)
WHERE creado_por IS NULL;

-- Si no hay usuarios en absoluto, usar 1 como fallback
UPDATE obras 
SET creado_por = 1
WHERE creado_por IS NULL;

-- =====================================================
-- PASO 4: Cambiar columna a NOT NULL
-- =====================================================

ALTER TABLE obras 
MODIFY COLUMN creado_por INT(11) NOT NULL COMMENT 'Usuario que creó la obra';

-- =====================================================
-- PASO 5: Agregar índice si no existe
-- =====================================================

SET @indice_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND INDEX_NAME = 'idx_creado_por'
);

SET @sql_agregar_indice = IF(
    @indice_existe = 0,
    'CREATE INDEX idx_creado_por ON obras(creado_por)',
    'SELECT 1 AS indice_ya_existe'
);

PREPARE stmt FROM @sql_agregar_indice;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 6: Agregar foreign key si no existe
-- =====================================================

SET @fk_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND CONSTRAINT_NAME = 'fk_obras_creado_por'
);

SET @sql_agregar_fk = IF(
    @fk_existe = 0,
    'ALTER TABLE obras ADD CONSTRAINT fk_obras_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id)',
    'SELECT 1 AS fk_ya_existe'
);

PREPARE stmt FROM @sql_agregar_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- FINALIZAR TRANSACCIÓN
-- =====================================================

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT '=== VERIFICACIÓN FINAL ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    DATA_TYPE AS tipo,
    IS_NULLABLE AS permite_null,
    COLUMN_DEFAULT AS valor_default,
    COLUMN_COMMENT AS comentario
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obras'
    AND COLUMN_NAME = 'creado_por';

SELECT '=== VERIFICACIÓN DE ÍNDICES ===' AS info;

SELECT 
    INDEX_NAME AS indice,
    COLUMN_NAME AS columna
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obras'
    AND COLUMN_NAME = 'creado_por';

SELECT '=== VERIFICACIÓN DE FOREIGN KEYS ===' AS info;

SELECT 
    CONSTRAINT_NAME AS constraint_name,
    COLUMN_NAME AS columna,
    REFERENCED_TABLE_NAME AS tabla_referenciada,
    REFERENCED_COLUMN_NAME AS columna_referenciada
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obras'
    AND COLUMN_NAME = 'creado_por';

SELECT '✓ Columna creado_por agregada exitosamente' AS resultado;


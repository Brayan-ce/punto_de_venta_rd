-- =====================================================
-- MIGRACIÓN: Agregar columnas faltantes a tabla obras
-- =====================================================
-- Fecha: 2026-01-28
-- Descripción: Agrega las columnas empresa_id y codigo_obra
--              a la tabla obras si no existen
-- =====================================================

USE punto_venta_rd;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- =====================================================
-- Agregar columna empresa_id si no existe
-- =====================================================
SET @dbname = DATABASE();
SET @tablename = "obras";
SET @columnname = "empresa_id";

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = @columnname)
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " INT(11) NOT NULL DEFAULT 1 COMMENT 'ID de la empresa propietaria' AFTER id")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar índice para empresa_id si no existe
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (INDEX_NAME = "idx_empresa")
    ) > 0,
    "SELECT 1",
    CONCAT("CREATE INDEX idx_empresa ON ", @tablename, "(", @columnname, ")")
));
PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

-- =====================================================
-- Agregar columna codigo_obra si no existe
-- =====================================================
SET @columnname = "codigo_obra";

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = @columnname)
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " VARCHAR(50) NOT NULL DEFAULT '' COMMENT 'Código único de la obra' AFTER empresa_id")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar índice único para codigo_obra si no existe
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (INDEX_NAME = "uk_codigo_empresa")
    ) > 0,
    "SELECT 1",
    CONCAT("CREATE UNIQUE INDEX uk_codigo_empresa ON ", @tablename, "(codigo_obra, empresa_id)")
));
PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

-- =====================================================
-- Actualizar registros existentes sin codigo_obra
-- =====================================================
-- Generar códigos para obras que no tienen código
UPDATE obras 
SET codigo_obra = CONCAT('OBR-', LPAD(id, 6, '0'))
WHERE codigo_obra = '' OR codigo_obra IS NULL;

-- =====================================================
-- FINALIZAR TRANSACCIÓN
-- =====================================================

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT 'Migración completada exitosamente' AS resultado;
SELECT 'Columnas agregadas a tabla obras:' AS info;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'obras'
AND COLUMN_NAME IN ('empresa_id', 'codigo_obra');


-- =====================================================
-- MIGRACIÓN COMPLETA: Arreglar TODAS las tablas del módulo construcción
-- =====================================================
-- Fecha: 2026-01-29
-- Descripción: Agrega todas las columnas faltantes en todas las tablas
--              del módulo de construcción
-- =====================================================

USE punto_venta_rd;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

SET @dbname = DATABASE();

-- =====================================================
-- TABLA: obras - Agregar TODAS las columnas faltantes
-- =====================================================
SET @tablename = "obras";

-- Ejecutar migración completa de obras (incluye proyecto_id, creado_por, etc.)
SOURCE _DB/migracion_completa_columnas_obras.sql;

-- =====================================================
-- TABLA: compras_obra - Agregar empresa_id si falta
-- =====================================================
SET @tablename = "compras_obra";
SET @columnname = "empresa_id";

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE (TABLE_SCHEMA = @dbname) AND (TABLE_NAME = @tablename) AND (COLUMN_NAME = @columnname)
    ) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " INT(11) NOT NULL DEFAULT 1 COMMENT 'ID de la empresa' AFTER id")
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Índice para empresa_id en compras_obra
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
        WHERE (TABLE_SCHEMA = @dbname) AND (TABLE_NAME = @tablename) AND (INDEX_NAME = "idx_empresa")
    ) > 0,
    "SELECT 1",
    CONCAT("CREATE INDEX idx_empresa ON ", @tablename, "(", @columnname, ")")
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migración completa finalizada' AS resultado;

-- Verificar columnas críticas en obras
SELECT 'Columnas en obras:' AS info;
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @dbname
AND TABLE_NAME = 'obras'
AND COLUMN_NAME IN ('empresa_id', 'codigo_obra', 'proyecto_id', 'cliente_id', 'creado_por', 'estado', 'fecha_creacion');

-- Verificar empresa_id en compras_obra
SELECT 'Columnas en compras_obra:' AS info;
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @dbname
AND TABLE_NAME = 'compras_obra'
AND COLUMN_NAME = 'empresa_id';


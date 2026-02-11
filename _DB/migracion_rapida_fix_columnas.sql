-- =====================================================
-- MIGRACIÓN RÁPIDA: Agregar columnas críticas faltantes
-- =====================================================
-- Fecha: 2026-01-29
-- Descripción: Agrega las columnas más críticas que están causando errores
-- =====================================================

USE punto_venta_rd;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

SET @dbname = DATABASE();

-- =====================================================
-- TABLA: obras - Agregar columnas críticas
-- =====================================================
SET @tablename = "obras";

-- proyecto_id
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'proyecto_id') > 0,
    "SELECT 1",
    "ALTER TABLE obras ADD COLUMN proyecto_id INT(11) COMMENT 'Proyecto al que pertenece (opcional)' AFTER empresa_id"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- creado_por
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'creado_por') > 0,
    "SELECT 1",
    "ALTER TABLE obras ADD COLUMN creado_por INT(11) NOT NULL DEFAULT 1 AFTER requiere_bitacora_diaria"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- cliente_id (si falta)
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'cliente_id') > 0,
    "SELECT 1",
    "ALTER TABLE obras ADD COLUMN cliente_id INT(11) AFTER porcentaje_avance"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- estado (si falta)
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'estado') > 0,
    "SELECT 1",
    "ALTER TABLE obras ADD COLUMN estado ENUM('planificacion', 'activa', 'suspendida', 'finalizada', 'cancelada') DEFAULT 'activa' AFTER fecha_fin_real"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- fecha_creacion (si falta)
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'fecha_creacion') > 0,
    "SELECT 1",
    "ALTER TABLE obras ADD COLUMN fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER creado_por"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- fecha_actualizacion (si falta)
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'fecha_actualizacion') > 0,
    "SELECT 1",
    "ALTER TABLE obras ADD COLUMN fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER fecha_creacion"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Índices para proyecto_id y cliente_id
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'idx_proyecto') > 0,
    "SELECT 1",
    "CREATE INDEX idx_proyecto ON obras(proyecto_id)"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'idx_cliente') > 0,
    "SELECT 1",
    "CREATE INDEX idx_cliente ON obras(cliente_id)"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- TABLA: compras_obra - Agregar empresa_id si falta
-- =====================================================
SET @tablename = "compras_obra";

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'empresa_id') > 0,
    "SELECT 1",
    "ALTER TABLE compras_obra ADD COLUMN empresa_id INT(11) NOT NULL DEFAULT 1 COMMENT 'ID de la empresa' AFTER id"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Índice para empresa_id en compras_obra
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'idx_empresa') > 0,
    "SELECT 1",
    "CREATE INDEX idx_empresa ON compras_obra(empresa_id)"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- FINALIZAR TRANSACCIÓN
-- =====================================================

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT 'Migración rápida completada' AS resultado;

SELECT 'Columnas críticas en obras:' AS info;
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @dbname
AND TABLE_NAME = 'obras'
AND COLUMN_NAME IN ('proyecto_id', 'creado_por', 'cliente_id', 'estado', 'fecha_creacion', 'empresa_id', 'codigo_obra');

SELECT 'empresa_id en compras_obra:' AS info;
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @dbname
AND TABLE_NAME = 'compras_obra'
AND COLUMN_NAME = 'empresa_id';


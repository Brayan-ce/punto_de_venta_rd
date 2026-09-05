-- =====================================================
-- MIGRACIÓN: Sistema de Obras Plantilla
-- =====================================================
-- Fecha: 2026-01-21
-- 
-- Objetivo: Agregar soporte para obras plantilla (obras reutilizables)
-- que pueden ser clonadas para crear obras reales en proyectos
-- =====================================================

USE punto_venta_rd;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- =====================================================
-- PASO 1: Agregar columna es_plantilla
-- =====================================================

SET @columna_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND COLUMN_NAME = 'es_plantilla'
);

SET @sql = IF(
    @columna_existe = 0,
    'ALTER TABLE obras ADD COLUMN es_plantilla TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''Indica si es una obra plantilla reutilizable'' AFTER proyecto_id',
    'SELECT 1 AS columna_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 2: Agregar columna obra_plantilla_id
-- =====================================================

SET @columna_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND COLUMN_NAME = 'obra_plantilla_id'
);

SET @sql = IF(
    @columna_existe = 0,
    'ALTER TABLE obras ADD COLUMN obra_plantilla_id INT(11) NULL COMMENT ''Referencia a la obra plantilla original si fue clonada'' AFTER es_plantilla',
    'SELECT 1 AS columna_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 3: Crear índice para filtrado rápido
-- =====================================================

SET @indice_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND INDEX_NAME = 'idx_es_plantilla'
);

SET @sql = IF(
    @indice_existe = 0,
    'CREATE INDEX idx_es_plantilla ON obras(es_plantilla)',
    'SELECT 1 AS indice_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 4: Crear índice compuesto para búsqueda eficiente
-- =====================================================

SET @indice_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND INDEX_NAME = 'idx_empresa_plantilla'
);

SET @sql = IF(
    @indice_existe = 0,
    'CREATE INDEX idx_empresa_plantilla ON obras(empresa_id, es_plantilla)',
    'SELECT 1 AS indice_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 5: Agregar foreign key para obra_plantilla_id
-- =====================================================

SET @fk_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND CONSTRAINT_NAME = 'fk_obra_plantilla'
);

SET @sql = IF(
    @fk_existe = 0,
    'ALTER TABLE obras ADD CONSTRAINT fk_obra_plantilla FOREIGN KEY (obra_plantilla_id) REFERENCES obras(id) ON DELETE SET NULL',
    'SELECT 1 AS fk_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 6: Validar datos existentes
-- =====================================================

-- Asegurar que obras con proyecto_id no sean plantillas
UPDATE obras 
SET es_plantilla = 0 
WHERE proyecto_id IS NOT NULL AND es_plantilla = 1;

-- Asegurar que obras plantilla no tengan proyecto_id
UPDATE obras 
SET proyecto_id = NULL 
WHERE es_plantilla = 1 AND proyecto_id IS NOT NULL;

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- NOTAS SOBRE EL DISEÑO
-- =====================================================
-- 
-- Reglas de negocio:
-- 1. Si es_plantilla = 1 → proyecto_id debe ser NULL
-- 2. Si obra_plantilla_id existe → obra fue clonada desde plantilla
-- 3. Obras plantilla no pueden tener costos ejecutados ni bitácoras
-- 4. Al clonar una obra plantilla:
--    - Se crea nueva obra con es_plantilla = 0
--    - Se asigna proyecto_id
--    - Se guarda obra_plantilla_id para trazabilidad
--    - NO se copian: bitácoras, costos ejecutados, fechas reales
--    - SÍ se copian: estructura, presupuestos base, servicios base
-- 
-- =====================================================


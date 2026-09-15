-- =====================================================
-- FIX COMPLETO: Agregar todas las columnas faltantes a tabla obras
-- =====================================================
-- Este script agrega todas las columnas que el código necesita
-- para poder insertar obras correctamente.
-- 
-- Columnas agregadas:
-- - descripcion, tipo_obra, zona, municipio, provincia, coordenadas_gps
-- - proyecto_id, cliente_id, usuario_responsable_id, creado_por
-- - costo_mano_obra, costo_materiales, costo_servicios, costo_imprevistos
-- - costo_total, costo_ejecutado, porcentaje_avance
-- - max_trabajadores, requiere_bitacora_diaria
-- - fecha_creacion, fecha_actualizacion (migra desde creado_at/actualizado_at si existen)
-- =====================================================

USE punto_venta_rd;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- =====================================================
-- PASO 1: Agregar columna descripcion si no existe
-- =====================================================

SET @columna_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND COLUMN_NAME = 'descripcion'
);

SET @sql = IF(
    @columna_existe = 0,
    'ALTER TABLE obras ADD COLUMN descripcion TEXT NULL COMMENT ''Descripción de la obra'' AFTER nombre',
    'SELECT 1 AS columna_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 2: Agregar columna tipo_obra si no existe
-- =====================================================

SET @columna_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND COLUMN_NAME = 'tipo_obra'
);

SET @sql = IF(
    @columna_existe = 0,
    'ALTER TABLE obras ADD COLUMN tipo_obra ENUM(''construccion'', ''remodelacion'', ''reparacion'', ''mantenimiento'', ''otro'') DEFAULT ''construccion'' COMMENT ''Tipo de obra'' AFTER descripcion',
    'SELECT 1 AS columna_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 3: Agregar columna zona si no existe
-- =====================================================

SET @columna_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND COLUMN_NAME = 'zona'
);

SET @sql = IF(
    @columna_existe = 0,
    'ALTER TABLE obras ADD COLUMN zona VARCHAR(100) NULL COMMENT ''Zona o sector'' AFTER ubicacion',
    'SELECT 1 AS columna_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 4: Agregar columna municipio si no existe
-- =====================================================

SET @columna_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND COLUMN_NAME = 'municipio'
);

SET @sql = IF(
    @columna_existe = 0,
    'ALTER TABLE obras ADD COLUMN municipio VARCHAR(100) NULL COMMENT ''Municipio'' AFTER zona',
    'SELECT 1 AS columna_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 5: Agregar columna provincia si no existe
-- =====================================================

SET @columna_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND COLUMN_NAME = 'provincia'
);

SET @sql = IF(
    @columna_existe = 0,
    'ALTER TABLE obras ADD COLUMN provincia VARCHAR(100) NULL COMMENT ''Provincia'' AFTER municipio',
    'SELECT 1 AS columna_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 6: Agregar columna cliente_id si no existe
-- =====================================================

SET @columna_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND COLUMN_NAME = 'cliente_id'
);

SET @sql = IF(
    @columna_existe = 0,
    'ALTER TABLE obras ADD COLUMN cliente_id INT(11) NULL COMMENT ''Cliente asociado'' AFTER estado',
    'SELECT 1 AS columna_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 7: Agregar columna usuario_responsable_id si no existe
-- =====================================================

SET @columna_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND COLUMN_NAME = 'usuario_responsable_id'
);

SET @sql = IF(
    @columna_existe = 0,
    'ALTER TABLE obras ADD COLUMN usuario_responsable_id INT(11) NULL COMMENT ''Usuario responsable'' AFTER cliente_id',
    'SELECT 1 AS columna_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 8: Agregar columna proyecto_id si no existe
-- =====================================================

SET @columna_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND COLUMN_NAME = 'proyecto_id'
);

SET @sql = IF(
    @columna_existe = 0,
    'ALTER TABLE obras ADD COLUMN proyecto_id INT(11) NULL COMMENT ''Proyecto al que pertenece'' AFTER empresa_id',
    'SELECT 1 AS columna_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 8b: Agregar columna coordenadas_gps si no existe
-- =====================================================

SET @columna_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND COLUMN_NAME = 'coordenadas_gps'
);

SET @sql = IF(
    @columna_existe = 0,
    'ALTER TABLE obras ADD COLUMN coordenadas_gps VARCHAR(100) NULL COMMENT ''Lat,Lng para geolocalización'' AFTER provincia',
    'SELECT 1 AS columna_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 8c: Agregar columnas de costos si no existen
-- =====================================================

-- costo_mano_obra
SET @columna_existe = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'obras' AND COLUMN_NAME = 'costo_mano_obra'
);
SET @sql = IF(@columna_existe = 0, 'ALTER TABLE obras ADD COLUMN costo_mano_obra DECIMAL(14,2) DEFAULT 0.00 COMMENT ''Costo de mano de obra'' AFTER presupuesto_aprobado', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- costo_materiales
SET @columna_existe = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'obras' AND COLUMN_NAME = 'costo_materiales'
);
SET @sql = IF(@columna_existe = 0, 'ALTER TABLE obras ADD COLUMN costo_materiales DECIMAL(14,2) DEFAULT 0.00 COMMENT ''Costo de materiales'' AFTER costo_mano_obra', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- costo_servicios
SET @columna_existe = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'obras' AND COLUMN_NAME = 'costo_servicios'
);
SET @sql = IF(@columna_existe = 0, 'ALTER TABLE obras ADD COLUMN costo_servicios DECIMAL(14,2) DEFAULT 0.00 COMMENT ''Costo de servicios'' AFTER costo_materiales', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- costo_imprevistos
SET @columna_existe = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'obras' AND COLUMN_NAME = 'costo_imprevistos'
);
SET @sql = IF(@columna_existe = 0, 'ALTER TABLE obras ADD COLUMN costo_imprevistos DECIMAL(14,2) DEFAULT 0.00 COMMENT ''Costo de imprevistos'' AFTER costo_servicios', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- costo_total
SET @columna_existe = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'obras' AND COLUMN_NAME = 'costo_total'
);
SET @sql = IF(@columna_existe = 0, 'ALTER TABLE obras ADD COLUMN costo_total DECIMAL(14,2) DEFAULT 0.00 COMMENT ''Costo total'' AFTER costo_imprevistos', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- costo_ejecutado
SET @columna_existe = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'obras' AND COLUMN_NAME = 'costo_ejecutado'
);
SET @sql = IF(@columna_existe = 0, 'ALTER TABLE obras ADD COLUMN costo_ejecutado DECIMAL(14,2) DEFAULT 0.00 COMMENT ''Costo ejecutado'' AFTER costo_total', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 8d: Agregar columnas de control si no existen
-- =====================================================

-- porcentaje_avance
SET @columna_existe = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'obras' AND COLUMN_NAME = 'porcentaje_avance'
);
SET @sql = IF(@columna_existe = 0, 'ALTER TABLE obras ADD COLUMN porcentaje_avance DECIMAL(5,2) DEFAULT 0.00 COMMENT ''Porcentaje de avance'' AFTER estado', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- max_trabajadores
SET @columna_existe = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'obras' AND COLUMN_NAME = 'max_trabajadores'
);
SET @sql = IF(@columna_existe = 0, 'ALTER TABLE obras ADD COLUMN max_trabajadores INT(11) DEFAULT 50 COMMENT ''Máximo de trabajadores permitidos'' AFTER usuario_responsable_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- requiere_bitacora_diaria
SET @columna_existe = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'obras' AND COLUMN_NAME = 'requiere_bitacora_diaria'
);
SET @sql = IF(@columna_existe = 0, 'ALTER TABLE obras ADD COLUMN requiere_bitacora_diaria TINYINT(1) DEFAULT 1 COMMENT ''Requiere bitácora diaria'' AFTER max_trabajadores', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 8e: Agregar columna creado_por si no existe
-- =====================================================

SET @columna_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND COLUMN_NAME = 'creado_por'
);

SET @sql = IF(
    @columna_existe = 0,
    'ALTER TABLE obras ADD COLUMN creado_por INT(11) NULL COMMENT ''Usuario que creó la obra'' AFTER usuario_responsable_id',
    'SELECT 1 AS columna_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 9: Agregar columna fecha_creacion si no existe
-- =====================================================

SET @columna_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND COLUMN_NAME = 'fecha_creacion'
);

SET @sql = IF(
    @columna_existe = 0,
    'ALTER TABLE obras ADD COLUMN fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT ''Fecha de creación de la obra'' AFTER creado_por',
    'SELECT 1 AS columna_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Si existe creado_at, copiar valores a fecha_creacion
SET @columna_antigua_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND COLUMN_NAME = 'creado_at'
);

SET @sql = IF(
    @columna_antigua_existe > 0,
    'UPDATE obras SET fecha_creacion = creado_at WHERE fecha_creacion IS NULL',
    'SELECT 1 AS no_hay_columna_antigua'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 10: Agregar columna fecha_actualizacion si no existe
-- =====================================================

SET @columna_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND COLUMN_NAME = 'fecha_actualizacion'
);

SET @sql = IF(
    @columna_existe = 0,
    'ALTER TABLE obras ADD COLUMN fecha_actualizacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''Fecha de última actualización'' AFTER fecha_creacion',
    'SELECT 1 AS columna_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Si existe actualizado_at, copiar valores a fecha_actualizacion
SET @columna_antigua_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND COLUMN_NAME = 'actualizado_at'
);

SET @sql = IF(
    @columna_antigua_existe > 0,
    'UPDATE obras SET fecha_actualizacion = actualizado_at WHERE fecha_actualizacion IS NULL',
    'SELECT 1 AS no_hay_columna_antigua'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 11: Actualizar registros existentes sin creado_por
-- =====================================================

UPDATE obras 
SET creado_por = (
    SELECT id FROM usuarios 
    WHERE empresa_id = obras.empresa_id 
    ORDER BY id ASC 
    LIMIT 1
)
WHERE creado_por IS NULL;

UPDATE obras 
SET creado_por = (SELECT id FROM usuarios ORDER BY id ASC LIMIT 1)
WHERE creado_por IS NULL;

UPDATE obras 
SET creado_por = 1
WHERE creado_por IS NULL;

-- =====================================================
-- PASO 12: Cambiar columna creado_por a NOT NULL
-- =====================================================

ALTER TABLE obras 
MODIFY COLUMN creado_por INT(11) NOT NULL COMMENT 'Usuario que creó la obra';

-- =====================================================
-- PASO 13: Agregar índices si no existen
-- =====================================================

-- Índice para cliente_id
SET @indice_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND INDEX_NAME = 'idx_cliente'
);

SET @sql = IF(
    @indice_existe = 0,
    'CREATE INDEX idx_cliente ON obras(cliente_id)',
    'SELECT 1 AS indice_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Índice para usuario_responsable_id
SET @indice_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND INDEX_NAME = 'idx_responsable'
);

SET @sql = IF(
    @indice_existe = 0,
    'CREATE INDEX idx_responsable ON obras(usuario_responsable_id)',
    'SELECT 1 AS indice_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Índice para creado_por
SET @indice_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND INDEX_NAME = 'idx_creado_por'
);

SET @sql = IF(
    @indice_existe = 0,
    'CREATE INDEX idx_creado_por ON obras(creado_por)',
    'SELECT 1 AS indice_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- PASO 14: Agregar foreign keys si no existen
-- =====================================================

-- FK para cliente_id
SET @fk_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND CONSTRAINT_NAME = 'fk_obras_cliente'
);

SET @sql = IF(
    @fk_existe = 0,
    'ALTER TABLE obras ADD CONSTRAINT fk_obras_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL',
    'SELECT 1 AS fk_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK para usuario_responsable_id
SET @fk_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND CONSTRAINT_NAME = 'fk_obras_responsable'
);

SET @sql = IF(
    @fk_existe = 0,
    'ALTER TABLE obras ADD CONSTRAINT fk_obras_responsable FOREIGN KEY (usuario_responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL',
    'SELECT 1 AS fk_ya_existe'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK para creado_por
SET @fk_existe = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'obras' 
        AND CONSTRAINT_NAME = 'fk_obras_creado_por'
);

SET @sql = IF(
    @fk_existe = 0,
    'ALTER TABLE obras ADD CONSTRAINT fk_obras_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id)',
    'SELECT 1 AS fk_ya_existe'
);

PREPARE stmt FROM @sql;
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

SELECT '=== VERIFICACIÓN: COLUMNAS AGREGADAS ===' AS info;

SELECT 
    COLUMN_NAME AS columna,
    DATA_TYPE AS tipo,
    IS_NULLABLE AS permite_null,
    COLUMN_DEFAULT AS valor_default
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obras'
    AND COLUMN_NAME IN ('descripcion', 'tipo_obra', 'zona', 'municipio', 'provincia', 'cliente_id', 'usuario_responsable_id', 'creado_por', 'fecha_creacion', 'fecha_actualizacion')
ORDER BY ORDINAL_POSITION;

SELECT '=== VERIFICACIÓN: ESTRUCTURA COMPLETA ===' AS info;

DESCRIBE obras;

SELECT '✓ Todas las columnas necesarias han sido agregadas exitosamente' AS resultado;


-- ============================================
-- VERIFICACIÓN Y CORRECCIÓN: Sistema de Unidades de Medida
-- Fecha: 2025-01-25
-- Versión: 1.0.0
-- Descripción: Verifica y corrige campos faltantes en la migración
-- ============================================

USE punto_venta_rd;

-- ============================================
-- 1. VERIFICAR Y CORREGIR productos
-- ============================================

-- Verificar si falta precio_por_unidad
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'productos' 
    AND COLUMN_NAME = 'precio_por_unidad'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE productos ADD COLUMN precio_por_unidad DECIMAL(12,2) NULL COMMENT \'Precio en unidad base\', ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Columna precio_por_unidad ya existe" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar si falta permite_decimales
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'productos' 
    AND COLUMN_NAME = 'permite_decimales'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE productos ADD COLUMN permite_decimales BOOLEAN DEFAULT FALSE, ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Columna permite_decimales ya existe" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar si falta unidad_venta_default_id
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'productos' 
    AND COLUMN_NAME = 'unidad_venta_default_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE productos ADD COLUMN unidad_venta_default_id INT NULL COMMENT \'Unidad por defecto en ventas\', ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Columna unidad_venta_default_id ya existe" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar si stock es DECIMAL(13,3)
SET @col_type = (
    SELECT DATA_TYPE 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'productos' 
    AND COLUMN_NAME = 'stock'
);

SET @col_precision = (
    SELECT NUMERIC_PRECISION 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'productos' 
    AND COLUMN_NAME = 'stock'
);

SET @sql = IF(@col_type != 'decimal' OR @col_precision != 13,
    'ALTER TABLE productos MODIFY COLUMN stock DECIMAL(13,3) NOT NULL DEFAULT 0.000',
    'SELECT "Columna stock ya es DECIMAL(13,3)" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar si stock_minimo es DECIMAL(13,3)
SET @col_type = (
    SELECT DATA_TYPE 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'productos' 
    AND COLUMN_NAME = 'stock_minimo'
);

SET @col_precision = (
    SELECT NUMERIC_PRECISION 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'productos' 
    AND COLUMN_NAME = 'stock_minimo'
);

SET @sql = IF(@col_type != 'decimal' OR @col_precision != 13,
    'ALTER TABLE productos MODIFY COLUMN stock_minimo DECIMAL(13,3) DEFAULT 5.000',
    'SELECT "Columna stock_minimo ya es DECIMAL(13,3)" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar si stock_maximo es DECIMAL(13,3)
SET @col_type = (
    SELECT DATA_TYPE 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'productos' 
    AND COLUMN_NAME = 'stock_maximo'
);

SET @col_precision = (
    SELECT NUMERIC_PRECISION 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'productos' 
    AND COLUMN_NAME = 'stock_maximo'
);

SET @sql = IF(@col_type != 'decimal' OR @col_precision != 13,
    'ALTER TABLE productos MODIFY COLUMN stock_maximo DECIMAL(13,3) DEFAULT 100.000',
    'SELECT "Columna stock_maximo ya es DECIMAL(13,3)" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. VERIFICAR Y CORREGIR detalle_ventas
-- ============================================

-- Verificar si falta unidad_medida_id
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'detalle_ventas' 
    AND COLUMN_NAME = 'unidad_medida_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE detalle_ventas ADD COLUMN unidad_medida_id INT NULL COMMENT \'Unidad usada en la venta\', ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Columna unidad_medida_id ya existe" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar si falta cantidad_base
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'detalle_ventas' 
    AND COLUMN_NAME = 'cantidad_base'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE detalle_ventas ADD COLUMN cantidad_base DECIMAL(13,3) NULL COMMENT \'Cantidad convertida a unidad base\', ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Columna cantidad_base ya existe" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 3. VERIFICAR Y CORREGIR movimientos_inventario
-- ============================================

-- Verificar si stock_nuevo es DECIMAL(13,3)
SET @col_type = (
    SELECT DATA_TYPE 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'movimientos_inventario' 
    AND COLUMN_NAME = 'stock_nuevo'
);

SET @col_precision = (
    SELECT NUMERIC_PRECISION 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'movimientos_inventario' 
    AND COLUMN_NAME = 'stock_nuevo'
);

SET @sql = IF(@col_type != 'decimal' OR @col_precision != 13,
    'ALTER TABLE movimientos_inventario MODIFY COLUMN stock_nuevo DECIMAL(13,3) NOT NULL',
    'SELECT "Columna stock_nuevo ya es DECIMAL(13,3)" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 4. CREAR CONVERSIONES BÁSICAS (si no existen)
-- ============================================

-- Obtener IDs de unidades disponibles (más flexible)
SET @kilo_id = (SELECT id FROM unidades_medida WHERE codigo = 'KG' LIMIT 1);
SET @libra_id = (SELECT id FROM unidades_medida WHERE codigo = 'LB' LIMIT 1);
SET @gramo_id = (SELECT id FROM unidades_medida WHERE codigo IN ('G', 'GR', 'GRAMO') LIMIT 1);
SET @unidad_id = (SELECT id FROM unidades_medida WHERE codigo IN ('UN', 'UND', 'UNIDAD') LIMIT 1);

-- Conversiones: Libra ↔ Kilo (si existen ambas unidades)
INSERT INTO conversiones_unidad (unidad_origen_id, unidad_destino_id, factor, activo)
SELECT @kilo_id, @libra_id, 2.20462, TRUE
WHERE @kilo_id IS NOT NULL AND @libra_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM conversiones_unidad 
    WHERE unidad_origen_id = @kilo_id AND unidad_destino_id = @libra_id
  )
ON DUPLICATE KEY UPDATE factor = 2.20462;

INSERT INTO conversiones_unidad (unidad_origen_id, unidad_destino_id, factor, activo)
SELECT @libra_id, @kilo_id, 0.453592, TRUE
WHERE @kilo_id IS NOT NULL AND @libra_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM conversiones_unidad 
    WHERE unidad_origen_id = @libra_id AND unidad_destino_id = @kilo_id
  )
ON DUPLICATE KEY UPDATE factor = 0.453592;

-- Conversiones: Gramo ↔ Kilo (si existen ambas unidades)
INSERT INTO conversiones_unidad (unidad_origen_id, unidad_destino_id, factor, activo)
SELECT @kilo_id, @gramo_id, 1000.000000, TRUE
WHERE @kilo_id IS NOT NULL AND @gramo_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM conversiones_unidad 
    WHERE unidad_origen_id = @kilo_id AND unidad_destino_id = @gramo_id
  )
ON DUPLICATE KEY UPDATE factor = 1000.000000;

INSERT INTO conversiones_unidad (unidad_origen_id, unidad_destino_id, factor, activo)
SELECT @gramo_id, @kilo_id, 0.001000, TRUE
WHERE @kilo_id IS NOT NULL AND @gramo_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM conversiones_unidad 
    WHERE unidad_origen_id = @gramo_id AND unidad_destino_id = @kilo_id
  )
ON DUPLICATE KEY UPDATE factor = 0.001000;

-- Conversiones: Gramo ↔ Libra (si existen ambas unidades)
INSERT INTO conversiones_unidad (unidad_origen_id, unidad_destino_id, factor, activo)
SELECT @libra_id, @gramo_id, 453.592000, TRUE
WHERE @libra_id IS NOT NULL AND @gramo_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM conversiones_unidad 
    WHERE unidad_origen_id = @libra_id AND unidad_destino_id = @gramo_id
  )
ON DUPLICATE KEY UPDATE factor = 453.592000;

INSERT INTO conversiones_unidad (unidad_origen_id, unidad_destino_id, factor, activo)
SELECT @gramo_id, @libra_id, 0.00220462, TRUE
WHERE @libra_id IS NOT NULL AND @gramo_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM conversiones_unidad 
    WHERE unidad_origen_id = @gramo_id AND unidad_destino_id = @libra_id
  )
ON DUPLICATE KEY UPDATE factor = 0.00220462;

-- ============================================
-- 5. VERIFICACIÓN FINAL
-- ============================================

-- Mostrar resumen de columnas agregadas
SELECT 
    'productos' as tabla,
    COLUMN_NAME,
    DATA_TYPE,
    NUMERIC_PRECISION,
    NUMERIC_SCALE,
    IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'productos'
AND COLUMN_NAME IN ('precio_por_unidad', 'permite_decimales', 'unidad_venta_default_id', 'stock', 'stock_minimo', 'stock_maximo')
ORDER BY ORDINAL_POSITION;

SELECT 
    'detalle_ventas' as tabla,
    COLUMN_NAME,
    DATA_TYPE,
    NUMERIC_PRECISION,
    NUMERIC_SCALE,
    IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'detalle_ventas'
AND COLUMN_NAME IN ('unidad_medida_id', 'cantidad_base')
ORDER BY ORDINAL_POSITION;

SELECT 
    'movimientos_inventario' as tabla,
    COLUMN_NAME,
    DATA_TYPE,
    NUMERIC_PRECISION,
    NUMERIC_SCALE,
    IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'movimientos_inventario'
AND COLUMN_NAME IN ('cantidad', 'stock_anterior', 'stock_nuevo')
ORDER BY ORDINAL_POSITION;

-- Mostrar conversiones creadas
SELECT 
    uo.codigo as origen_codigo,
    uo.nombre as origen_nombre,
    ud.codigo as destino_codigo,
    ud.nombre as destino_nombre,
    c.factor
FROM conversiones_unidad c
INNER JOIN unidades_medida uo ON c.unidad_origen_id = uo.id
INNER JOIN unidades_medida ud ON c.unidad_destino_id = ud.id
ORDER BY uo.codigo, ud.codigo;


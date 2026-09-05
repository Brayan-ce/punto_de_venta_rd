-- ============================================
-- MIGRACIÓN: Sistema de Unidades de Medida y Conversiones
-- Fecha: 2025-01-25
-- Versión: 1.0.0
-- Descripción: Implementa sistema completo de unidades de medida con conversiones
-- ============================================

USE punto_venta_rd;


-- ============================================
-- 1. MODIFICAR TABLA unidades_medida
-- ============================================

-- Agregar campo tipo_medida (FASE 7.1)
-- OPTIMIZADO: Verificar si las columnas existen antes de agregarlas
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'unidades_medida' 
    AND COLUMN_NAME = 'tipo_medida'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE unidades_medida ADD COLUMN tipo_medida ENUM(\'unidad\', \'peso\', \'volumen\', \'longitud\', \'area\', \'otro\') DEFAULT \'unidad\', ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Columna tipo_medida ya existe, omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar índice si no existe
SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'unidades_medida' 
    AND INDEX_NAME = 'idx_tipo_medida'
);

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE unidades_medida ADD INDEX idx_tipo_medida (tipo_medida), ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Índice idx_tipo_medida ya existe, omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar campos adicionales (verificando si existen)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'unidades_medida' 
    AND COLUMN_NAME = 'permite_decimales'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE unidades_medida ADD COLUMN permite_decimales BOOLEAN DEFAULT TRUE, ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Columna permite_decimales ya existe, omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'unidades_medida' 
    AND COLUMN_NAME = 'es_base'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE unidades_medida ADD COLUMN es_base BOOLEAN DEFAULT FALSE, ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Columna es_base ya existe, omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'unidades_medida' 
    AND COLUMN_NAME = 'empresa_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE unidades_medida ADD COLUMN empresa_id INT NULL, ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Columna empresa_id ya existe, omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'unidades_medida' 
    AND COLUMN_NAME = 'factor_base'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE unidades_medida ADD COLUMN factor_base DECIMAL(18,6) DEFAULT 1.000000, ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Columna factor_base ya existe, omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modificar factor_base si ya existe pero tiene el tipo incorrecto (DECIMAL(12,6) -> DECIMAL(18,6))
SET @col_type = (
    SELECT DATA_TYPE 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'unidades_medida' 
    AND COLUMN_NAME = 'factor_base'
);

SET @col_precision = (
    SELECT NUMERIC_PRECISION 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'unidades_medida' 
    AND COLUMN_NAME = 'factor_base'
);

SET @sql = IF(@col_exists > 0 AND @col_type = 'decimal' AND @col_precision < 18,
    'ALTER TABLE unidades_medida MODIFY COLUMN factor_base DECIMAL(18,6) DEFAULT 1.000000, ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Columna factor_base ya tiene el tipo correcto o no existe, omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar índices si no existen
SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'unidades_medida' 
    AND INDEX_NAME = 'idx_empresa'
);

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE unidades_medida ADD INDEX idx_empresa (empresa_id), ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Índice idx_empresa ya existe, omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'unidades_medida' 
    AND INDEX_NAME = 'idx_es_base'
);

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE unidades_medida ADD INDEX idx_es_base (es_base), ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Índice idx_es_base ya existe, omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Clasificar unidades existentes por tipo_medida
UPDATE unidades_medida 
SET tipo_medida = 'peso' 
WHERE codigo IN ('KG', 'LB', 'G', 'GR', 'GRAMO', 'LIBRA', 'KILO', 'OZ', 'ONZA');

UPDATE unidades_medida 
SET tipo_medida = 'volumen' 
WHERE codigo IN ('L', 'LT', 'LITRO', 'ML', 'GAL', 'GALON');

UPDATE unidades_medida 
SET tipo_medida = 'longitud' 
WHERE codigo IN ('M', 'MT', 'METRO', 'CM', 'KM', 'FT', 'PIE', 'IN', 'PULGADA');

UPDATE unidades_medida 
SET tipo_medida = 'unidad' 
WHERE codigo IN ('UN', 'UND', 'UNIDAD', 'PZ', 'PIEZA', 'CAJ', 'CAJA');

-- Actualizar permite_decimales según tipo
UPDATE unidades_medida 
SET permite_decimales = FALSE 
WHERE codigo IN ('UN', 'UND', 'UNIDAD', 'PZ', 'PIEZA', 'CAJ', 'CAJA');

UPDATE unidades_medida 
SET permite_decimales = TRUE 
WHERE codigo IN ('LB', 'KG', 'G', 'GR', 'GRAMO', 'LIBRA', 'KILO', 'L', 'LT', 'LITRO', 'ML');

-- Marcar unidad base (Kilo como ejemplo, ajustar según necesidad)
UPDATE unidades_medida 
SET es_base = TRUE 
WHERE codigo = 'KG' 
LIMIT 1;
-- ============================================
-- 2. CREAR TABLA conversiones_unidad
-- ============================================

CREATE TABLE IF NOT EXISTS conversiones_unidad (
    id INT NOT NULL AUTO_INCREMENT,
    empresa_id INT NULL COMMENT 'NULL = conversión global',
    unidad_origen_id INT NOT NULL,
    unidad_destino_id INT NOT NULL,
    factor DECIMAL(12,6) NOT NULL COMMENT 'Factor de conversión: destino = origen * factor',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_conversion (unidad_origen_id, unidad_destino_id, empresa_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_origen (unidad_origen_id),
    INDEX idx_destino (unidad_destino_id),
    INDEX idx_activo (activo),
    FOREIGN KEY (unidad_origen_id) REFERENCES unidades_medida(id) ON DELETE CASCADE,
    FOREIGN KEY (unidad_destino_id) REFERENCES unidades_medida(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. MODIFICAR TABLA productos
-- ============================================

-- Agregar campos nuevos (optimizado: sin especificar posición para evitar COPY)
-- Verificar si las columnas ya existen antes de agregarlas
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'productos' 
    AND COLUMN_NAME = 'precio_por_unidad'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE productos ADD COLUMN precio_por_unidad DECIMAL(12,2) NULL COMMENT \'Precio en unidad base\', ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Columna precio_por_unidad ya existe, omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'productos' 
    AND COLUMN_NAME = 'permite_decimales'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE productos ADD COLUMN permite_decimales BOOLEAN DEFAULT FALSE, ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Columna permite_decimales ya existe, omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'productos' 
    AND COLUMN_NAME = 'unidad_venta_default_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE productos ADD COLUMN unidad_venta_default_id INT NULL COMMENT \'Unidad por defecto en ventas\', ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Columna unidad_venta_default_id ya existe, omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar índice (si no existe)
SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'productos' 
    AND INDEX_NAME = 'idx_unidad_venta_default'
);

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE productos ADD INDEX idx_unidad_venta_default (unidad_venta_default_id), ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Índice idx_unidad_venta_default ya existe, omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar Foreign Key (si no existe)
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'productos' 
    AND CONSTRAINT_NAME = 'productos_ibfk_unidad_venta'
);

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE productos ADD CONSTRAINT productos_ibfk_unidad_venta FOREIGN KEY (unidad_venta_default_id) REFERENCES unidades_medida(id) ON DELETE SET NULL',
    'SELECT "Foreign Key ya existe, omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrar precio_venta a precio_por_unidad
-- NOTA: Este UPDATE actualiza solo productos sin precio_por_unidad definido
UPDATE productos 
SET precio_por_unidad = precio_venta 
WHERE precio_por_unidad IS NULL 
  AND precio_venta IS NOT NULL;

-- Configurar permite_decimales según unidad de medida
-- NOTA: Este UPDATE actualiza solo productos que necesitan configuración
UPDATE productos p
INNER JOIN unidades_medida um ON p.unidad_medida_id = um.id
SET p.permite_decimales = um.permite_decimales
WHERE (p.permite_decimales IS NULL OR p.permite_decimales = FALSE)
  AND um.permite_decimales IS NOT NULL;

-- Configurar unidad_venta_default igual a unidad_medida
-- NOTA: Este UPDATE actualiza solo productos sin unidad_venta_default definida
UPDATE productos 
SET unidad_venta_default_id = unidad_medida_id 
WHERE unidad_venta_default_id IS NULL 
  AND unidad_medida_id IS NOT NULL;

-- Cambiar tipo de stock a DECIMAL(13,3) (solución profesional)
-- IMPORTANTE: Usamos DECIMAL(13,3) en lugar de DECIMAL(10,3) porque:
-- - DECIMAL(10,3) máximo es 9,999,999.999
-- - Hay productos con stock >= 10,000,000
-- - DECIMAL(13,3) permite hasta 9,999,999,999.999 (suficiente para cualquier inventario)
-- - Evita pérdida de datos y migraciones futuras
-- Paso 1: Identificar y reportar valores problemáticos (para diagnóstico)
-- NOTA: Con DECIMAL(13,3) solo reportamos valores NULL o negativos extremos
SELECT id, nombre, stock, stock_minimo, stock_maximo
FROM productos
WHERE stock IS NULL
   OR stock < -9999999999
   OR stock_minimo IS NULL
   OR stock_minimo < -9999999999
   OR stock_maximo IS NULL
   OR stock_maximo < -9999999999;

-- Paso 2: Limpiar valores problemáticos antes de cambiar el tipo
-- NOTA: Con DECIMAL(13,3) no necesitamos limpiar valores grandes, pero mantenemos la limpieza
-- para valores NULL y negativos extremos
-- DECIMAL(13,3) permite hasta 9,999,999,999.999 (suficiente para cualquier inventario)
UPDATE productos
SET stock = CASE 
    WHEN stock IS NULL THEN 0.000
    WHEN stock < -9999999999 THEN 0.000  -- Valores negativos extremos
    ELSE stock  -- Mantener el valor (DECIMAL(13,3) puede manejar valores grandes)
END
WHERE stock IS NULL 
   OR stock < -9999999999;

-- Asegurar que stock_minimo esté en rango válido
-- NOTA: Con DECIMAL(13,3) no necesitamos limpiar valores grandes
UPDATE productos
SET stock_minimo = CASE 
    WHEN stock_minimo IS NULL THEN 5.000
    WHEN stock_minimo < -9999999999 THEN 0.000  -- Valores negativos extremos
    ELSE stock_minimo  -- Mantener el valor (DECIMAL(13,3) puede manejar valores grandes)
END
WHERE stock_minimo IS NULL 
   OR stock_minimo < -9999999999;

-- Asegurar que stock_maximo esté en rango válido
-- NOTA: Con DECIMAL(13,3) no necesitamos limpiar valores grandes
UPDATE productos
SET stock_maximo = CASE 
    WHEN stock_maximo IS NULL THEN 100.000
    WHEN stock_maximo < -9999999999 THEN 0.000  -- Valores negativos extremos
    ELSE stock_maximo  -- Mantener el valor (DECIMAL(13,3) puede manejar valores grandes)
END
WHERE stock_maximo IS NULL 
   OR stock_maximo < -9999999999;

-- Paso 3: Verificar que no queden valores problemáticos antes de cambiar el tipo
-- NOTA: Con DECIMAL(13,3) solo verificamos valores NULL y negativos extremos
SET @valores_problematicos = (
    SELECT COUNT(*) 
    FROM productos 
    WHERE stock IS NULL 
       OR stock < -9999999999  -- Solo valores negativos extremos
);

-- Si aún hay valores problemáticos, limpiarlos nuevamente
SET @sql = IF(@valores_problematicos > 0,
    'UPDATE productos SET stock = CASE WHEN stock IS NULL THEN 0.000 WHEN stock < -9999999999 THEN 0.000 ELSE stock END WHERE stock IS NULL OR stock < -9999999999',
    'SELECT "No hay valores problemáticos en stock" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Paso 4: Cambiar tipo de columnas a DECIMAL de forma segura
-- IMPORTANTE: Usar DECIMAL(13,3) en lugar de DECIMAL(10,3) para permitir valores grandes
-- DECIMAL(10,3) máximo es 9,999,999.999, pero hay productos con stock >= 10,000,000
-- DECIMAL(13,3) permite hasta 9,999,999,999.999 (suficiente para cualquier inventario)
-- Verificar el tipo actual antes de modificar
SET @col_type = (
    SELECT DATA_TYPE 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'productos' 
    AND COLUMN_NAME = 'stock'
);

-- Solo modificar si no es ya DECIMAL(13,3)
-- NOTA: Cambiar tipo de columna requiere ALGORITHM=COPY (no puede ser INPLACE)
-- Esto puede tomar más tiempo pero es necesario para cambiar INT a DECIMAL
SET @sql = IF(@col_type != 'decimal' OR 
    (SELECT NUMERIC_PRECISION FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'productos' 
     AND COLUMN_NAME = 'stock') != 13,
    'ALTER TABLE productos MODIFY COLUMN stock DECIMAL(13,3) NOT NULL DEFAULT 0.000',
    'SELECT "Columna stock ya es DECIMAL(13,3), omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y limpiar stock_minimo antes de cambiar el tipo
-- NOTA: Con DECIMAL(13,3) solo verificamos valores NULL y negativos extremos
SET @valores_problematicos = (
    SELECT COUNT(*) 
    FROM productos 
    WHERE stock_minimo IS NULL 
       OR stock_minimo < -9999999999  -- Solo valores negativos extremos
);

SET @sql = IF(@valores_problematicos > 0,
    'UPDATE productos SET stock_minimo = CASE WHEN stock_minimo IS NULL THEN 5.000 WHEN stock_minimo < -9999999999 THEN 0.000 ELSE stock_minimo END WHERE stock_minimo IS NULL OR stock_minimo < -9999999999',
    'SELECT "No hay valores problemáticos en stock_minimo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Cambiar stock_minimo
-- IMPORTANTE: Usar DECIMAL(13,3) para permitir valores grandes
-- NOTA: Cambiar tipo de columna requiere ALGORITHM=COPY (no puede ser INPLACE)
SET @col_type = (
    SELECT DATA_TYPE 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'productos' 
    AND COLUMN_NAME = 'stock_minimo'
);

SET @sql = IF(@col_type != 'decimal' OR 
    (SELECT NUMERIC_PRECISION FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'productos' 
     AND COLUMN_NAME = 'stock_minimo') != 13,
    'ALTER TABLE productos MODIFY COLUMN stock_minimo DECIMAL(13,3) DEFAULT 5.000',
    'SELECT "Columna stock_minimo ya es DECIMAL(13,3), omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y limpiar stock_maximo antes de cambiar el tipo
-- NOTA: Con DECIMAL(13,3) solo verificamos valores NULL y negativos extremos
SET @valores_problematicos = (
    SELECT COUNT(*) 
    FROM productos 
    WHERE stock_maximo IS NULL 
       OR stock_maximo < -9999999999  -- Solo valores negativos extremos
);

SET @sql = IF(@valores_problematicos > 0,
    'UPDATE productos SET stock_maximo = CASE WHEN stock_maximo IS NULL THEN 100.000 WHEN stock_maximo < -9999999999 THEN 0.000 ELSE stock_maximo END WHERE stock_maximo IS NULL OR stock_maximo < -9999999999',
    'SELECT "No hay valores problemáticos en stock_maximo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Cambiar stock_maximo
-- IMPORTANTE: Usar DECIMAL(13,3) para permitir valores grandes
-- NOTA: Cambiar tipo de columna requiere ALGORITHM=COPY (no puede ser INPLACE)
SET @col_type = (
    SELECT DATA_TYPE 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'productos' 
    AND COLUMN_NAME = 'stock_maximo'
);

SET @sql = IF(@col_type != 'decimal' OR 
    (SELECT NUMERIC_PRECISION FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'productos' 
     AND COLUMN_NAME = 'stock_maximo') != 13,
    'ALTER TABLE productos MODIFY COLUMN stock_maximo DECIMAL(13,3) DEFAULT 100.000',
    'SELECT "Columna stock_maximo ya es DECIMAL(13,3), omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 4. MODIFICAR TABLA detalle_ventas
-- ============================================

-- Modificar columnas existentes
-- NOTA: Cambiar tipo de columna requiere ALGORITHM=COPY (no puede ser INPLACE)
-- Esto puede tomar más tiempo pero es necesario para cambiar INT a DECIMAL
ALTER TABLE detalle_ventas
MODIFY COLUMN cantidad DECIMAL(10,3) NOT NULL,
MODIFY COLUMN cantidad_despachada DECIMAL(10,3) DEFAULT 0.000,
MODIFY COLUMN cantidad_pendiente DECIMAL(10,3) DEFAULT 0.000;

-- Agregar columna unidad_medida_id si no existe
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'detalle_ventas' 
    AND COLUMN_NAME = 'unidad_medida_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE detalle_ventas ADD COLUMN unidad_medida_id INT NULL COMMENT \'Unidad usada en la venta\', ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Columna unidad_medida_id ya existe, omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columna cantidad_base si no existe
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'detalle_ventas' 
    AND COLUMN_NAME = 'cantidad_base'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE detalle_ventas ADD COLUMN cantidad_base DECIMAL(13,3) NULL COMMENT \'Cantidad convertida a unidad base\', ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Columna cantidad_base ya existe, omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar índice si no existe
SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'detalle_ventas' 
    AND INDEX_NAME = 'idx_unidad_medida'
);

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE detalle_ventas ADD INDEX idx_unidad_medida (unidad_medida_id), ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "Índice idx_unidad_medida ya existe, omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar Foreign Key si no existe
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'detalle_ventas' 
    AND CONSTRAINT_NAME = 'detalle_ventas_ibfk_unidad_medida'
);

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE detalle_ventas ADD CONSTRAINT detalle_ventas_ibfk_unidad_medida FOREIGN KEY (unidad_medida_id) REFERENCES unidades_medida(id) ON DELETE SET NULL',
    'SELECT "Foreign Key ya existe, omitiendo" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrar datos existentes: asignar unidad del producto
-- NOTA: Este UPDATE actualiza solo registros de detalle_ventas sin unidad_medida_id
UPDATE detalle_ventas dv
INNER JOIN productos p ON dv.producto_id = p.id
SET dv.unidad_medida_id = p.unidad_medida_id,
    dv.cantidad_base = CAST(dv.cantidad AS DECIMAL(13,3))
WHERE dv.unidad_medida_id IS NULL 
  AND p.unidad_medida_id IS NOT NULL;

-- ============================================
-- 5. MODIFICAR TABLA movimientos_inventario
-- ============================================

-- Limpiar valores problemáticos antes de cambiar el tipo
-- IMPORTANTE: Usar DECIMAL(13,3) para consistencia con productos y permitir valores grandes
-- Limpiar valores NULL y negativos extremos (DECIMAL(13,3) puede manejar valores >= 10M)
UPDATE movimientos_inventario
SET cantidad = CASE 
    WHEN cantidad IS NULL THEN 0.000
    WHEN cantidad < -9999999999 THEN 0.000  -- Valores negativos extremos
    ELSE cantidad  -- Mantener el valor (DECIMAL(13,3) puede manejar valores grandes)
END
WHERE cantidad IS NULL 
   OR cantidad < -9999999999;

UPDATE movimientos_inventario
SET stock_anterior = CASE 
    WHEN stock_anterior IS NULL THEN 0.000
    WHEN stock_anterior < -9999999999 THEN 0.000  -- Valores negativos extremos
    ELSE stock_anterior  -- Mantener el valor (DECIMAL(13,3) puede manejar valores grandes)
END
WHERE stock_anterior IS NULL 
   OR stock_anterior < -9999999999;

UPDATE movimientos_inventario
SET stock_nuevo = CASE 
    WHEN stock_nuevo IS NULL THEN 0.000
    WHEN stock_nuevo < -9999999999 THEN 0.000  -- Valores negativos extremos
    ELSE stock_nuevo  -- Mantener el valor (DECIMAL(13,3) puede manejar valores grandes)
END
WHERE stock_nuevo IS NULL 
   OR stock_nuevo < -9999999999;

-- NOTA: Cambiar tipo de columna requiere ALGORITHM=COPY (no puede ser INPLACE)
-- IMPORTANTE: Usar DECIMAL(13,3) para consistencia con productos y permitir valores grandes
-- Esto puede tomar más tiempo pero es necesario para cambiar INT a DECIMAL
ALTER TABLE movimientos_inventario
MODIFY COLUMN cantidad DECIMAL(13,3) NOT NULL,
MODIFY COLUMN stock_anterior DECIMAL(13,3) NOT NULL,
MODIFY COLUMN stock_nuevo DECIMAL(13,3) NOT NULL;

-- ============================================
-- 6. MODIFICAR TABLA detalle_despachos (si existe)
-- ============================================

-- Verificar si la tabla existe antes de modificar
SET @table_exists = (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
    AND table_name = 'detalle_despachos'
);

-- NOTA: MODIFY COLUMN requiere ALGORITHM=COPY si cambia el tipo de datos
SET @sql = IF(@table_exists > 0,
    'ALTER TABLE detalle_despachos MODIFY COLUMN cantidad_despachada DECIMAL(10,3) DEFAULT 0.000',
    'SELECT "Tabla detalle_despachos no existe, omitiendo" as mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 7. INSERTAR CONVERSIONES BÁSICAS
-- ============================================

-- Obtener IDs de unidades disponibles (más flexible)
-- NOTA: Solo crea conversiones si las unidades existen en la base de datos
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

COMMIT;

-- ============================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================

-- Verificar estructura de tablas
DESCRIBE unidades_medida;
DESCRIBE conversiones_unidad;
DESCRIBE productos;
DESCRIBE detalle_ventas;
DESCRIBE movimientos_inventario;

-- Verificar conversiones creadas
SELECT
    uo.nombre as origen,
    ud.nombre as destino,
    c.factor
FROM conversiones_unidad c
INNER JOIN unidades_medida uo ON c.unidad_origen_id = uo.id
INNER JOIN unidades_medida ud ON c.unidad_destino_id = ud.id;

-- Verificar productos con decimales
SELECT
    p.nombre,
    um.nombre as unidad,
    p.permite_decimales,
    p.precio_por_unidad
FROM productos p
INNER JOIN unidades_medida um ON p.unidad_medida_id = um.id
WHERE p.permite_decimales = TRUE
LIMIT 10;



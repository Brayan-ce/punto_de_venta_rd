-- ============================================
-- MIGRACIÓN DE DATOS: Sistema de Unidades de Medida
-- Fecha: 2025-01-25
-- Versión: 1.0.0
-- Descripción: Migra datos existentes al nuevo sistema de unidades
-- IMPORTANTE: Ejecutar DESPUÉS de migracion_unidades_medida.sql
-- ============================================

USE punto_venta_rd;

START TRANSACTION;

-- ============================================
-- 1. MIGRAR PRODUCTOS EXISTENTES
-- ============================================

-- Asegurar que precio_por_unidad tenga valor
UPDATE productos p
SET p.precio_por_unidad = p.precio_venta
WHERE p.precio_por_unidad IS NULL;

-- Configurar permite_decimales según unidad de medida
UPDATE productos p
INNER JOIN unidades_medida um ON p.unidad_medida_id = um.id
SET p.permite_decimales = um.permite_decimales
WHERE p.permite_decimales IS NULL;

-- Configurar unidad_venta_default igual a unidad_medida
UPDATE productos 
SET unidad_venta_default_id = unidad_medida_id 
WHERE unidad_venta_default_id IS NULL;

-- Convertir stock entero a decimal
-- IMPORTANTE: Las columnas ya fueron cambiadas a DECIMAL(13,3) en la migración principal
-- DECIMAL(13,3) permite hasta 9,999,999,999.999 (suficiente para cualquier inventario)
-- Solo limpiamos valores NULL y negativos extremos
UPDATE productos
SET stock = CASE 
    WHEN stock IS NULL THEN 0.000
    WHEN stock < -9999999999 THEN 0.000  -- Valores negativos extremos
    ELSE CAST(stock AS DECIMAL(13,3))  -- DECIMAL(13,3) puede manejar valores grandes
END,
stock_minimo = CASE 
    WHEN stock_minimo IS NULL THEN 5.000
    WHEN stock_minimo < -9999999999 THEN 0.000  -- Valores negativos extremos
    ELSE CAST(stock_minimo AS DECIMAL(13,3))
END,
stock_maximo = CASE 
    WHEN stock_maximo IS NULL THEN 100.000
    WHEN stock_maximo < -9999999999 THEN 0.000  -- Valores negativos extremos
    ELSE CAST(stock_maximo AS DECIMAL(13,3))
END;

-- ============================================
-- 2. MIGRAR detalle_ventas EXISTENTES
-- ============================================

-- Asignar unidad_medida_id del producto
UPDATE detalle_ventas dv
INNER JOIN productos p ON dv.producto_id = p.id
SET dv.unidad_medida_id = p.unidad_medida_id
WHERE dv.unidad_medida_id IS NULL;

-- Calcular cantidad_base (igual a cantidad si no hay conversión)
-- IMPORTANTE: cantidad_base usa DECIMAL(13,3) para consistencia con stock
UPDATE detalle_ventas dv
SET dv.cantidad_base = CAST(dv.cantidad AS DECIMAL(13,3))
WHERE dv.cantidad_base IS NULL;

-- Convertir cantidades a DECIMAL
UPDATE detalle_ventas
SET cantidad = CAST(cantidad AS DECIMAL(10,3)),
    cantidad_despachada = CAST(cantidad_despachada AS DECIMAL(10,3)),
    cantidad_pendiente = CAST(cantidad_pendiente AS DECIMAL(10,3))
WHERE cantidad IS NOT NULL;

-- ============================================
-- 3. MIGRAR movimientos_inventario EXISTENTES
-- ============================================

-- Convertir cantidades a DECIMAL
-- IMPORTANTE: Las columnas ya fueron cambiadas a DECIMAL(13,3) en la migración principal
-- DECIMAL(13,3) permite hasta 9,999,999,999.999 (suficiente para cualquier inventario)
-- Solo limpiamos valores NULL y negativos extremos
UPDATE movimientos_inventario
SET cantidad = CASE 
    WHEN cantidad IS NULL THEN 0.000
    WHEN cantidad < -9999999999 THEN 0.000  -- Valores negativos extremos
    ELSE CAST(cantidad AS DECIMAL(13,3))  -- DECIMAL(13,3) puede manejar valores grandes
END,
stock_anterior = CASE 
    WHEN stock_anterior IS NULL THEN 0.000
    WHEN stock_anterior < -9999999999 THEN 0.000  -- Valores negativos extremos
    ELSE CAST(stock_anterior AS DECIMAL(13,3))
END,
stock_nuevo = CASE 
    WHEN stock_nuevo IS NULL THEN 0.000
    WHEN stock_nuevo < -9999999999 THEN 0.000  -- Valores negativos extremos
    ELSE CAST(stock_nuevo AS DECIMAL(13,3))
END
WHERE cantidad IS NOT NULL 
   OR stock_anterior IS NOT NULL 
   OR stock_nuevo IS NOT NULL;

-- ============================================
-- 4. MIGRAR detalle_despachos (si existe)
-- ============================================

SET @table_exists = (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
    AND table_name = 'detalle_despachos'
);

SET @sql = IF(@table_exists > 0,
    'UPDATE detalle_despachos SET cantidad_despachada = CASE WHEN cantidad_despachada IS NULL THEN 0.000 WHEN cantidad_despachada < -9999999 THEN 0.000 ELSE CAST(cantidad_despachada AS DECIMAL(10,3)) END WHERE cantidad_despachada IS NOT NULL',
    'SELECT "Tabla detalle_despachos no existe, omitiendo" as mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;

-- ============================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================

-- Verificar productos
-- SELECT 
--     COUNT(*) as total,
--     COUNT(CASE WHEN permite_decimales = TRUE THEN 1 END) as con_decimales,
--     COUNT(CASE WHEN precio_por_unidad IS NULL THEN 1 END) as sin_precio_base
-- FROM productos;

-- Verificar conversiones
-- SELECT COUNT(*) as total_conversiones FROM conversiones_unidad;

-- Verificar detalle_ventas
-- SELECT 
--     COUNT(*) as total,
--     COUNT(CASE WHEN unidad_medida_id IS NULL THEN 1 END) as sin_unidad
-- FROM detalle_ventas;


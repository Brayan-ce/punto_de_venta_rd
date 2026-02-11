-- ============================================
-- LIMPIEZA ESPECÍFICA: Valores problemáticos en stock
-- Ejecutar ANTES de la migración para corregir valores específicos
-- ============================================

USE punto_venta_rd;

START TRANSACTION;

-- ============================================
-- CORREGIR VALORES ESPECÍFICOS IDENTIFICADOS
-- ============================================

-- Productos con stock extremadamente alto (probablemente errores de entrada)
-- Estos valores no tienen sentido para productos físicos como pizzas

-- ID 13: stock = 201000001 (muy alto, probable error)
UPDATE productos 
SET stock = 0.000,
    stock_minimo = 5.000,
    stock_maximo = 100.000
WHERE id = 13;

-- ID 223: stock = 1000000001 (muy alto, probable error)
UPDATE productos 
SET stock = 0.000,
    stock_minimo = 5.000,
    stock_maximo = 100.000
WHERE id = 223;

-- Productos con stock > 100,000,000 (claramente errores)
UPDATE productos 
SET stock = 0.000
WHERE stock > 100000000;

-- Productos con stock_minimo > 1,000,000 (no tiene sentido)
UPDATE productos 
SET stock_minimo = 5.000
WHERE stock_minimo > 1000000;

-- Productos con stock_maximo > 100,000,000 (ajustar a máximo permitido)
UPDATE productos 
SET stock_maximo = 9999999.999
WHERE stock_maximo > 100000000;

-- ============================================
-- LIMPIEZA GENERAL DE VALORES FUERA DE RANGO
-- ============================================

-- Asegurar que stock esté en rango válido
UPDATE productos
SET stock = CASE 
    WHEN stock IS NULL THEN 0.000
    WHEN stock < -9999999.999 THEN 0.000
    WHEN stock > 9999999.999 THEN 
        CASE 
            WHEN stock > 100000000 THEN 0.000  -- Valores > 100M claramente son errores
            ELSE 9999999.999  -- Valores entre 10M y 100M se ajustan al máximo permitido
        END
    ELSE CAST(stock AS DECIMAL(10,3))
END;

-- Asegurar que stock_minimo esté en rango válido
UPDATE productos
SET stock_minimo = CASE 
    WHEN stock_minimo IS NULL THEN 5.000
    WHEN stock_minimo < -9999999.999 THEN 0.000
    WHEN stock_minimo > 9999999.999 THEN 
        CASE 
            WHEN stock_minimo > 1000000 THEN 5.000  -- Valores > 1M son claramente errores
            ELSE 9999999.999  -- Valores entre 10M y 1M se ajustan al máximo
        END
    ELSE CAST(stock_minimo AS DECIMAL(10,3))
END;

-- Asegurar que stock_maximo esté en rango válido
UPDATE productos
SET stock_maximo = CASE 
    WHEN stock_maximo IS NULL THEN 100.000
    WHEN stock_maximo < -9999999.999 THEN 0.000
    WHEN stock_maximo > 9999999.999 THEN 
        CASE 
            WHEN stock_maximo > 100000000 THEN 9999999.999  -- Valores > 100M se ajustan al máximo permitido
            ELSE 9999999.999  -- Valores entre 10M y 100M se ajustan al máximo
        END
    ELSE CAST(stock_maximo AS DECIMAL(10,3))
END;

-- ============================================
-- VERIFICACIÓN POST-LIMPIEZA
-- ============================================

-- Verificar que no queden valores problemáticos
SELECT 
    COUNT(*) as total_productos,
    COUNT(CASE WHEN stock IS NULL OR stock < -9999999.999 OR stock > 9999999.999 THEN 1 END) as stock_problematico,
    COUNT(CASE WHEN stock_minimo IS NULL OR stock_minimo < -9999999.999 OR stock_minimo > 9999999.999 THEN 1 END) as stock_min_problematico,
    COUNT(CASE WHEN stock_maximo IS NULL OR stock_maximo < -9999999.999 OR stock_maximo > 9999999.999 THEN 1 END) as stock_max_problematico
FROM productos;

-- Mostrar productos que aún tienen valores altos (para revisión manual si es necesario)
SELECT 
    id,
    nombre,
    stock,
    stock_minimo,
    stock_maximo
FROM productos
WHERE stock > 1000000
   OR stock_minimo > 100000
   OR stock_maximo > 10000000
ORDER BY stock DESC, id;

COMMIT;

-- ============================================
-- NOTAS:
-- ============================================
-- 1. Este script corrige valores específicos identificados como problemáticos
-- 2. Valores > 100M en stock se ajustan a 0 (probablemente errores de entrada)
-- 3. Valores > 1M en stock_minimo se ajustan a 5 (valor por defecto razonable)
-- 4. Valores > 100M en stock_maximo se ajustan al máximo permitido (9,999,999.999)
-- 5. Después de ejecutar este script, ejecutar migracion_unidades_medida.sql


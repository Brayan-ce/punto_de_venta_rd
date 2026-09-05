-- ============================================
-- MIGRACIÓN: ÍNDICES PARA OPTIMIZAR PRODUCTOS
-- ============================================
-- 
-- Índices críticos para paginación y búsqueda rápida
-- 
-- Fecha: 2026-01-21
-- Nota: MySQL no soporta IF NOT EXISTS en CREATE INDEX
-- Se usa procedimiento almacenado para crear índices solo si no existen

-- Procedimiento para crear índice si no existe
DELIMITER $$

DROP PROCEDURE IF EXISTS crear_indice_si_no_existe$$
CREATE PROCEDURE crear_indice_si_no_existe(
    IN nombre_indice VARCHAR(255),
    IN nombre_tabla VARCHAR(255),
    IN columnas_indice TEXT
)
BEGIN
    DECLARE indice_existe INT DEFAULT 0;
    
    SELECT COUNT(*) INTO indice_existe
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = nombre_tabla
      AND INDEX_NAME = nombre_indice;
    
    IF indice_existe = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', nombre_indice, ' ON ', nombre_tabla, ' (', columnas_indice, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- Crear índices usando el procedimiento
CALL crear_indice_si_no_existe('idx_productos_empresa_nombre', 'productos', 'empresa_id, nombre');
CALL crear_indice_si_no_existe('idx_productos_empresa_codigo', 'productos', 'empresa_id, codigo_barras');
CALL crear_indice_si_no_existe('idx_productos_empresa_sku', 'productos', 'empresa_id, sku');
CALL crear_indice_si_no_existe('idx_productos_empresa_categoria', 'productos', 'empresa_id, categoria_id');
CALL crear_indice_si_no_existe('idx_productos_empresa_marca', 'productos', 'empresa_id, marca_id');
CALL crear_indice_si_no_existe('idx_productos_empresa_activo', 'productos', 'empresa_id, activo');
CALL crear_indice_si_no_existe('idx_productos_empresa_stock', 'productos', 'empresa_id, stock, stock_minimo');

-- Eliminar el procedimiento después de usarlo
DROP PROCEDURE IF EXISTS crear_indice_si_no_existe;

-- Nota: Estos índices mejoran significativamente:
-- - Búsquedas por texto (nombre, código, SKU)
-- - Paginación con ORDER BY
-- - Filtros por categoría, marca, estado
-- - Consultas de bajo stock


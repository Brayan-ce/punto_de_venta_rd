-- ============================================
-- TRIGGER: Sincronizar precio_venta = precio_por_unidad
-- Fecha: 2025-01-25
-- Versión: 1.0.0
-- Descripción: Mantiene precio_venta sincronizado con precio_por_unidad (compatibilidad)
-- ============================================

USE punto_venta_rd;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trg_sincronizar_precio_venta;

DELIMITER $$

-- Trigger para sincronizar precio_venta cuando se actualiza precio_por_unidad
CREATE TRIGGER trg_sincronizar_precio_venta
BEFORE UPDATE ON productos
FOR EACH ROW
BEGIN
    -- Si precio_por_unidad cambió y no es NULL, sincronizar precio_venta
    IF NEW.precio_por_unidad IS NOT NULL AND 
       (OLD.precio_por_unidad IS NULL OR NEW.precio_por_unidad != OLD.precio_por_unidad) THEN
        SET NEW.precio_venta = NEW.precio_por_unidad;
    END IF;
    
    -- Si precio_por_unidad es NULL pero precio_venta tiene valor, usar precio_venta
    IF NEW.precio_por_unidad IS NULL AND NEW.precio_venta IS NOT NULL THEN
        SET NEW.precio_por_unidad = NEW.precio_venta;
    END IF;
END$$

-- Trigger para INSERT: asegurar que precio_venta = precio_por_unidad
CREATE TRIGGER trg_sincronizar_precio_venta_insert
BEFORE INSERT ON productos
FOR EACH ROW
BEGIN
    -- Si precio_por_unidad está definido, usar ese valor para precio_venta
    IF NEW.precio_por_unidad IS NOT NULL THEN
        SET NEW.precio_venta = NEW.precio_por_unidad;
    -- Si precio_por_unidad es NULL pero precio_venta tiene valor, usar precio_venta
    ELSEIF NEW.precio_venta IS NOT NULL THEN
        SET NEW.precio_por_unidad = NEW.precio_venta;
    END IF;
END$$

DELIMITER ;


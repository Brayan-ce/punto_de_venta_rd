-- ============================================
-- MIGRACIÓN: Hacer venta_id opcional en contratos_financiamiento
-- Esto permite crear contratos de financiamiento directos
-- (sin pasar por el módulo de ventas)
-- ============================================

-- Modificar la columna venta_id para permitir NULL
ALTER TABLE contratos_financiamiento 
MODIFY COLUMN venta_id INT NULL COMMENT 'Venta asociada (NULL para contratos directos)';

-- Modificar ncf para permitir NULL también (se genera después o no aplica en contratos directos)
ALTER TABLE contratos_financiamiento 
MODIFY COLUMN ncf VARCHAR(19) NULL COMMENT 'NCF (opcional para contratos directos)';

-- Verificar el cambio
DESCRIBE contratos_financiamiento;


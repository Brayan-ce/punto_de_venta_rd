-- Migración: Aumentar límite de contratos activos por cliente a 20
-- Fecha: 2025-01-27
-- Descripción: Actualiza el valor por defecto y los registros existentes de max_contratos_activos de 3 a 20

-- ============================================
-- 1. Actualizar valor por defecto de la columna
-- ============================================
ALTER TABLE credito_clientes 
MODIFY COLUMN max_contratos_activos INT(11) DEFAULT 20 COMMENT 'Máximo de contratos simultáneos permitidos';

-- ============================================
-- 2. Actualizar registros existentes que tengan 3 o menos a 20
-- ============================================
UPDATE credito_clientes 
SET max_contratos_activos = 20 
WHERE max_contratos_activos <= 3 OR max_contratos_activos IS NULL;

-- ============================================
-- 3. Verificar cambios
-- ============================================
-- SELECT 
--     COUNT(*) as total_registros,
--     COUNT(CASE WHEN max_contratos_activos = 20 THEN 1 END) as con_limite_20,
--     COUNT(CASE WHEN max_contratos_activos < 20 THEN 1 END) as con_limite_menor,
--     MIN(max_contratos_activos) as minimo,
--     MAX(max_contratos_activos) as maximo
-- FROM credito_clientes;


-- =====================================================
-- ROLLBACK: Sistema de Financiamiento
-- =====================================================
-- Fecha: 2025-01-25
-- Versión: 1.0
-- Descripción: Revierte todos los cambios de la migración
--              de financiamiento (USAR CON PRECAUCIÓN)
-- =====================================================
-- ⚠️ ADVERTENCIA: Este script eliminará TODAS las tablas
--    y datos de financiamiento. Solo usar si es necesario.
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- =====================================================
-- 1. ELIMINAR TABLAS DE FINANCIAMIENTO
-- =====================================================

DROP TABLE IF EXISTS historial_notificaciones;
DROP TABLE IF EXISTS plantillas_notificaciones;
DROP TABLE IF EXISTS alertas_financiamiento;
DROP TABLE IF EXISTS activos_productos;
DROP TABLE IF EXISTS pagos_financiamiento;
DROP TABLE IF EXISTS cuotas_financiamiento;
DROP TABLE IF EXISTS contratos_financiamiento;
DROP TABLE IF EXISTS planes_financiamiento;

-- =====================================================
-- 2. REVERTIR MODIFICACIONES A TABLAS EXISTENTES
-- =====================================================

-- 2.1 Revertir tabla ventas
ALTER TABLE ventas 
    DROP FOREIGN KEY IF EXISTS fk_venta_contrato_financiamiento,
    DROP INDEX IF EXISTS idx_financiamiento,
    DROP COLUMN IF EXISTS tiene_financiamiento,
    DROP COLUMN IF EXISTS contrato_financiamiento_id;

-- 2.2 Revertir tabla credito_clientes
ALTER TABLE credito_clientes
    DROP INDEX IF EXISTS idx_contratos_activos,
    DROP COLUMN IF EXISTS monto_financiado_total,
    DROP COLUMN IF EXISTS contratos_activos,
    DROP COLUMN IF EXISTS max_contratos_activos;

-- 2.3 Revertir tabla clientes
ALTER TABLE clientes
    DROP INDEX IF EXISTS idx_score_crediticio,
    DROP INDEX IF EXISTS idx_clasificacion,
    DROP COLUMN IF EXISTS ocupacion,
    DROP COLUMN IF EXISTS ingreso_mensual,
    DROP COLUMN IF EXISTS nombre_empleador,
    DROP COLUMN IF EXISTS telefono_empleador,
    DROP COLUMN IF EXISTS anos_empleo,
    DROP COLUMN IF EXISTS numero_whatsapp,
    DROP COLUMN IF EXISTS metodo_contacto_preferido,
    DROP COLUMN IF EXISTS score_crediticio,
    DROP COLUMN IF EXISTS clasificacion_credito;

-- 2.4 Revertir tabla productos
ALTER TABLE productos
    DROP INDEX IF EXISTS idx_es_rastreable,
    DROP INDEX IF EXISTS idx_tipo_activo,
    DROP INDEX IF EXISTS idx_permite_financiamiento,
    DROP COLUMN IF EXISTS es_rastreable,
    DROP COLUMN IF EXISTS tipo_activo,
    DROP COLUMN IF EXISTS requiere_serie,
    DROP COLUMN IF EXISTS permite_financiamiento,
    DROP COLUMN IF EXISTS meses_max_financiamiento,
    DROP COLUMN IF EXISTS meses_garantia,
    DROP COLUMN IF EXISTS tasa_depreciacion;

-- =====================================================
-- FIN DEL ROLLBACK
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

SELECT 'Rollback de Financiamiento completado' AS mensaje;


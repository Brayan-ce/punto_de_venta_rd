-- Migration: Agregar campo permite_impresion a tabla empresas
-- Fecha: 2026-07-12
-- Descripcion: Control de impresion/firma e-NCF por empresa, en cascada a todos sus usuarios

ALTER TABLE empresas
ADD COLUMN permite_impresion TINYINT(1) NOT NULL DEFAULT 1
AFTER activo;

-- Verificar la estructura actualizada
DESCRIBE empresas;

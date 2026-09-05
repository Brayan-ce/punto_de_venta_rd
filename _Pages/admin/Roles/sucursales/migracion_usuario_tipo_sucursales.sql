-- ============================================
-- MIGRACION: habilitar tipo de usuario sucursales
-- Fecha: 2026-04-17
-- ============================================

USE punto_venta_rd;

-- Nota:
-- Se conserva el tipo 'financiamiento' por compatibilidad con instalaciones
-- donde ya exista en la columna usuarios.tipo.
ALTER TABLE usuarios
MODIFY COLUMN tipo ENUM('superadmin','admin','vendedor','financiamiento','sucursales') NOT NULL;

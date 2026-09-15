-- Migration: Agregar campo offline_habilitado a tabla usuarios
-- Permite que un admin específico use el sistema sin conexión
ALTER TABLE usuarios ADD COLUMN offline_habilitado TINYINT(1) NOT NULL DEFAULT 0;

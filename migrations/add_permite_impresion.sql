-- Migration: Agregar campo permite_impresion a tabla usuarios
-- Fecha: 2025-01-27
-- Descripcion: Permite habilitar/deshabilitar el boton de impresion por usuario

-- Agregar columna permite_impresion (default TRUE para no afectar usuarios existentes)
ALTER TABLE usuarios 
ADD COLUMN permite_impresion BOOLEAN NOT NULL DEFAULT TRUE;

-- Opcional: Crear indice para busquedas rapidas
CREATE INDEX idx_usuarios_permite_impresion ON usuarios(permite_impresion);

-- Verificar la estructura actualizada
DESCRIBE usuarios;

-- Permite crear usuarios que solo trabajan con entregas.
ALTER TABLE usuarios
    MODIFY COLUMN tipo ENUM('superadmin','admin','vendedor','financiamiento','sucursales','delivery') NOT NULL;

-- El rol funcional se controla por tipo delivery; no requiere acceso a modulos administrativos.

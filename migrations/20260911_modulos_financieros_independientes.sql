-- Separate bank ledger and fixed assets from the POS module.
ALTER TABLE modulos
    MODIFY COLUMN categoria ENUM('core', 'pos', 'financiamiento', 'constructora', 'credito', 'catalogo', 'finanzas') NOT NULL DEFAULT 'pos';

INSERT INTO modulos (codigo, nombre, descripcion, categoria, icono, ruta_base, orden, siempre_habilitado, activo)
VALUES
('libro_banco', 'Libro de Banco', 'Gestiona bancos, cuentas y movimientos bancarios.', 'finanzas', 'business-outline', '/admin/finanzas/bancos', 15, FALSE, TRUE),
('activos_fijos', 'Activos Fijos', 'Registra activos, depreciación y valor en libros.', 'finanzas', 'briefcase-outline', '/admin/finanzas/activos', 16, FALSE, TRUE)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    descripcion = VALUES(descripcion),
    categoria = VALUES(categoria),
    icono = VALUES(icono),
    ruta_base = VALUES(ruta_base),
    activo = TRUE;

-- Existing companies keep their current POS access, but these new modules start disabled.
INSERT INTO empresa_modulos (empresa_id, modulo_id, habilitado)
SELECT e.id, m.id, FALSE
FROM empresas e
INNER JOIN modulos m ON m.codigo IN ('libro_banco', 'activos_fijos')
ON DUPLICATE KEY UPDATE habilitado = empresa_modulos.habilitado;

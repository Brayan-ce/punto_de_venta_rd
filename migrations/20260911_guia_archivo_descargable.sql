-- Adds a downloadable-file guide type ("archivo") to guia_contenido.
-- Additive migration: widens the tipo enum and adds an optional column
-- to preserve the original uploaded file name for the download link.

ALTER TABLE guia_contenido
    MODIFY COLUMN tipo ENUM('video', 'video_local', 'texto', 'imagen', 'pdf', 'archivo') NOT NULL;

ALTER TABLE guia_contenido
    ADD COLUMN IF NOT EXISTS nombre_archivo VARCHAR(255) NULL AFTER contenido;

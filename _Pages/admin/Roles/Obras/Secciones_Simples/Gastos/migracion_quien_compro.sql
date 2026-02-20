-- Ejecutar si la tabla gastos_obra_simple ya existe y no tiene quien_compro_id.
-- Si la columna ya existe, este script fallara; en ese caso no es necesario ejecutarlo.
ALTER TABLE gastos_obra_simple
ADD COLUMN quien_compro_id INT NULL AFTER registrado_por,
ADD CONSTRAINT fk_gastos_quien_compro
FOREIGN KEY (quien_compro_id) REFERENCES usuarios(id) ON DELETE SET NULL;

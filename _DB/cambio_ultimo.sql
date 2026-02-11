USE punto_venta_rd;

-- Agregar columna caja_id a la tabla ventas
ALTER TABLE ventas 
ADD COLUMN caja_id INT NULL AFTER usuario_id,
ADD INDEX idx_caja (caja_id),
ADD FOREIGN KEY (caja_id) REFERENCES cajas(id) ON DELETE SET NULL;

-- Opcional: Si quieres vincular ventas antiguas a sus cajas
-- (esto intenta asociar ventas existentes con las cajas del mismo día/usuario)
UPDATE ventas v
INNER JOIN cajas c ON c.empresa_id = v.empresa_id 
    AND c.usuario_id = v.usuario_id 
    AND DATE(v.fecha_venta) = c.fecha_caja
SET v.caja_id = c.id
WHERE v.id > 0 AND v.caja_id IS NULL;
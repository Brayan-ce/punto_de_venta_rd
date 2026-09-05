ALTER TABLE ventas 
MODIFY COLUMN metodo_pago 
ENUM('efectivo','tarjeta_debito','tarjeta_credito','transferencia','cheque','credito','mixto') 
NOT NULL DEFAULT 'efectivo';

CREATE TABLE IF NOT EXISTS ventas_pagos_mixtos (
  id          INT(11)      NOT NULL AUTO_INCREMENT,
  venta_id    INT(11)      NOT NULL,
  metodo_pago ENUM('efectivo','tarjeta_debito','tarjeta_credito','transferencia','cheque','credito') NOT NULL,
  monto       DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  KEY venta_id (venta_id),
  CONSTRAINT fk_vpm_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
);
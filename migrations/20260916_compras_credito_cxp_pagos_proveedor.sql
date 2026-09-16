-- ============================================================================
-- MIGRACIÓN: Compras a crédito + Cuentas por Pagar + Pagos a proveedores
-- Fecha: 2026-09-16
--
-- Ejecutar UNA sola vez, DESPUÉS de tener aplicada la migración de bancos
-- (20260911_bancos_activos_fijos.sql) para que exista cuentas_bancarias.
--
-- Requiere MySQL/MariaDB con InnoDB.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Permitir pago a crédito en compras y guardar su estado de pago
-- ----------------------------------------------------------------------------
ALTER TABLE compras
    MODIFY COLUMN metodo_pago ENUM(
        'efectivo', 'tarjeta_debito', 'tarjeta_credito',
        'transferencia', 'cheque', 'mixto', 'credito'
    ) DEFAULT 'efectivo';

ALTER TABLE compras
    ADD COLUMN tipo_pago ENUM('contado', 'credito') NOT NULL DEFAULT 'contado' AFTER metodo_pago,
    ADD COLUMN monto_pagado DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER tipo_pago,
    ADD COLUMN saldo_pendiente DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER monto_pagado,
    ADD COLUMN fecha_vencimiento DATE NULL AFTER saldo_pendiente;

CREATE INDEX idx_compras_tipo_pago ON compras (empresa_id, tipo_pago);

-- ----------------------------------------------------------------------------
-- 2) Cuentas por pagar (una por compra a crédito)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cuentas_por_pagar (
    id INT NOT NULL AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    compra_id INT NOT NULL,
    proveedor_id INT NOT NULL,
    monto_total DECIMAL(14,2) NOT NULL DEFAULT 0,
    monto_pagado DECIMAL(14,2) NOT NULL DEFAULT 0,
    saldo_pendiente DECIMAL(14,2) NOT NULL DEFAULT 0,
    estado ENUM('pendiente', 'parcial', 'pagada', 'anulada') NOT NULL DEFAULT 'pendiente',
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NULL,
    notas TEXT NULL,
    creado_por INT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_cxp_compra (compra_id),
    KEY idx_cxp_empresa (empresa_id),
    KEY idx_cxp_proveedor (proveedor_id),
    KEY idx_cxp_estado (estado),
    CONSTRAINT fk_cxp_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_cxp_compra FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    CONSTRAINT fk_cxp_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 3) Pagos realizados a proveedores (abonos a las cuentas por pagar)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos_proveedor (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    cxp_id INT NOT NULL,
    compra_id INT NOT NULL,
    proveedor_id INT NOT NULL,
    monto DECIMAL(14,2) NOT NULL,
    metodo_pago ENUM(
        'efectivo', 'transferencia', 'cheque',
        'tarjeta_debito', 'tarjeta_credito', 'otro'
    ) NOT NULL DEFAULT 'transferencia',
    cuenta_bancaria_id INT NULL,
    movimiento_bancario_id BIGINT NULL,
    referencia VARCHAR(100) NULL,
    fecha_pago DATE NOT NULL,
    usuario_id INT NULL,
    nota TEXT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_pagos_prov_empresa (empresa_id),
    KEY idx_pagos_prov_cxp (cxp_id),
    KEY idx_pagos_prov_proveedor (proveedor_id),
    CONSTRAINT fk_pagos_prov_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pagos_prov_cxp FOREIGN KEY (cxp_id) REFERENCES cuentas_por_pagar(id) ON DELETE CASCADE,
    CONSTRAINT fk_pagos_prov_compra FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    CONSTRAINT fk_pagos_prov_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
    CONSTRAINT chk_pagos_prov_monto CHECK (monto > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 4) Nuevo tipo de movimiento bancario: pago a proveedor (egreso)
-- ----------------------------------------------------------------------------
ALTER TABLE movimientos_bancarios
    MODIFY COLUMN tipo ENUM(
        'deposito', 'transferencia_recibida', 'cobro_tarjeta_credito',
        'cobro_tarjeta_debito', 'nota_credito', 'prestamo_banco',
        'cheque_emitido', 'transferencia_realizada', 'retiro',
        'cargo_bancario', 'interes_pagado', 'pago_prestamo', 'ajuste_interno',
        'pago_proveedor'
    ) NOT NULL;

-- ----------------------------------------------------------------------------
-- 5) Rellenar CxP para compras a crédito ya existentes (si hubiera)
-- ----------------------------------------------------------------------------
INSERT INTO cuentas_por_pagar (
    empresa_id, compra_id, proveedor_id, monto_total,
    monto_pagado, saldo_pendiente, estado, fecha_emision, creado_por
)
SELECT
    c.empresa_id, c.id, c.proveedor_id, c.total,
    0, c.total, 'pendiente', DATE(c.fecha_compra), c.usuario_id
FROM compras c
LEFT JOIN cuentas_por_pagar cxp ON cxp.compra_id = c.id
WHERE c.metodo_pago = 'credito'
  AND c.estado <> 'anulada'
  AND cxp.id IS NULL;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================

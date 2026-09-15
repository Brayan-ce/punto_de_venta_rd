-- Financial extensions for bank ledger and fixed assets.
-- Additive migration: does not alter existing sales, purchases or inventory tables.

CREATE TABLE IF NOT EXISTS bancos (
    id INT NOT NULL AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_bancos_empresa (empresa_id),
    CONSTRAINT fk_bancos_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cuentas_bancarias (
    id INT NOT NULL AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    banco_id INT NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    numero VARCHAR(80),
    tipo ENUM('corriente', 'ahorro', 'tarjeta', 'prestamo', 'otra') NOT NULL DEFAULT 'corriente',
    moneda VARCHAR(8) NOT NULL DEFAULT 'DOP',
    saldo_inicial DECIMAL(14,2) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_por INT NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_cuentas_bancarias_empresa (empresa_id),
    KEY idx_cuentas_bancarias_banco (banco_id),
    CONSTRAINT fk_cuentas_bancarias_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_cuentas_bancarias_banco FOREIGN KEY (banco_id) REFERENCES bancos(id),
    CONSTRAINT fk_cuentas_bancarias_usuario FOREIGN KEY (creado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS movimientos_bancarios (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    cuenta_bancaria_id INT NOT NULL,
    tipo ENUM(
        'deposito', 'transferencia_recibida', 'cobro_tarjeta_credito',
        'cobro_tarjeta_debito', 'nota_credito', 'prestamo_banco',
        'cheque_emitido', 'transferencia_realizada', 'retiro',
        'cargo_bancario', 'interes_pagado', 'pago_prestamo', 'ajuste_interno'
    ) NOT NULL,
    concepto VARCHAR(180) NOT NULL,
    referencia VARCHAR(100),
    monto DECIMAL(14,2) NOT NULL,
    fecha_movimiento DATE NOT NULL,
    conciliado TINYINT(1) NOT NULL DEFAULT 0,
    notas TEXT,
    creado_por INT NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_mov_banco_empresa_fecha (empresa_id, fecha_movimiento),
    KEY idx_mov_banco_cuenta_fecha (cuenta_bancaria_id, fecha_movimiento),
    CONSTRAINT fk_mov_banco_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_mov_banco_cuenta FOREIGN KEY (cuenta_bancaria_id) REFERENCES cuentas_bancarias(id) ON DELETE CASCADE,
    CONSTRAINT fk_mov_banco_usuario FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    CONSTRAINT chk_mov_banco_monto CHECK (monto > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categorias_activos_fijos (
    id INT NOT NULL AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    vida_util_meses INT NOT NULL DEFAULT 60,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uk_categoria_activo_empresa (empresa_id, nombre),
    CONSTRAINT fk_categoria_activo_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS activos_fijos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    categoria_id INT NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    descripcion VARCHAR(220) NOT NULL,
    fecha_adquisicion DATE NOT NULL,
    costo_adquisicion DECIMAL(14,2) NOT NULL,
    valor_residual DECIMAL(14,2) NOT NULL DEFAULT 0,
    vida_util_meses INT NOT NULL,
    depreciacion_acumulada DECIMAL(14,2) NOT NULL DEFAULT 0,
    valor_libro DECIMAL(14,2) NOT NULL,
    estado ENUM('activo', 'mantenimiento', 'vendido', 'dado_baja') NOT NULL DEFAULT 'activo',
    proveedor_id INT,
    compra_id INT,
    notas TEXT,
    creado_por INT NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_activo_codigo_empresa (empresa_id, codigo),
    KEY idx_activo_empresa_estado (empresa_id, estado),
    CONSTRAINT fk_activo_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_activo_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_activos_fijos(id),
    CONSTRAINT fk_activo_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
    CONSTRAINT fk_activo_compra FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE SET NULL,
    CONSTRAINT fk_activo_usuario FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    CONSTRAINT chk_activo_costo CHECK (costo_adquisicion >= 0),
    CONSTRAINT chk_activo_vida_util CHECK (vida_util_meses > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS depreciaciones_activos_fijos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    activo_id BIGINT NOT NULL,
    periodo DATE NOT NULL,
    monto DECIMAL(14,2) NOT NULL,
    depreciacion_acumulada DECIMAL(14,2) NOT NULL,
    valor_libro DECIMAL(14,2) NOT NULL,
    registrado_por INT NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_depreciacion_activo_periodo (activo_id, periodo),
    KEY idx_depreciacion_empresa_periodo (empresa_id, periodo),
    CONSTRAINT fk_depreciacion_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_depreciacion_activo FOREIGN KEY (activo_id) REFERENCES activos_fijos(id) ON DELETE CASCADE,
    CONSTRAINT fk_depreciacion_usuario FOREIGN KEY (registrado_por) REFERENCES usuarios(id),
    CONSTRAINT chk_depreciacion_monto CHECK (monto >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

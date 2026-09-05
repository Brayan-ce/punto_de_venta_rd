-- =====================================================
-- MÓDULO DE COTIZACIONES
-- =====================================================

-- Tabla principal de cotizaciones
CREATE TABLE cotizaciones
(
    id                INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id        INT            NOT NULL,
    cliente_id        INT            NULL,
    usuario_id        INT            NOT NULL,

    numero_cotizacion VARCHAR(20)    NOT NULL,
    estado            ENUM (
        'borrador',
        'enviada',
        'aprobada',
        'convertida',
        'vencida',
        'anulada'
        )                                     DEFAULT 'borrador',

    subtotal          DECIMAL(10, 2) NOT NULL,
    descuento         DECIMAL(10, 2)          DEFAULT 0.00,
    monto_gravado     DECIMAL(10, 2) NOT NULL,
    itbis             DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total             DECIMAL(10, 2) NOT NULL,

    fecha_emision     DATE           NOT NULL,
    fecha_vencimiento DATE           NOT NULL,
    observaciones     TEXT,

    venta_id          INT            NULL,
    fecha_conversion  TIMESTAMP      NULL,

    created_at        TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP               DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_empresa (empresa_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_numero (numero_cotizacion),
    INDEX idx_estado (estado),
    INDEX idx_fecha_emision (fecha_emision),
    UNIQUE KEY uk_numero_empresa (numero_cotizacion, empresa_id),

    FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
    FOREIGN KEY (venta_id) REFERENCES ventas (id) ON DELETE SET NULL
);

-- Detalle de productos en cotizaciones
CREATE TABLE cotizacion_detalle
(
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    cotizacion_id        INT            NOT NULL,
    producto_id          INT            NOT NULL,

    nombre_producto      VARCHAR(255)   NOT NULL,
    descripcion_producto TEXT,
    cantidad             DECIMAL(10, 2) NOT NULL,
    precio_unitario      DECIMAL(10, 2) NOT NULL,
    subtotal             DECIMAL(10, 2) NOT NULL,
    aplica_itbis         TINYINT(1)     DEFAULT 1,
    monto_gravado        DECIMAL(10, 2) NOT NULL,
    itbis                DECIMAL(10, 2) DEFAULT 0.00,
    total                DECIMAL(10, 2) NOT NULL,

    created_at           TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_cotizacion (cotizacion_id),
    INDEX idx_producto (producto_id),

    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones (id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE RESTRICT
);

-- =====================================================
-- MÓDULO DE CONDUCES (DESPACHOS)
-- =====================================================

-- Tabla principal de conduces
CREATE TABLE conduces
(
    id              INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id      INT                          NOT NULL,

    -- Origen del conduce
    tipo_origen     ENUM ('venta', 'cotizacion') NOT NULL,
    origen_id       INT                          NOT NULL,
    numero_origen   VARCHAR(50)                  NOT NULL,

    numero_conduce  VARCHAR(20)                  NOT NULL,
    fecha_conduce   DATE                         NOT NULL,

    cliente_id      INT,
    usuario_id      INT                          NOT NULL,

    -- Datos logísticos
    chofer          VARCHAR(100),
    vehiculo        VARCHAR(100),
    placa           VARCHAR(20),

    estado          ENUM ('emitido', 'entregado', 'anulado') DEFAULT 'emitido',
    observaciones   TEXT,

    -- Firma digital (opcional)
    firma_receptor  TEXT,
    nombre_receptor VARCHAR(255),
    fecha_entrega   TIMESTAMP                    NULL,

    created_at      TIMESTAMP                                DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP                                DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_empresa (empresa_id),
    INDEX idx_origen (tipo_origen, origen_id),
    INDEX idx_numero_origen (numero_origen),
    INDEX idx_cliente (cliente_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_fecha (fecha_conduce),
    INDEX idx_estado (estado),
    UNIQUE KEY uk_numero_empresa (numero_conduce, empresa_id),

    FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT
);

-- Detalle de productos en conduces
CREATE TABLE conduce_detalle
(
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    conduce_id          INT            NOT NULL,
    producto_id         INT            NOT NULL,

    nombre_producto     VARCHAR(255)   NOT NULL,
    cantidad_despachada DECIMAL(10, 2) NOT NULL,

    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_conduce (conduce_id),
    INDEX idx_producto (producto_id),

    FOREIGN KEY (conduce_id) REFERENCES conduces (id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE RESTRICT
);

-- Control de saldos por despachar
CREATE TABLE saldo_despacho
(
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id          INT                          NOT NULL,

    tipo_origen         ENUM ('venta', 'cotizacion') NOT NULL,
    origen_id           INT                          NOT NULL,
    producto_id         INT                          NOT NULL,

    cantidad_total      DECIMAL(10, 2)               NOT NULL,
    cantidad_despachada DECIMAL(10, 2) DEFAULT 0.00,
    cantidad_pendiente  DECIMAL(10, 2)               NOT NULL,

    created_at          TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_empresa (empresa_id),
    INDEX idx_origen (tipo_origen, origen_id),
    INDEX idx_producto (producto_id),
    UNIQUE KEY uk_origen_producto (tipo_origen, origen_id, producto_id),

    FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE RESTRICT
);

-- =====================================================
-- CONFIGURACIÓN INICIAL
-- =====================================================

-- Agregar configuración para numeración automática
INSERT INTO settings (empresa_id, name, value)
SELECT id, 'cotizacion_prefijo', 'COT'
FROM empresas;

INSERT INTO settings (empresa_id, name, value)
SELECT id, 'cotizacion_numero_actual', '1'
FROM empresas;

INSERT INTO settings (empresa_id, name, value)
SELECT id, 'conduce_prefijo', 'COND'
FROM empresas;

INSERT INTO settings (empresa_id, name, value)
SELECT id, 'conduce_numero_actual', '1'
FROM empresas;

-- Días de validez por defecto para cotizaciones
INSERT INTO settings (empresa_id, name, value)
SELECT id, 'cotizacion_dias_validez', '15'
FROM empresas;

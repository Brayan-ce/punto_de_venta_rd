-- ============================================================================
-- MIGRACIÓN: MÓDULO DE DEPURACIÓN Y AUDITORÍA DEL SUPERADMINISTRADOR (MariaDB)
-- Fecha: 2025-01-20
-- Compatible con: MariaDB 10.4+
-- ============================================================================

-- =============================
-- 0. EXTENSIONES TABLA EMPRESAS
-- =============================
ALTER TABLE empresas
    ADD COLUMN bloqueada      BOOLEAN      DEFAULT FALSE AFTER activo,
    ADD COLUMN motivo_bloqueo TEXT         NULL AFTER bloqueada,
    ADD COLUMN fecha_bloqueo  DATETIME     NULL AFTER motivo_bloqueo,
    ADD COLUMN bloqueada_por  INT          NULL AFTER fecha_bloqueo,
    ADD CONSTRAINT fk_empresas_bloqueada_por FOREIGN KEY (bloqueada_por) REFERENCES usuarios (id) ON DELETE SET NULL;

-- =============================
-- 1. AUDITORÍA DEL SISTEMA
-- =============================
CREATE TABLE IF NOT EXISTS auditoria_sistema
(
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    modulo                VARCHAR(50)                                                                NOT NULL,
    accion                VARCHAR(100)                                                               NOT NULL,
    tipo_accion           ENUM ('lectura','escritura','eliminacion','fusion','bloqueo','desbloqueo') NOT NULL,

    empresa_id            INT                                                                        NULL,
    entidad_tipo          VARCHAR(50)                                                                NOT NULL,
    entidad_id            INT                                                                        NOT NULL,
    entidad_id_secundaria INT                                                                        NULL,

    usuario_id            INT                                                                        NOT NULL,
    tipo_usuario          ENUM ('superadmin','admin','vendedor')                                     NOT NULL,

    descripcion           TEXT,
    datos_anteriores      JSON,
    datos_nuevos          JSON,

    ip_address            VARCHAR(45),
    user_agent            TEXT,
    fecha_accion          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_modulo (modulo),
    INDEX idx_empresa (empresa_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_fecha (fecha_accion),

    FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- =============================
-- 2. CLIENTES (DEPURACIÓN)
-- =============================
ALTER TABLE clientes
    ADD COLUMN estado              ENUM ('activo','inactivo','fusionado','bloqueado') DEFAULT 'activo',
    ADD COLUMN cliente_padre_id    INT          NULL,
    ADD COLUMN motivo_estado       VARCHAR(255) NULL,
    ADD COLUMN fecha_cambio_estado TIMESTAMP    NULL;

CREATE INDEX idx_clientes_estado ON clientes (estado);
CREATE INDEX idx_clientes_padre ON clientes (cliente_padre_id);

ALTER TABLE clientes
    ADD CONSTRAINT fk_clientes_padre
        FOREIGN KEY (cliente_padre_id) REFERENCES clientes (id) ON DELETE SET NULL;

-- =============================
-- 3. CLIENTES DUPLICADOS
-- =============================
CREATE TABLE IF NOT EXISTS clientes_duplicados_detecciones
(
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    empresa_id           INT                                                       NOT NULL,
    cliente_principal_id INT                                                       NOT NULL,
    cliente_duplicado_id INT                                                       NOT NULL,

    criterio_deteccion   ENUM ('telefono','rnc','email','nombre_similar','manual') NOT NULL,
    similitud_porcentaje DECIMAL(5, 2),

    estado               ENUM ('pendiente','revisado','fusionado','descartado') DEFAULT 'pendiente',
    accion_tomada        VARCHAR(100),

    detectado_por        INT                                                       NULL,
    revisado_por         INT                                                       NULL,

    notas                TEXT,
    fecha_deteccion      TIMESTAMP                                              DEFAULT CURRENT_TIMESTAMP,
    fecha_revision       TIMESTAMP                                                 NULL,
    fecha_accion         TIMESTAMP                                                 NULL,

    UNIQUE KEY uk_duplicados (empresa_id, cliente_principal_id, cliente_duplicado_id),

    FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_principal_id) REFERENCES clientes (id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_duplicado_id) REFERENCES clientes (id) ON DELETE CASCADE,
    FOREIGN KEY (detectado_por) REFERENCES usuarios (id) ON DELETE SET NULL,
    FOREIGN KEY (revisado_por) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- =============================
-- 4. ALERTAS DEL SISTEMA
-- =============================
CREATE TABLE IF NOT EXISTS alertas_sistema
(
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    tipo_alerta      ENUM ('cajas_abiertas_prolongadas','ventas_anomalas','clientes_duplicados','stock_inconsistente','suscripcion_vencida','uso_excesivo','intentos_fallidos','otra') NOT NULL,
    severidad        ENUM ('baja','media','alta','critica')             DEFAULT 'media',

    empresa_id       INT                                                                                                                                                               NULL,
    modulo           VARCHAR(50)                                                                                                                                                       NOT NULL,

    titulo           VARCHAR(255)                                                                                                                                                      NOT NULL,
    descripcion      TEXT                                                                                                                                                              NOT NULL,
    datos_contexto   JSON,

    estado           ENUM ('activa','revisada','resuelta','descartada') DEFAULT 'activa',
    asignada_a       INT                                                                                                                                                               NULL,
    resuelta_por     INT                                                                                                                                                               NULL,

    fecha_generacion TIMESTAMP                                          DEFAULT CURRENT_TIMESTAMP,
    fecha_revision   TIMESTAMP                                                                                                                                                         NULL,
    fecha_resolucion TIMESTAMP                                                                                                                                                         NULL,
    acciones_tomadas TEXT,

    FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE,
    FOREIGN KEY (asignada_a) REFERENCES usuarios (id) ON DELETE SET NULL,
    FOREIGN KEY (resuelta_por) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- =============================
-- 5. SUSCRIPCIONES
-- =============================
CREATE TABLE IF NOT EXISTS empresas_suscripciones
(
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id          INT  NOT NULL UNIQUE,

    plan_nombre         VARCHAR(100)                                                DEFAULT 'Básico',
    plan_tipo           ENUM ('basico','profesional','empresarial','personalizado') DEFAULT 'basico',

    limite_usuarios     INT                                                         DEFAULT 2,
    limite_productos    INT                                                         DEFAULT 500,

    estado              ENUM ('activa','vencida','suspendida','cancelada','prueba') DEFAULT 'prueba',

    fecha_inicio        DATE NOT NULL,
    fecha_vencimiento   DATE NOT NULL,

    monto_mensual       DECIMAL(10, 2)                                              DEFAULT 0.00,
    moneda              VARCHAR(3)                                                  DEFAULT 'DOP',

    dias_gracia         INT                                                         DEFAULT 7,
    en_periodo_gracia   TINYINT(1)                                                  DEFAULT 0,

    fecha_creacion      TIMESTAMP                                                   DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP                                                   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- =============================
-- 6. PAGOS
-- =============================
CREATE TABLE IF NOT EXISTS empresas_pagos
(
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    suscripcion_id INT            NOT NULL,
    empresa_id     INT            NOT NULL,
    monto          DECIMAL(10, 2) NOT NULL,
    metodo_pago    VARCHAR(50)    NOT NULL,
    estado         ENUM ('pendiente','procesado','rechazado','reembolsado') DEFAULT 'pendiente',
    fecha_pago     TIMESTAMP                                                DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (suscripcion_id) REFERENCES empresas_suscripciones (id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- =============================
-- FIN DE MIGRACIÓN
-- =============================

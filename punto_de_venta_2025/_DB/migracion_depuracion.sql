-- ============================================================================
-- MIGRACIÓN COMPLETA: DEPURACIÓN & SUSCRIPCIONES
-- Fecha: 2025-01-20
-- Compatible con: MariaDB 10.4+
-- ============================================================================

USE punto_venta_rd;

-- 1️⃣ AUDITORÍA DEL SISTEMA (BASE)
CREATE TABLE IF NOT EXISTS auditoria_sistema (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entidad VARCHAR(50) NOT NULL COMMENT 'Tabla o módulo afectado',
    entidad_id BIGINT NULL COMMENT 'ID del registro afectado',
    tipo_accion ENUM('CREAR','ACTUALIZAR','ELIMINAR','BLOQUEAR','DESBLOQUEAR','FUSIONAR') NOT NULL,
    empresa_id INT NULL COMMENT 'ID de la empresa afectada',
    descripcion TEXT NULL,
    datos_anteriores LONGTEXT NULL,
    datos_nuevos LONGTEXT NULL,
    usuario_id INT NULL,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entidad (entidad),
    INDEX idx_entidad_id (entidad_id),
    INDEX idx_tipo_accion (tipo_accion),
    INDEX idx_empresa_id (empresa_id),
    INDEX idx_fecha (fecha_accion),
    CONSTRAINT fk_auditoria_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_auditoria_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2️⃣ DEPURACIÓN DE CLIENTES
ALTER TABLE clientes
    ADD COLUMN estado ENUM('activo','inactivo','fusionado','bloqueado') 
        DEFAULT 'activo' AFTER activo,
    ADD COLUMN cliente_principal_id INT NULL AFTER estado,
    ADD COLUMN motivo_fusion TEXT NULL AFTER cliente_principal_id,
    ADD COLUMN fecha_fusion TIMESTAMP NULL AFTER motivo_fusion;

ALTER TABLE clientes
    ADD CONSTRAINT fk_cliente_principal
        FOREIGN KEY (cliente_principal_id)
        REFERENCES clientes(id)
        ON DELETE SET NULL;

CREATE INDEX idx_clientes_estado ON clientes(estado);
CREATE INDEX idx_clientes_principal ON clientes(cliente_principal_id);

-- 3️⃣ BLOQUEO DE EMPRESAS (SUSCRIPCIONES)
ALTER TABLE empresas
    ADD COLUMN bloqueada TINYINT(1) DEFAULT 0 AFTER activo,
    ADD COLUMN motivo_bloqueo TEXT NULL AFTER bloqueada,
    ADD COLUMN fecha_bloqueo DATETIME NULL AFTER motivo_bloqueo,
    ADD COLUMN bloqueada_por INT NULL AFTER fecha_bloqueo;

ALTER TABLE empresas
    ADD CONSTRAINT fk_empresas_bloqueada_por
        FOREIGN KEY (bloqueada_por)
        REFERENCES usuarios(id)
        ON DELETE SET NULL;

CREATE INDEX idx_empresas_bloqueada ON empresas(bloqueada);

-- 4️⃣ TABLA DE SUSCRIPCIONES DE EMPRESAS
CREATE TABLE IF NOT EXISTS empresas_suscripciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    plan_nombre VARCHAR(100) NOT NULL,
    plan_tipo ENUM('basico','profesional','empresarial','personalizado') DEFAULT 'basico',
    estado ENUM('activa','suspendida','cancelada','vencida') DEFAULT 'activa',
    monto_mensual DECIMAL(10,2) NOT NULL,
    moneda CHAR(3) DEFAULT 'DOP',

    fecha_inicio DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    fecha_ultimo_pago DATE NULL,
    fecha_proximo_pago DATE NULL,

    limite_usuarios INT DEFAULT 1,
    limite_productos INT DEFAULT 100,
    limite_ventas_mes INT DEFAULT 1000,

    usuarios_actuales INT DEFAULT 0,
    productos_actuales INT DEFAULT 0,
    ventas_mes_actual INT DEFAULT 0,

    metodo_pago VARCHAR(50) NULL,
    notas_admin TEXT NULL,

    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_suscripcion_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    INDEX idx_suscripcion_estado (estado),
    INDEX idx_suscripcion_fechas (fecha_inicio, fecha_vencimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5️⃣ HISTORIAL DE PAGOS DE SUSCRIPCIONES
CREATE TABLE IF NOT EXISTS empresas_pagos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    suscripcion_id INT NOT NULL,
    empresa_id INT NOT NULL,

    monto DECIMAL(10,2) NOT NULL,
    moneda CHAR(3) DEFAULT 'DOP',
    metodo_pago VARCHAR(50) NOT NULL,

    estado ENUM('pendiente','pagado','fallido','reembolsado') DEFAULT 'pagado',

    periodo_desde DATE NOT NULL,
    periodo_hasta DATE NOT NULL,

    referencia_pago VARCHAR(100) NULL,
    procesado_por INT NULL,

    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_procesamiento TIMESTAMP NULL,

    CONSTRAINT fk_pago_suscripcion
        FOREIGN KEY (suscripcion_id) REFERENCES empresas_suscripciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pago_usuario
        FOREIGN KEY (procesado_por) REFERENCES usuarios(id) ON DELETE SET NULL,

    INDEX idx_pago_estado (estado),
    INDEX idx_pago_fecha (fecha_pago)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6️⃣ TABLA DE REGLAS DEL SISTEMA (DEPURACIÓN AUTOMÁTICA)
CREATE TABLE IF NOT EXISTS sistema_reglas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT NOT NULL,
    valor INT NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Datos iniciales
INSERT INTO sistema_reglas (codigo, descripcion, valor) VALUES
('MAX_DIAS_MORA', 'Días máximos de mora antes de bloquear empresa', 15),
('MAX_CLIENTES_DUPLICADOS', 'Cantidad máxima de clientes duplicados permitidos', 5),
('MAX_INTENTOS_PAGO', 'Intentos de pago antes de suspender', 3);

-- 7️⃣ LOG DE BLOQUEO AUTOMÁTICO
CREATE TABLE IF NOT EXISTS empresas_bloqueos_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    motivo TEXT NOT NULL,
    bloqueada_por INT NULL,
    fecha_bloqueo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bloqueo_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_bloqueo_usuario FOREIGN KEY (bloqueada_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 🧱 FASE 1 – Cambios en Base de Datos

-- 1️⃣ Agregar foto al cliente
ALTER TABLE clientes
ADD COLUMN foto_url VARCHAR(255) NULL
AFTER email;

-- 2️⃣ Crear tabla de crédito por cliente (Versión Profesional)
CREATE TABLE IF NOT EXISTS credito_clientes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    cliente_id INT NOT NULL,
    empresa_id INT NOT NULL,

    limite_credito DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    saldo_utilizado DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    saldo_disponible DECIMAL(12,2)
        GENERATED ALWAYS AS (limite_credito - saldo_utilizado) STORED,

    frecuencia_pago ENUM('semanal','quincenal','mensual','personalizada')
        NOT NULL DEFAULT 'mensual',
    dias_plazo INT DEFAULT 30,

    estado_credito ENUM('normal','atrasado','bloqueado','suspendido')
        NOT NULL DEFAULT 'normal',
    razon_estado VARCHAR(255),

    clasificacion ENUM('A','B','C','D') DEFAULT 'A',
    score_crediticio INT DEFAULT 100,

    fecha_ultima_evaluacion TIMESTAMP NULL,
    fecha_proximo_vencimiento DATE NULL,
    fecha_ultimo_pago TIMESTAMP NULL,

    total_creditos_otorgados INT DEFAULT 0,
    total_creditos_pagados INT DEFAULT 0,
    total_creditos_vencidos INT DEFAULT 0,
    promedio_dias_pago DECIMAL(5,2) DEFAULT 0.00,

    activo TINYINT(1) DEFAULT 1,

    creado_por INT NOT NULL,
    modificado_por INT NULL,

    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_cliente_empresa (cliente_id, empresa_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_estado (estado_credito),
    INDEX idx_clasificacion (clasificacion),

    CONSTRAINT fk_credito_cliente FOREIGN KEY (cliente_id)
        REFERENCES clientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_credito_empresa FOREIGN KEY (empresa_id)
        REFERENCES empresas(id) ON DELETE CASCADE
);

-- Soporte para deliverys, direcciones y ubicaciones historicas.
-- Ejecutar una sola vez en la base de datos de cada empresa.

ALTER TABLE pedidos_online
    ADD COLUMN IF NOT EXISTS cliente_id INT NULL AFTER empresa_id,
    ADD COLUMN IF NOT EXISTS latitud_entrega DECIMAL(10,7) NULL,
    ADD COLUMN IF NOT EXISTS longitud_entrega DECIMAL(10,7) NULL,
    ADD COLUMN IF NOT EXISTS referencia_entrega VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS delivery_id INT NULL,
    ADD COLUMN IF NOT EXISTS fecha_asignacion_delivery DATETIME NULL,
    ADD INDEX IF NOT EXISTS idx_pedidos_delivery (empresa_id, delivery_id, estado),
    ADD INDEX IF NOT EXISTS idx_pedidos_cliente (empresa_id, cliente_id);

CREATE TABLE IF NOT EXISTS direcciones_clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    cliente_id INT NOT NULL,
    alias VARCHAR(100) NOT NULL DEFAULT 'Direccion principal',
    direccion TEXT NOT NULL,
    referencia VARCHAR(500) NULL,
    latitud DECIMAL(10,7) NULL,
    longitud DECIMAL(10,7) NULL,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_ultima_entrega DATETIME NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_direccion_cliente (empresa_id, cliente_id),
    CONSTRAINT fk_direccion_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_direccion_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS entregas_delivery (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    pedido_id INT NOT NULL,
    delivery_id INT NOT NULL,
    direccion_id INT NULL,
    latitud_entrega DECIMAL(10,7) NULL,
    longitud_entrega DECIMAL(10,7) NULL,
    notas TEXT NULL,
    estado ENUM('asignada','en_camino','entregada','incidencia') NOT NULL DEFAULT 'asignada',
    fecha_asignacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_salida DATETIME NULL,
    fecha_entrega DATETIME NULL,
    INDEX idx_entrega_delivery (empresa_id, delivery_id, estado),
    INDEX idx_entrega_pedido (pedido_id),
    CONSTRAINT fk_entrega_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    CONSTRAINT fk_entrega_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos_online(id) ON DELETE CASCADE,
    CONSTRAINT fk_entrega_direccion FOREIGN KEY (direccion_id) REFERENCES direcciones_clientes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Si la migracion anterior ya creo este indice, permitir multiples delivery por pedido.
ALTER TABLE entregas_delivery DROP INDEX IF EXISTS uq_entrega_pedido;

-- ============================================
-- MIGRACION: Modulo Sucursales + Tablas base
-- Fecha: 2026-04-17
-- ============================================

USE punto_venta_rd;

-- 1) Ampliar enum de categoria para incluir 'sucursales'
ALTER TABLE modulos
MODIFY COLUMN categoria ENUM('core', 'pos', 'financiamiento', 'constructora', 'credito', 'catalogo', 'sucursales')
NOT NULL DEFAULT 'pos'
COMMENT 'Categoria del modulo';

-- 2) Registrar modulo de sucursales para habilitarlo por empresa desde superadmin
INSERT INTO modulos (codigo, nombre, descripcion, categoria, icono, ruta_base, orden, siempre_habilitado, activo)
VALUES (
    'sucursales',
    'Sucursales',
    'Gestion de sucursales, stock por sucursal y transferencias entre sucursales',
    'sucursales',
    'git-compare-outline',
    '/admin/sucursales',
    6,
    FALSE,
    TRUE
)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    descripcion = VALUES(descripcion),
    categoria = VALUES(categoria),
    icono = VALUES(icono),
    ruta_base = VALUES(ruta_base),
    orden = VALUES(orden),
    activo = VALUES(activo);

-- 2.1) Habilitar tipo de usuario sucursales
-- Se conserva 'financiamiento' por compatibilidad con instalaciones existentes.
ALTER TABLE usuarios
MODIFY COLUMN tipo ENUM('superadmin','admin','vendedor','financiamiento','sucursales') NOT NULL;

-- 3) Tablas base del rol sucursales
CREATE TABLE IF NOT EXISTS sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(30),
    email VARCHAR(120),
    direccion VARCHAR(300),
    ciudad VARCHAR(120),
    moneda_id INT NULL,
    encargado_usuario_id INT NULL,
    es_principal BOOLEAN DEFAULT FALSE,
    activa BOOLEAN DEFAULT TRUE,
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_sucursal_empresa_codigo (empresa_id, codigo),
    UNIQUE KEY uk_sucursal_empresa_nombre (empresa_id, nombre),
    INDEX idx_sucursal_empresa (empresa_id),
    INDEX idx_sucursal_activa (activa),
    INDEX idx_sucursal_moneda (moneda_id),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (moneda_id) REFERENCES monedas(id) ON DELETE SET NULL,
    FOREIGN KEY (encargado_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios_sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    usuario_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    rol_sucursal ENUM('admin','encargado','cajero','consulta') NOT NULL DEFAULT 'consulta',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_usuario_sucursal (usuario_id, sucursal_id),
    INDEX idx_usuario_sucursal_empresa (empresa_id),
    INDEX idx_usuario_sucursal_usuario (usuario_id),
    INDEX idx_usuario_sucursal_sucursal (sucursal_id),
    INDEX idx_usuario_sucursal_activo (activo),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_sucursal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    producto_id INT NOT NULL,
    stock_actual DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    stock_minimo DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    stock_maximo DECIMAL(14,2) NULL,
    ubicacion VARCHAR(120),
    costo_promedio DECIMAL(14,2) DEFAULT 0.00,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_stock_sucursal_producto (sucursal_id, producto_id),
    INDEX idx_stock_empresa (empresa_id),
    INDEX idx_stock_sucursal (sucursal_id),
    INDEX idx_stock_producto (producto_id),
    INDEX idx_stock_bajo (stock_actual, stock_minimo),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transferencias_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    numero_transferencia VARCHAR(40) NOT NULL,
    sucursal_origen_id INT NOT NULL,
    sucursal_destino_id INT NOT NULL,
    fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_salida DATETIME NULL,
    fecha_recepcion DATETIME NULL,
    estado ENUM('pendiente','aprobada','en_transito','recibida','rechazada','cancelada') NOT NULL DEFAULT 'pendiente',
    prioridad ENUM('baja','normal','alta','urgente') NOT NULL DEFAULT 'normal',
    observacion_origen TEXT,
    observacion_destino TEXT,
    creado_por INT NOT NULL,
    aprobado_por INT NULL,
    recibido_por INT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_transferencia_empresa_numero (empresa_id, numero_transferencia),
    INDEX idx_transferencia_empresa (empresa_id),
    INDEX idx_transferencia_estado (estado),
    INDEX idx_transferencia_origen (sucursal_origen_id),
    INDEX idx_transferencia_destino (sucursal_destino_id),
    INDEX idx_transferencia_fecha (fecha_solicitud),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (sucursal_origen_id) REFERENCES sucursales(id),
    FOREIGN KEY (sucursal_destino_id) REFERENCES sucursales(id),
    FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    FOREIGN KEY (aprobado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (recibido_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_transferencia_origen_destino CHECK (sucursal_origen_id <> sucursal_destino_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transferencias_stock_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transferencia_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad_solicitada DECIMAL(14,2) NOT NULL,
    cantidad_enviada DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    cantidad_recibida DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    costo_unitario DECIMAL(14,2) DEFAULT 0.00,
    subtotal DECIMAL(14,2) GENERATED ALWAYS AS (cantidad_enviada * costo_unitario) STORED,
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_transferencia_producto (transferencia_id, producto_id),
    INDEX idx_detalle_transferencia (transferencia_id),
    INDEX idx_detalle_producto (producto_id),
    FOREIGN KEY (transferencia_id) REFERENCES transferencias_stock(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    CONSTRAINT chk_cantidad_solicitada_pos CHECK (cantidad_solicitada > 0),
    CONSTRAINT chk_cantidad_enviada_pos CHECK (cantidad_enviada >= 0),
    CONSTRAINT chk_cantidad_recibida_pos CHECK (cantidad_recibida >= 0),
    CONSTRAINT chk_cantidad_enviada_lte_solicitada CHECK (cantidad_enviada <= cantidad_solicitada),
    CONSTRAINT chk_cantidad_recibida_lte_enviada CHECK (cantidad_recibida <= cantidad_enviada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimientos_stock_sucursal (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    producto_id INT NOT NULL,
    transferencia_id INT NULL,
    tipo_movimiento ENUM('entrada','salida','ajuste') NOT NULL,
    origen ENUM('transferencia','venta','compra','ajuste_manual','devolucion') NOT NULL DEFAULT 'transferencia',
    cantidad DECIMAL(14,2) NOT NULL,
    stock_anterior DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    stock_nuevo DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    costo_unitario DECIMAL(14,2) DEFAULT 0.00,
    referencia VARCHAR(100),
    observaciones TEXT,
    creado_por INT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mov_empresa_fecha (empresa_id, fecha_creacion),
    INDEX idx_mov_sucursal_producto (sucursal_id, producto_id),
    INDEX idx_mov_transferencia (transferencia_id),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (transferencia_id) REFERENCES transferencias_stock(id) ON DELETE SET NULL,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE VIEW vw_transferencias_resumen AS
SELECT
    t.id,
    t.empresa_id,
    t.numero_transferencia,
    t.estado,
    t.prioridad,
    t.fecha_solicitud,
    so.nombre AS sucursal_origen,
    sd.nombre AS sucursal_destino,
    COUNT(td.id) AS items,
    COALESCE(SUM(td.cantidad_enviada * td.costo_unitario), 0) AS monto_estimado
FROM transferencias_stock t
LEFT JOIN sucursales so ON so.id = t.sucursal_origen_id
LEFT JOIN sucursales sd ON sd.id = t.sucursal_destino_id
LEFT JOIN transferencias_stock_detalle td ON td.transferencia_id = t.id
GROUP BY
    t.id,
    t.empresa_id,
    t.numero_transferencia,
    t.estado,
    t.prioridad,
    t.fecha_solicitud,
    so.nombre,
    sd.nombre;

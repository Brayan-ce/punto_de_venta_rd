-- =====================================================
-- MIGRACIÓN - MÓDULO DE CONDUCES (DESPACHOS)
-- Fecha: 2025-01-26
-- Descripción: Crea las tablas necesarias para el módulo de conduces
-- =====================================================

USE punto_venta_rd;

-- =====================================================
-- 1. CREAR TABLA CONDUCES
-- =====================================================

CREATE TABLE IF NOT EXISTS conduces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    
    -- Origen del conduce
    tipo_origen ENUM('venta', 'cotizacion') NOT NULL,
    origen_id INT NOT NULL,
    numero_origen VARCHAR(50) NOT NULL,
    
    -- Numeración del conduce
    numero_conduce VARCHAR(20) NOT NULL,
    fecha_conduce DATE NOT NULL,
    
    -- Relaciones
    cliente_id INT NULL,
    usuario_id INT NOT NULL,
    
    -- Datos logísticos
    chofer VARCHAR(100) NULL,
    vehiculo VARCHAR(100) NULL,
    placa VARCHAR(20) NULL,
    
    -- Estado y observaciones
    estado ENUM('emitido', 'entregado', 'anulado') DEFAULT 'emitido',
    observaciones TEXT NULL,
    
    -- Firma y entrega
    firma_receptor TEXT NULL,
    nombre_receptor VARCHAR(255) NULL,
    fecha_entrega TIMESTAMP NULL,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_empresa (empresa_id),
    INDEX idx_origen (tipo_origen, origen_id),
    INDEX idx_numero_origen (numero_origen),
    INDEX idx_fecha (fecha_conduce),
    INDEX idx_cliente (cliente_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_estado (estado),
    
    -- Clave única: número de conduce debe ser único por empresa
    UNIQUE KEY uk_numero_empresa (numero_conduce, empresa_id),
    
    -- Foreign Keys
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. CREAR TABLA CONDUCE_DETALLE
-- =====================================================

CREATE TABLE IF NOT EXISTS conduce_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conduce_id INT NOT NULL,
    producto_id INT NOT NULL,
    
    nombre_producto VARCHAR(255) NOT NULL,
    cantidad_despachada DECIMAL(10, 2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_conduce (conduce_id),
    INDEX idx_producto (producto_id),
    
    -- Foreign Keys
    FOREIGN KEY (conduce_id) REFERENCES conduces(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. CREAR TABLA SALDO_DESPACHO
-- =====================================================
-- Esta tabla controla los saldos pendientes de despacho
-- para ventas y cotizaciones

CREATE TABLE IF NOT EXISTS saldo_despacho (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    
    -- Origen del saldo (venta o cotización)
    tipo_origen ENUM('venta', 'cotizacion') NOT NULL,
    origen_id INT NOT NULL,
    producto_id INT NOT NULL,
    
    -- Control de cantidades
    cantidad_total DECIMAL(10, 2) NOT NULL,
    cantidad_despachada DECIMAL(10, 2) DEFAULT 0.00,
    cantidad_pendiente DECIMAL(10, 2) NOT NULL,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_empresa (empresa_id),
    INDEX idx_origen (tipo_origen, origen_id),
    INDEX idx_producto (producto_id),
    
    -- Clave única: un producto solo puede tener un saldo por origen
    UNIQUE KEY uk_origen_producto (tipo_origen, origen_id, producto_id),
    
    -- Foreign Keys
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. CONFIGURACIONES INICIALES
-- =====================================================

-- Agregar configuración para prefijo de conduces
INSERT IGNORE INTO settings (empresa_id, name, value)
SELECT id, 'conduce_prefijo', 'COND'
FROM empresas;

-- Agregar configuración para número actual de conduces
INSERT IGNORE INTO settings (empresa_id, name, value)
SELECT id, 'conduce_numero_actual', '1'
FROM empresas;

-- =====================================================
-- 5. VERIFICACIÓN
-- =====================================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
    'Migración completada' as estado,
    COUNT(*) as tablas_creadas
FROM information_schema.tables
WHERE table_schema = 'punto_venta_rd'
AND table_name IN (
    'conduces',
    'conduce_detalle',
    'saldo_despacho'
);

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================


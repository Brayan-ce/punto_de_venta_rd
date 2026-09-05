-- =====================================================
-- MIGRACIÓN: Catálogo Online Superadministrador
-- Fecha: 2026-01-04
-- Descripción: Tablas para catálogo online del superadministrador
-- =====================================================

-- =====================================================
-- TABLA: catalogo_superadmin_config
-- Propósito: Configuración del catálogo público del superadministrador
-- =====================================================
CREATE TABLE IF NOT EXISTS catalogo_superadmin_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_catalogo VARCHAR(255) DEFAULT 'Tienda Online',
    descripcion TEXT,
    logo_url VARCHAR(500),
    color_primario VARCHAR(50) DEFAULT '#FF6B35',
    color_secundario VARCHAR(50) DEFAULT '#004E89',
    activo BOOLEAN DEFAULT TRUE,
    url_slug VARCHAR(255) UNIQUE DEFAULT 'tienda',
    whatsapp VARCHAR(50),
    direccion TEXT,
    horario VARCHAR(255),
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_slug (url_slug),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar configuración inicial si no existe
INSERT INTO catalogo_superadmin_config (nombre_catalogo, url_slug, activo)
VALUES ('Tienda Online', 'tienda', FALSE)
ON DUPLICATE KEY UPDATE nombre_catalogo = VALUES(nombre_catalogo);

-- =====================================================
-- TABLA: superadmin_productos_catalogo
-- Propósito: Productos específicos del catálogo del superadministrador
-- =====================================================
CREATE TABLE IF NOT EXISTS superadmin_productos_catalogo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria_id INT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    precio_oferta DECIMAL(10,2) NULL,
    fecha_inicio_oferta DATETIME NULL,
    fecha_fin_oferta DATETIME NULL,
    stock INT DEFAULT 0,
    stock_minimo INT DEFAULT 0,
    imagen_url VARCHAR(500),
    sku VARCHAR(100),
    destacado BOOLEAN DEFAULT FALSE,
    visible_catalogo BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    INDEX idx_categoria (categoria_id),
    INDEX idx_activo (activo),
    INDEX idx_destacado (destacado),
    INDEX idx_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: pedidos_superadmin
-- Propósito: Pedidos realizados desde el catálogo del superadministrador
-- =====================================================
CREATE TABLE IF NOT EXISTS pedidos_superadmin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_pedido VARCHAR(50) UNIQUE,
    cliente_nombre VARCHAR(255) NOT NULL,
    cliente_telefono VARCHAR(50) NOT NULL,
    cliente_email VARCHAR(255),
    cliente_direccion TEXT,
    metodo_pago ENUM('efectivo', 'transferencia', 'tarjeta', 'contra_entrega') DEFAULT 'contra_entrega',
    metodo_entrega ENUM('pickup', 'delivery') DEFAULT 'pickup',
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    impuesto DECIMAL(10,2) DEFAULT 0,
    envio DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente', 'confirmado', 'en_proceso', 'listo', 'entregado', 'cancelado') DEFAULT 'pendiente',
    notas TEXT,
    fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_confirmacion DATETIME NULL,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_pedido),
    INDEX idx_numero (numero_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: pedidos_superadmin_items
-- Propósito: Items de cada pedido del catálogo del superadministrador
-- =====================================================
CREATE TABLE IF NOT EXISTS pedidos_superadmin_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pedido_id) REFERENCES pedidos_superadmin(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES superadmin_productos_catalogo(id) ON DELETE CASCADE,
    INDEX idx_pedido (pedido_id),
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- NOTAS
-- =====================================================
-- 1. catalogo_superadmin_config: Solo una configuración global del catálogo del superadmin
-- 2. superadmin_productos_catalogo: Productos específicos creados por el superadmin para su catálogo
-- 3. pedidos_superadmin: Pedidos realizados desde el catálogo del superadmin
-- 4. Los pedidos se envían al WhatsApp del superadmin (desde plataforma_config.telefono_whatsapp)
-- 5. El catálogo del superadmin es independiente de las empresas


-- =====================================================
-- MIGRACIÓN: Catálogo Online B2C + Tienda B2B IsiWeek
-- Fecha: 2026-01-04
-- Descripción: Tablas para catálogo online y tienda B2B
-- =====================================================

-- =====================================================
-- PARTE A: CATÁLOGO ONLINE B2C
-- =====================================================

-- Tabla: catalogo_config
-- Propósito: Configuración general del catálogo por empresa
CREATE TABLE IF NOT EXISTS catalogo_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    nombre_catalogo VARCHAR(255),
    descripcion TEXT,
    logo_url VARCHAR(500),
    color_primario VARCHAR(50) DEFAULT '#FF6B35',
    color_secundario VARCHAR(50) DEFAULT '#004E89',
    activo BOOLEAN DEFAULT TRUE,
    url_slug VARCHAR(255) UNIQUE,
    whatsapp VARCHAR(50),
    direccion TEXT,
    horario VARCHAR(255),
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    INDEX idx_empresa (empresa_id),
    INDEX idx_slug (url_slug),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: productos_catalogo
-- Propósito: Extiende la tabla productos con información específica del catálogo online
CREATE TABLE IF NOT EXISTS productos_catalogo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    empresa_id INT NOT NULL,
    visible_catalogo BOOLEAN DEFAULT FALSE,
    precio_catalogo DECIMAL(10,2),
    precio_oferta DECIMAL(10,2),
    fecha_inicio_oferta DATETIME,
    fecha_fin_oferta DATETIME,
    destacado BOOLEAN DEFAULT FALSE,
    orden_visual INT DEFAULT 0,
    descripcion_corta TEXT,
    stock_visible BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    INDEX idx_producto (producto_id),
    INDEX idx_empresa (empresa_id),
    INDEX idx_visible (visible_catalogo, activo),
    INDEX idx_destacado (destacado, activo),
    UNIQUE KEY uk_producto_empresa (producto_id, empresa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: pedidos_online
-- Propósito: Almacena los pedidos realizados desde el catálogo online
CREATE TABLE IF NOT EXISTS pedidos_online (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_pedido VARCHAR(50) UNIQUE,
    empresa_id INT NOT NULL,
    cliente_nombre VARCHAR(255),
    cliente_telefono VARCHAR(50),
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
    venta_id INT NULL,
    fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_confirmacion DATETIME NULL,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL,
    INDEX idx_empresa (empresa_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_pedido),
    INDEX idx_numero (numero_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: pedidos_online_items
-- Propósito: Almacena los productos de cada pedido online
CREATE TABLE IF NOT EXISTS pedidos_online_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pedido_id) REFERENCES pedidos_online(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    INDEX idx_pedido (pedido_id),
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PARTE B: TIENDA B2B ISIWEEK
-- =====================================================

-- Tabla: isiweek_categorias
-- Propósito: Categorías para productos B2B de IsiWeek
CREATE TABLE IF NOT EXISTS isiweek_categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    orden INT DEFAULT 0,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_activo (activo),
    INDEX idx_orden (orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: isiweek_productos
-- Propósito: Productos que IsiWeek vende a las empresas (insumos, equipos, servicios)
CREATE TABLE IF NOT EXISTS isiweek_productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria_id INT,
    precio DECIMAL(10,2) NOT NULL,
    precio_volumen DECIMAL(10,2) NULL,
    cantidad_volumen INT NULL,
    stock INT DEFAULT 0,
    imagen_url VARCHAR(500),
    sku VARCHAR(100),
    tiempo_entrega VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    destacado BOOLEAN DEFAULT FALSE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (categoria_id) REFERENCES isiweek_categorias(id) ON DELETE SET NULL,
    INDEX idx_categoria (categoria_id),
    INDEX idx_activo (activo),
    INDEX idx_destacado (destacado),
    INDEX idx_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: pedidos_b2b
-- Propósito: Pedidos realizados por empresas en la tienda B2B de IsiWeek
CREATE TABLE IF NOT EXISTS pedidos_b2b (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_pedido VARCHAR(50) UNIQUE,
    empresa_id INT NOT NULL,
    usuario_id INT NOT NULL,
    metodo_pago ENUM('contra_entrega', 'transferencia', 'credito') DEFAULT 'contra_entrega',
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    impuesto DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente', 'confirmado', 'en_proceso', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente',
    notas TEXT,
    fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_confirmacion DATETIME NULL,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_empresa (empresa_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_pedido),
    INDEX idx_numero (numero_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: pedidos_b2b_items
-- Propósito: Items de cada pedido B2B
CREATE TABLE IF NOT EXISTS pedidos_b2b_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    precio_aplicado DECIMAL(10,2) NOT NULL COMMENT 'Precio aplicado (puede ser precio_volumen si aplica)',
    descuento DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pedido_id) REFERENCES pedidos_b2b(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES isiweek_productos(id) ON DELETE CASCADE,
    INDEX idx_pedido (pedido_id),
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar categorías iniciales para IsiWeek B2B
INSERT INTO isiweek_categorias (nombre, descripcion, activo, orden) VALUES
('Suministros', 'Papel térmico, rollos y consumibles', TRUE, 1),
('Equipos', 'Impresoras, gavetas, escáneres y hardware', TRUE, 2),
('Licencias', 'Licencias de software y suscripciones', TRUE, 3),
('Accesorios', 'Accesorios y componentes adicionales', TRUE, 4),
('Servicios', 'Servicios técnicos y soporte', TRUE, 5)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- =====================================================
-- NOTAS
-- =====================================================
-- 1. Las tablas catalogo_config y productos_catalogo se vinculan con empresas y productos existentes
-- 2. Los pedidos_online se pueden convertir en ventas (campo venta_id)
-- 3. Los pedidos_b2b son gestionados por IsiWeek (superadmin)
-- 4. Las categorías B2B ya incluyen datos iniciales
-- 5. Los índices están optimizados para consultas frecuentes

